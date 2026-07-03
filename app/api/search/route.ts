import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { IndexIntelligenceEngine } from '@/lib/market/adapter';
import { getVerticalConfigByDomain, VERTICAL_REGISTRY } from '@/lib/market/registry';
import { withTimeout } from '@/lib/timeouts';
import { writeAudit } from '@/lib/telemetry/index';
import { redis, redisAvailable } from '@/lib/redis';
import { ScoreEngine } from '@/lib/scoring/engine';
import { createTenantProfile, getGrade } from '@/lib/scoring/tenant';
import { enqueueBatch, scrapeDirect, qstashAvailable } from '@/lib/market/workers/enrichQueue';
import type { SearchResult } from '@/types/search';
import { generateMapLinks } from '@/lib/search/map-utils';
import { calculateHaulingCost } from '@/lib/logistics/cost-estimator';
import { getVerticalEstimatorConfig } from '@/lib/logistics/normalizer';

const SEARCH_CACHE_TTL = 60 * 10;

function searchCacheKey(tenant: string, zip: string): string {
  return `search:${tenant}:${zip}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.zip || !body.radius) {
      return NextResponse.json(
        { error: 'Missing core search properties (zip or radius).' },
        { status: 400 }
      );
    }

    const clientHeader = req.headers.get('x-iie-client-context') || body.vertical || 'slurry_processing';
    const verticalConfig = await getVerticalConfigByDomain(clientHeader);

    if (!verticalConfig) {
      return NextResponse.json(
        { error: `Invalid or unregistered client configuration key: '${clientHeader}'` },
        { status: 403 }
      );
    }

    // Cache-first: check Redis for pre-ingested results
    if (redisAvailable()) {
      const cached = await redis!.get(searchCacheKey(clientHeader, body.zip));
      if (cached) {
        const parsed = JSON.parse(cached as string);
        console.log(`[SEARCH_CACHE] Hit for ${clientHeader}/${body.zip} (${parsed.length} results)`);
        return NextResponse.json({
          success: true,
          tenant: verticalConfig.id,
          industry: verticalConfig.industryName,
          count: parsed.length,
          companies: parsed,
          contacts: [],
          cached: true,
        });
      }
      console.log(`[SEARCH_CACHE] Miss for ${clientHeader}/${body.zip}`);
    }

    const engine = new IndexIntelligenceEngine();
    const result = await withTimeout(
      engine.executeMarketDiscovery(body, verticalConfig),
       300000,
      () => { throw new Error('Search pipeline timeout after 300 seconds'); }
    );
    const { companies, contacts, providerFailures } = result;

    writeAudit({
      provider: 'search',
      action: 'market_discovery',
      orgId: verticalConfig.id,
      metadata: { zip: body.zip, radius: body.radius, vertical: clientHeader, companyCount: companies?.length || 0, providerFailures: providerFailures?.join(',') || '' },
    });

    const normalized: SearchResult[] = companies.map((c: any) => {
      const lat = c.latitude ?? null;
      const lng = c.longitude ?? null;
      const coords = lat != null && lng != null ? { lat, lng } : undefined;

      return {
        id: c.id,
        companyName: c.companyName ?? c.name ?? 'Unknown',
        address: [c.address, c.city, c.state, c.zip].filter(Boolean).join(', ') || null,
        phone: c.phone ?? null,
        website: c.website ? c.website.replace(/^https?:\/\//, '').replace(/^https?\//, '').replace(/^\//, '') : null,
        email: c.email ?? null,
        distanceMiles: c.distanceMiles ?? c.distance ?? null,
        leadScore: c.enrichmentScore ?? c.score ?? 0,
        grade: c.priority ?? 'C',
        confidence: c.confidence ?? null,
        fitType: c.fitType ?? null,
        capabilitySummary: c.capabilitySummary ?? null,
        permits: c.permits ?? undefined,
        coordinates: coords,
        navigation: coords ? generateMapLinks(coords.lat, coords.lng, c.companyName) : undefined,
        logisticsEstimates: c.distanceMiles != null ? (() => {
          const m = calculateHaulingCost(c.distanceMiles, getVerticalEstimatorConfig(clientHeader));
          return {
            oneWayTransitTimeMins: Math.round(m.transitTimeMinutes / 2),
            totalRoundTripMins: m.cycleTimeMinutes,
            haulingCost: m.estimatedHaulingCost,
            disposalCost: m.estimatedDisposalFee,
            totalCost: m.totalEstimatedCost,
            costPerGallon: m.costPerGallon,
          };
        })() : null,
        extractedServices: c.extractedServices ?? undefined,
        extractedEquipment: c.extractedEquipment ?? undefined,
        scrapedLicenseNumbers: c.scrapedLicenseNumbers ?? undefined,
        scrapedKeywords: c.scrapedKeywords ?? undefined,
        matchedSignals: c.matchedSignals ?? undefined,
        negativeHits: c.negativeHits ?? undefined,
        relevanceReason: c.relevanceReason ?? null,
        source: c.source ?? null,
        googleRating: c.googleRating ?? null,
        googleReviewCount: c.googleReviewCount ?? null,
        extractionConfidence: c.extractionConfidence ?? null,
        aiSummary: c.aiSummary ?? null,
      };
    });

    // Cache results for subsequent searches
    if (redisAvailable() && normalized.length > 0) {
      waitUntil(redis!.set(searchCacheKey(clientHeader, body.zip), JSON.stringify(normalized), { ex: SEARCH_CACHE_TTL }));
    }

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

    return NextResponse.json({
      success: true,
      tenant: verticalConfig.id,
      industry: verticalConfig.industryName,
      count: normalized.length,
      companies: normalized,
      contacts,
      providerFailures: providerFailures?.length ? providerFailures : undefined,
      cached: false,
    });
  } catch (err: any) {
    console.error('[SEARCH_ROUTE_ERROR]', err);
    const message = err?.message || 'Search pipeline failed.';
    return NextResponse.json(
      { success: false, error: message, companies: [], contacts: [] },
      { status: 500 }
    );
  }
}
