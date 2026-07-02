import { NextRequest, NextResponse } from 'next/server';
import { finalizeAuth } from '@/lib/auth/finalization';
import { VERTICAL_REGISTRY } from '@/lib/market/registry';
import { HHRSearchRequest, HHRSearchResponse, HHRIndexType } from '@/types/indexes';

// POST /api/search/hhr
// Unified multi-index search. Fans out to all requested indexes in parallel
// and returns a combined response.
//
// Body: HHRSearchRequest
//   indexes:      HHRIndexType[]   — which indexes to search
//   verticalId:   string           — e.g. 'slurry_concrete'
//   zip:          string
//   radiusMiles?: number           — default 50
//   query?:       string           — optional freetext query
//   filters?:     object           — per-index filter overrides
//
// This is the entry point for the HHR platform frontend.
// The individual index routes (/api/labor, /api/disposal, etc.) can also be
// called directly for single-index searches.

const INDEX_ROUTES: Record<HHRIndexType, string> = {
  labor:              '/api/labor',
  disposal:           '/api/disposal',
  equipment_rental:   '/api/equipment-rental',
  equipment_purchase: '/api/equipment-purchase',
  bid_intelligence:   '/api/bid-intelligence',
  compliance:         '/api/compliance',
};

export async function POST(req: NextRequest) {
  const auth = await finalizeAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: HHRSearchRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { indexes, verticalId, zip, radiusMiles = 50, filters = {} } = body;

  if (!verticalId || !zip || !indexes?.length) {
    return NextResponse.json(
      { error: 'indexes, verticalId, and zip are required' },
      { status: 400 }
    );
  }

  if (!VERTICAL_REGISTRY[verticalId]) {
    return NextResponse.json({ error: `Unknown vertical: ${verticalId}` }, { status: 404 });
  }

  const start = Date.now();
  const baseUrl = req.nextUrl.origin;

  // Fan out to each requested index in parallel
  const indexTasks = indexes.map(async (indexType) => {
    const route = INDEX_ROUTES[indexType];
    if (!route) return { indexType, results: [], error: 'Unknown index' };

    try {
      const res = await fetch(`${baseUrl}${route}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward auth cookie so each sub-route authenticates correctly
          Cookie: req.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({
          verticalId,
          zip,
          radiusMiles,
          ...(filters[indexType] ?? {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        return { indexType, results: [], error: err.error ?? res.statusText };
      }

      const data = await res.json();
      return { indexType, results: data.results ?? [], error: null };
    } catch (err) {
      console.error(`[HHR search] Index ${indexType} failed:`, err);
      return { indexType, results: [], error: String(err) };
    }
  });

  const settled = await Promise.allSettled(indexTasks);

  // Assemble response
  const response: Partial<HHRSearchResponse> & { errors?: Record<string, string> } = {
    meta: {
      totalResults: 0,
      byIndex: {} as Record<HHRIndexType, number>,
      executionMs: Date.now() - start,
      zip,
      radiusMiles,
      verticalId,
    },
  };

  const errors: Record<string, string> = {};

  for (const result of settled) {
    if (result.status === 'rejected') continue;

    const { indexType, results, error } = result.value;

    if (error) {
      errors[indexType] = error;
    }

    (response as any)[indexType] = results;
    response.meta!.byIndex[indexType as HHRIndexType] = results.length;
    response.meta!.totalResults += results.length;
  }

  if (Object.keys(errors).length > 0) {
    response.errors = errors;
  }

  return NextResponse.json(response);
}
