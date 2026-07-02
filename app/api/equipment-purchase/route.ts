import { NextRequest, NextResponse } from 'next/server';
import { TomTomProvider } from '@/lib/market/providers/tomtom-search';
import { VERTICAL_REGISTRY } from '@/lib/market/registry';
import { finalizeAuth } from '@/lib/auth/finalization';
import { geocodeZip } from '@/lib/geo';
import { EquipmentPurchaseResult, PurchaseCategory } from '@/types/indexes';

// POST /api/equipment-purchase
// Search the Equipment Purchase Index for dealers, used equipment, auctions,
// and manufacturers relevant to a vertical.
//
// Body:
//   verticalId:           string             — e.g. 'hydro_excavation'
//   zip:                  string             — search ZIP code
//   radiusMiles?:         number             — default 150 (buyers travel for purchases)
//   category?:            PurchaseCategory   — dealer | used_equipment | auction | manufacturer
//   financingAvailable?:  boolean
//   acceptsTrades?:       boolean

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
    radiusMiles = 150,
    category,
    financingAvailable,
    acceptsTrades,
  } = body as {
    verticalId?: string;
    zip?: string;
    radiusMiles?: number;
    category?: PurchaseCategory;
    financingAvailable?: boolean;
    acceptsTrades?: boolean;
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

  // Equipment purchase uses the same TomTom heavy equipment categories as rental
  // but maps them to dealer/used/auction/manufacturer context
  const tomtom = new TomTomProvider();
  const radiusMeters = radiusMiles * 1609.34;

  let rentalRaw: Partial<EquipmentPurchaseResult>[] = [];
  try {
    // Re-use TomTom equipment search; we'll reclassify as purchase context
    const rental = await tomtom.searchEquipmentRental({
      lat: coords.lat,
      lng: coords.lng,
      radiusMeters,
      verticalId,
      query: `${config.industryName} equipment dealer`,
    });

    // Map rental results to purchase format
    rentalRaw = rental.map((r) => ({
      index: 'equipment_purchase' as const,
      id: `purchase-${r.id}`,
      name: r.name,
      address: r.address,
      city: r.city,
      state: r.state,
      zip: r.zip,
      phone: r.phone,
      website: r.website,
      latitude: r.latitude,
      longitude: r.longitude,
      distanceMiles: r.distanceMiles,
      category: classifyPurchaseCategory(r.name ?? ''),
      serviceCenter: true,
      source: r.source,
      verticalId,
      score: 0,
      grade: 'D' as const,
      matchedSignals: [],
      createdAt: r.createdAt ?? new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[/api/equipment-purchase] TomTom search failed:', err);
  }

  // Score
  const scored: EquipmentPurchaseResult[] = rentalRaw
    .map((r) => {
      let score = 40;

      if (r.phone)   score += 10;
      if (r.website) score += 15;
      if (r.serviceCenter) score += 10;

      // Distance — buyers tolerate further travel for purchase
      if (r.distanceMiles !== undefined) {
        if (r.distanceMiles <= 50)       score += 15;
        else if (r.distanceMiles <= 100) score += 8;
      }

      // Category bonuses
      if (r.category === 'dealer')       score += 10;
      if (r.category === 'manufacturer') score += 15;

      score = Math.min(100, Math.max(0, score));
      const grade =
        score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D';

      return { ...r, score, grade } as EquipmentPurchaseResult;
    })
    .filter((r) => r.grade !== 'D')
    .filter((r) => !category || r.category === category)
    .filter((r) => financingAvailable === undefined || r.financingAvailable === financingAvailable)
    .filter((r) => acceptsTrades === undefined || r.acceptsTrades === acceptsTrades)
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

// ─── Helper ───────────────────────────────────────────────────────────────────

function classifyPurchaseCategory(name: string): PurchaseCategory {
  const n = name.toLowerCase();
  if (n.includes('auction') || n.includes('ritchie') || n.includes('ironplanet')) return 'auction';
  if (n.includes('used') || n.includes('pre-owned') || n.includes('surplus')) return 'used_equipment';
  if (n.includes('manufacturing') || n.includes('manufacturer') || n.includes('industries')) return 'manufacturer';
  return 'dealer';
}
