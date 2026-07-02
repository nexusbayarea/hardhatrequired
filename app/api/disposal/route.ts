import { NextRequest, NextResponse } from 'next/server';
import { OverpassProvider } from '@/lib/market/providers/overpass-search';
import { VERTICAL_REGISTRY } from '@/lib/market/registry';
import { finalizeAuth } from '@/lib/auth/finalization';
import { geocodeZip } from '@/lib/geo';
import { DisposalResult } from '@/types/indexes';

// POST /api/disposal
// Search the Disposal Index for landfills, recyclers, treatment facilities,
// waste processors, and EPA disposal sites near a ZIP code.
//
// Body:
//   verticalId:   string   — e.g. 'slurry_concrete'
//   zip:          string   — search ZIP code
//   radiusMiles?: number   — default 75 (disposal sites serve wider areas)
//   category?:   string   — filter: landfill | recycler | treatment_facility | waste_processor | epa_disposal_site
//   hazmatOnly?: boolean  — only return hazmat-certified facilities

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

  const { verticalId, zip, radiusMiles = 75, category, hazmatOnly } = body as {
    verticalId?: string;
    zip?: string;
    radiusMiles?: number;
    category?: string;
    hazmatOnly?: boolean;
  };

  if (!verticalId || !zip) {
    return NextResponse.json(
      { error: 'verticalId and zip are required' },
      { status: 400 }
    );
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

  const overpass = new OverpassProvider();
  const radiusMeters = radiusMiles * 1609.34;

  let results: Partial<DisposalResult>[] = [];
  try {
    results = await overpass.searchDisposal({
      lat: coords.lat,
      lng: coords.lng,
      radiusMeters,
      verticalId,
    });
  } catch (err) {
    console.error('[/api/disposal] Overpass search failed:', err);
    // Return empty rather than 500 — Overpass is best-effort
  }

  // Apply filters and assign basic scores
  // (Disposal results get a fixed score based on category relevance to vertical)
  const DISPOSAL_SCORE_MAP: Record<string, number> = {
    epa_disposal_site:   90,
    treatment_facility:  80,
    waste_processor:     70,
    recycler:            65,
    landfill:            60,
  };

  // Identify which disposal categories are most relevant for this vertical
  // by checking the vertical's primary signals for waste-related terms
  const hasWastewaterSignal = config.signals.primary.some(
    (s) => s.term.toLowerCase().includes('wastewater') || s.term.toLowerCase().includes('sewer')
  );
  const hasHazmatSignal = config.signals.primary.some(
    (s) =>
      s.term.toLowerCase().includes('hazard') ||
      s.term.toLowerCase().includes('asbestos') ||
      s.term.toLowerCase().includes('medical')
  );

  const scored: DisposalResult[] = results
    .map((r) => {
      let score = DISPOSAL_SCORE_MAP[r.category ?? 'landfill'] ?? 50;

      // Bonus: hazmat certified when vertical needs it
      if (hasHazmatSignal && r.hazmatCertified) score += 15;

      // Bonus: wastewater plant when vertical generates wastewater
      if (hasWastewaterSignal && r.category === 'treatment_facility') score += 10;

      // Distance penalty: disposal sites > 50mi are significantly less useful
      if (r.distanceMiles && r.distanceMiles > 50) score -= 10;

      score = Math.min(100, Math.max(0, score));

      return {
        ...r,
        score,
        grade: score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D',
      } as DisposalResult;
    })
    .filter((r) => r.grade !== 'D')
    .filter((r) => !category || r.category === category)
    .filter((r) => !hazmatOnly || r.hazmatCertified)
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({
    results: scored,
    meta: {
      total: scored.length,
      verticalId,
      zip,
      radiusMiles,
      executionMs: Date.now() - start,
      source: 'overpass_osm',
    },
  });
}
