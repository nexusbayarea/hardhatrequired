import { NextRequest, NextResponse } from 'next/server';
import { TomTomProvider } from '@/lib/market/providers/tomtom-search';
import { VERTICAL_REGISTRY } from '@/lib/market/registry';
import { finalizeAuth } from '@/lib/auth/finalization';
import { geocodeZip } from '@/lib/geo';
import { EquipmentRentalResult } from '@/types/indexes';

// POST /api/equipment-rental
// Search the Equipment Rental Index for vac trucks, hydrovacs, generators,
// shoring, lifts, and heavy equipment near a ZIP code.
//
// Body:
//   verticalId:      string           — e.g. 'hydro_excavation'
//   zip:             string           — search ZIP code
//   radiusMiles?:    number           — default 80 (equipment travels further)
//   equipmentTypes?: string[]         — filter by type: vac_truck | hydrovac | generator | etc.
//   operatorIncluded?: boolean        — only return wet-hire / operated rentals
//   deliveryAvailable?: boolean       — only return delivery-capable vendors

export async function POST(req: NextRequest) {
  const auth = await finalizeAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    verticalId,
    zip,
    radiusMiles = 80,
    equipmentTypes,
    operatorIncluded,
    deliveryAvailable,
  } = body as {
    verticalId?: string;
    zip?: string;
    radiusMiles?: number;
    equipmentTypes?: string[];
    operatorIncluded?: boolean;
    deliveryAvailable?: boolean;
  };

  if (!verticalId || !zip) {
    return NextResponse.json({ error: 'verticalId and zip are required' }, { status: 400 });
  }

  const config = VERTICAL_REGISTRY[verticalId];
  if (!config) {
    return NextResponse.json({ error: `Unknown vertical: ${verticalId}` }, { status: 404 });
  }

  const start = Date.now();

  let coords: { lat: number; lng: number } | null = null;
  try {
    coords = await geocodeZip(zip);
  } catch {
    return NextResponse.json({ error: `Could not geocode ZIP: ${zip}` }, { status: 400 });
  }
  if (!coords) {
    return NextResponse.json({ error: `Could not geocode ZIP: ${zip}` }, { status: 400 });
  }

  const tomtom = new TomTomProvider();
  const radiusMeters = radiusMiles * 1609.34;

  let rawResults: Partial<EquipmentRentalResult>[] = [];
  try {
    rawResults = await tomtom.searchEquipmentRental({
      lat: coords.lat,
      lng: coords.lng,
      radiusMeters,
      verticalId,
      query: `${config.industryName} equipment rental`,
    });
  } catch (err) {
    console.error('[/api/equipment-rental] TomTom search failed:', err);
  }

  // Score by equipment keyword overlap with vertical's equipment keywords
  const verticalEquipmentSet = new Set(
    config.equipmentKeywords.map((k) => k.toLowerCase())
  );

  const scored: EquipmentRentalResult[] = rawResults
    .map((r) => {
      let score = 40; // base — has at least one relevant equipment type

      // Bonus: equipment type matches vertical equipment keywords
      const typeMatches = (r.equipmentTypes ?? []).filter((t) =>
        [...verticalEquipmentSet].some((kw) => t.toLowerCase().includes(kw.split(' ')[0]))
      ).length;
      score += typeMatches * 15;

      // Profile bonuses
      if (r.phone)   score += 10;
      if (r.website) score += 10;

      // Distance scoring
      if (r.distanceMiles !== undefined) {
        if (r.distanceMiles <= 20)       score += 15;
        else if (r.distanceMiles <= 50)  score += 8;
      }

      // Delivery bonus
      if (r.deliveryAvailable) score += 5;

      score = Math.min(100, Math.max(0, score));
      const grade =
        score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D';

      return { ...r, score, grade, matchedSignals: [] } as EquipmentRentalResult;
    })
    .filter((r) => r.grade !== 'D')
    .filter((r) => !equipmentTypes?.length ||
      r.equipmentTypes?.some((t) => equipmentTypes.includes(t)))
    .filter((r) => operatorIncluded === undefined || r.operatorIncluded === operatorIncluded)
    .filter((r) => deliveryAvailable === undefined || r.deliveryAvailable === deliveryAvailable)
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({
    results: scored,
    meta: {
      total: scored.length,
      verticalId,
      zip,
      radiusMiles,
      executionMs: Date.now() - start,
    },
  });
}
