import { NextRequest, NextResponse } from 'next/server';
import { TomTomProvider } from '@/lib/market/providers/tomtom-search';
import { VERTICAL_REGISTRY } from '@/lib/market/registry';
import { finalizeAuth } from '@/lib/auth/finalization';
import { geocodeZip } from '@/lib/geo';
import { calculateLeadScore, buildAnalysisText } from '@/lib/market/scoring';
import { LaborResult } from '@/types/indexes';

// POST /api/labor
// Search the Labor Index for certified contractors, crews, and inspectors.
//
// Body:
//   verticalId:   string   — e.g. 'slurry_concrete'
//   zip:          string   — search ZIP code
//   radiusMiles?: number   — default 50
//   category?:   string   — filter: certified_contractor | operator | specialty_crew | inspector | engineer

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

  const { verticalId, zip, radiusMiles = 50, category } = body as {
    verticalId?: string;
    zip?: string;
    radiusMiles?: number;
    category?: string;
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

  // Geocode ZIP
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

  // Parallel: TomTom discovery (extend here with state license DBs per vertical)
  const [tomtomResults] = await Promise.allSettled([
    tomtom.searchLabor({
      lat: coords.lat,
      lng: coords.lng,
      radiusMeters,
      verticalId,
      query: config.searchQueries[0],
    }),
  ]);

  const rawResults: Partial<LaborResult>[] =
    tomtomResults.status === 'fulfilled' ? tomtomResults.value : [];

  // Score each result against the vertical config
  const scored: LaborResult[] = rawResults
    .map((r) => {
      const analysisText = buildAnalysisText(r as any);
      const scoreResult = calculateLeadScore(r as any, config, analysisText, r.distanceMiles);

      return {
        ...r,
        score: scoreResult.score,
        grade: scoreResult.priority,
        matchedSignals: scoreResult.matchedSignals,
      } as LaborResult;
    })
    .filter((r) => r.grade !== 'D')
    .filter((r) => !category || r.category === category)
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
