import { NextRequest, NextResponse } from 'next/server';
import { getVerticalConfigByDomain } from '@/lib/market/registry';
import { AgenticOrchestrator, AgenticSearchResult } from '@/lib/search/agentic-orchestrator';
import { withTimeout } from '@/lib/timeouts';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { zip, radius, vertical, mode } = body;

    if (!zip || !vertical) {
      return NextResponse.json({ success: false, error: 'zip and vertical required' }, { status: 400 });
    }

    const clientHeader = request.headers.get('x-iie-client-context') || vertical;
    const config = await getVerticalConfigByDomain(clientHeader);
    if (!config) {
      return NextResponse.json({ success: false, error: `Unknown vertical: ${clientHeader}` }, { status: 400 });
    }

    const orchestrator = new AgenticOrchestrator();
    const fallback: AgenticSearchResult = {
      mode: 'standard',
      sourcesUsed: ['timeout'],
      stagesExecuted: 1,
      decision: 'timed out',
      companies: [],
      contacts: [],
      providerFailures: ['timeout'],
    };
    const result = await withTimeout(
      orchestrator.executeMarketDiscovery(
        { zip: zip.trim(), radius: radius || 50, mode: mode || 'labor' },
        config
      ),
      120_000,
      () => fallback
    );

    return NextResponse.json({
      success: true,
      mode: result.mode,
      vertical: config.id,
      industry: config.industryName,
      count: result.companies.length,
      sourcesUsed: result.sourcesUsed,
      stagesExecuted: result.stagesExecuted,
      decision: result.decision,
      cacheSource: result.cacheSource,
      isStale: result.isStale,
      enrichmentDispatched: result.cacheSource === 'L2_stale_or_weak',
      companies: result.companies,
      contacts: result.contacts,
      providerFailures: result.providerFailures,
    });
  } catch (err) {
    console.error('[AGENTIC_SEARCH]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
