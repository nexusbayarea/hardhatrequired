import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { IndexIntelligenceEngine } from '@/lib/market/adapter';
import { getVerticalConfigByDomain } from '@/lib/market/registry';
import { withTimeout } from '@/lib/timeouts';
import { writeAudit } from '@/lib/telemetry/index';
import { enqueueBatch, scrapeDirect, qstashAvailable } from '@/lib/market/workers/enrichQueue';
import type { SearchResult } from '@/types/search';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.zip || !body.radius) {
      return NextResponse.json(
        { error: 'Missing core search properties (zip or radius).' },
        { status: 400 }
      );
    }

    const clientHeader = req.headers.get('x-iie-client-context') || body.vertical || 'slurry_concrete';
    const verticalConfig = await getVerticalConfigByDomain(clientHeader);

    if (!verticalConfig) {
      return NextResponse.json(
        { error: `Invalid or unregistered client configuration key: '${clientHeader}'` },
        { status: 403 }
      );
    }

    const engine = new IndexIntelligenceEngine();
    const result = await withTimeout(
      engine.executeMarketDiscovery(body, verticalConfig),
      60000,
      () => { throw new Error('Search pipeline timeout after 60 seconds'); }
    );
    const { companies, contacts, providerFailures } = result;

    writeAudit({
      provider: 'search',
      action: 'market_discovery',
      orgId: verticalConfig.id,
      metadata: { zip: body.zip, radius: body.radius, vertical: clientHeader, companyCount: companies?.length || 0, providerFailures: providerFailures?.join(',') || '' },
    });

    const normalized: SearchResult[] = companies.map((c: any) => ({
      id: c.id,
      companyName: c.companyName ?? c.name ?? 'Unknown',
      address: [c.address, c.city, c.state, c.zip].filter(Boolean).join(', ') || null,
      phone: c.phone ?? null,
      website: c.website ? c.website.replace(/^https?:\/\//, '').replace(/^https?\//, '').replace(/^\//, '') : null,
      distanceMiles: c.distanceMiles ?? c.distance ?? null,
      leadScore: c.enrichmentScore ?? c.score ?? 0,
      grade: c.priority ?? 'C',
      capabilitySummary: c.capabilitySummary ?? null,
    }));

    const response = NextResponse.json({
      success: true,
      tenant: verticalConfig.id,
      industry: verticalConfig.industryName,
      count: normalized.length,
      companies: normalized,
      contacts,
      providerFailures: providerFailures?.length ? providerFailures : undefined,
    });

    waitUntil(
      (async () => {
        const canQStash = qstashAvailable();
        const enqueued = canQStash
          ? await enqueueBatch(companies, verticalConfig.id, body.zip)
          : 0;

        if (!canQStash) {
          const withWebsites = companies.filter(c => c.website).slice(0, 10);
          await Promise.allSettled(
            withWebsites.map(c =>
              scrapeDirect(c.id, c.website!, verticalConfig.id, body.zip)
            )
          );
        }
      })()
    );

    return response;
  } catch (err: any) {
    console.error('[SEARCH_ROUTE_ERROR]', err);
    const message = err?.message || 'Search pipeline failed.';
    return NextResponse.json(
      { success: false, error: message, companies: [], contacts: [] },
      { status: 500 }
    );
  }
}
