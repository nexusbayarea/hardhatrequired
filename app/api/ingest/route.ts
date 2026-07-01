import { NextRequest, NextResponse } from 'next/server';
import { IndexIntelligenceEngine } from '@/lib/market/adapter';
import { VERTICAL_REGISTRY } from '@/lib/market/registry';
import { withTimeout } from '@/lib/timeouts';
import { redis, redisAvailable } from '@/lib/redis';
import type { SearchResult } from '@/types/search';

const SEARCH_CACHE_TTL = 60 * 10;

function searchCacheKey(tenant: string, zip: string): string {
  return `search:${tenant}:${zip}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.zip || !body.radius || !body.vertical) {
      return NextResponse.json({ error: 'Missing required fields: zip, radius, vertical' }, { status: 400 });
    }

    const config = VERTICAL_REGISTRY[body.vertical];
    if (!config) {
      return NextResponse.json({ error: `Unknown vertical: ${body.vertical}` }, { status: 404 });
    }

    console.log(`[INGEST] Starting pre-warm for ${body.vertical}/${body.zip} (${body.radius}mi)`);

    const engine = new IndexIntelligenceEngine();
    const start = Date.now();

    const result = await withTimeout(
      engine.executeMarketDiscovery({ zip: body.zip, radius: body.radius }, config),
      120000,
      () => { throw new Error('Ingestion timeout after 120 seconds'); }
    );

    const { companies, providerFailures } = result;
    const elapsed = Date.now() - start;

    const normalized: SearchResult[] = companies.map((c: any) => ({
      id: c.id,
      companyName: c.companyName ?? c.name ?? 'Unknown',
      address: [c.address, c.city, c.state, c.zip].filter(Boolean).join(', ') || null,
      phone: c.phone ?? null,
      website: c.website ? c.website.replace(/^https?:\/\//, '').replace(/^https?\//, '').replace(/^\//, '') : null,
      distanceMiles: c.distanceMiles ?? c.distance ?? null,
      leadScore: c.enrichmentScore ?? c.score ?? 0,
      grade: c.priority ?? 'C',
      confidence: c.confidence ?? null,
      fitType: c.fitType ?? null,
      capabilitySummary: c.capabilitySummary ?? null,
      permits: c.permits ?? undefined,
    }));

    if (redisAvailable() && normalized.length > 0) {
      await redis!.set(searchCacheKey(body.vertical, body.zip), JSON.stringify(normalized), { ex: SEARCH_CACHE_TTL });
      console.log(`[INGEST] Cached ${normalized.length} results for ${body.vertical}/${body.zip}`);
    }

    return NextResponse.json({
      success: true,
      vertical: body.vertical,
      zip: body.zip,
      count: normalized.length,
      elapsedMs: elapsed,
      providerFailures: providerFailures?.length ? providerFailures : undefined,
    });
  } catch (err: any) {
    console.error('[INGEST_ERROR]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Ingestion failed' },
      { status: 500 }
    );
  }
}
