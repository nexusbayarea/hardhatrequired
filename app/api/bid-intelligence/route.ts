import { NextRequest, NextResponse } from 'next/server';
import { bidIntelligenceIndex } from '@/lib/market/indexes/bid-intelligence';
import { VERTICAL_REGISTRY } from '@/lib/market/registry';
import { finalizeAuth } from '@/lib/auth/finalization';
import { getStateFromZip } from '@/lib/market/providers/base';

// POST /api/bid-intelligence
// Search for open bids and RFPs for a given vertical and location.
//
// Body:
//   verticalId:  string         — e.g. 'slurry_concrete'
//   zip:         string         — search ZIP code (used to derive state)
//   sources?:    BidSource[]    — filter by source type
//   activeOnly?: boolean        — only return open/closing_soon bids

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

  const { verticalId, zip, sources, activeOnly } = body as {
    verticalId?: string;
    zip?: string;
    sources?: string[];
    activeOnly?: boolean;
  };

  if (!verticalId || !zip) {
    return NextResponse.json(
      { error: 'verticalId and zip are required' },
      { status: 400 }
    );
  }

  const config = VERTICAL_REGISTRY[verticalId];
  if (!config) {
    return NextResponse.json(
      { error: `Unknown vertical: ${verticalId}` },
      { status: 404 }
    );
  }

  const state = getStateFromZip(zip);
  const start = Date.now();

  try {
    const results = await bidIntelligenceIndex.search({
      verticalConfig: config,
      state,
      zip,
      sources: sources as any,
      activeOnly,
    });

    return NextResponse.json({
      results,
      meta: {
        total: results.length,
        verticalId,
        state,
        zip,
        executionMs: Date.now() - start,
      },
    });
  } catch (err) {
    console.error('[/api/bid-intelligence] Error:', err);
    return NextResponse.json({ error: 'Bid search failed' }, { status: 500 });
  }
}
