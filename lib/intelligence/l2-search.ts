import { supabaseFetch } from '@/lib/db';
import { GeoCandidate, L2SearchResult } from './types';
import { getVerticalRule, shouldTriggerScrape } from '@/lib/search/vertical-registry';
import { queueBackgroundRefresh } from './queue';

// ── Profile → Candidate conversion ───────────────────────────────────────────

function rowToCandidate(row: Record<string, unknown>): GeoCandidate {
  return {
    id: row.id as string,
    canonicalKey: row.canonical_key as string,
    companyName: row.company_name as string,
    domain: row.domain as string | undefined,
    vertical: row.vertical as string,
    address: row.address as string | undefined,
    city: row.city as string | undefined,
    state: row.state as string | undefined,
    zip: row.zip as string | undefined,
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    fitType: row.fit_type as GeoCandidate['fitType'],
    confidenceScore: (row.confidence_score as number) || 0,
    signalHits: (row.signal_hits as string[]) || [],
    negativeHits: (row.negative_hits as string[]) || [],
    isCommercial: (row.is_commercial as boolean) || false,
    isResidential: (row.is_residential as boolean) || false,
    isMismatch: (row.is_mismatch as boolean) || false,
    servicesTtl: row.services_ttl as string | undefined,
    equipmentTtl: row.equipment_ttl as string | undefined,
    permitsTtl: row.permits_ttl as string | undefined,
    contentTtl: row.content_ttl as string | undefined,
    lastScrapedAt: row.last_scraped_at as string | undefined,
    expiresAt: row.expires_at as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
    distanceMiles: (row.distance_miles as number) || 0,
    geoScore: (row.geo_score as number) || 0,
    freshnessScore: (row.freshness_score as number) || 0,
    fitScore: (row.fit_score as number) || 0,
    totalScore: (row.total_score as number) || 0,
  };
}

// ── L2 PostGIS search ─────────────────────────────────────────────────────────

export async function searchL2(
  verticalId: string,
  lng: number,
  lat: number,
  zip?: string,
): Promise<L2SearchResult> {
  const rule = getVerticalRule(verticalId);

  try {
    // Call the PostGIS RPC
    const res = await supabaseFetch('/rest/v1/rpc/get_geo_candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_lng: lng,
        target_lat: lat,
        target_vertical: verticalId,
        search_rings: rule.searchRings,
        min_results_threshold: rule.minResults,
      }),
    });

    if (!res.ok) {
      return {
        hit: false,
        candidates: [],
        source: 'L2_STALE_OR_WEAK',
        enrichmentDispatched: true,
        ringExpandedTo: 0,
        avgConfidence: 0,
        hasDirectOperator: false,
        reason: `L2 RPC error: ${res.status}`,
      };
    }

    const rawRows: Record<string, unknown>[] = await res.json();
    const candidates: GeoCandidate[] = rawRows.map(rowToCandidate);

    // Intelligence assessment
    const avgConfidence =
      candidates.length > 0
        ? Math.round(
            candidates.reduce((sum, c) => sum + c.confidenceScore, 0) / candidates.length,
          )
        : 0;

    const hasDirectOperator = candidates.some(
      c => c.fitType === 'DIRECT_OPERATOR' || c.fitType === 'DISPOSAL_NODE',
    );

    // Determine the ring that was used (last ring that had candidates)
    const lastRing = [...rule.searchRings].reverse().find(r => {
      return candidates.some(c => c.distanceMiles <= r);
    });
    const ringExpandedTo = lastRing || rule.searchRings[0];

    // Decision: enough quality to serve from L2, or scrape needed?
    const needsScrape = shouldTriggerScrape(verticalId, candidates);

    if (!needsScrape) {
      return {
        hit: true,
        candidates,
        source: 'L2_INTEL_DB',
        enrichmentDispatched: false,
        ringExpandedTo,
        avgConfidence,
        hasDirectOperator,
        reason: `L2 hit: ${candidates.length} candidates, avg ${avgConfidence} confidence, ring ${ringExpandedTo}mi`,
      };
    }

    // Weak coverage → fire background scrape, return what we have
    await queueBackgroundRefresh(verticalId, verticalId, 'medium').catch(() => {});
    if (zip) {
      await queueBackgroundRefresh(`${verticalId}|${zip}`, verticalId, 'high').catch(() => {});
    }

    return {
      hit: false,
      candidates,
      source: 'L2_STALE_OR_WEAK',
      enrichmentDispatched: true,
      ringExpandedTo,
      avgConfidence,
      hasDirectOperator,
      reason: `L2 weak: ${candidates.length} candidates need ${rule.minResults}, avg ${avgConfidence} need ${rule.minConfidence} confidence`,
    };
  } catch (err) {
    return {
      hit: false,
      candidates: [],
      source: 'L2_STALE_OR_WEAK',
      enrichmentDispatched: true,
      ringExpandedTo: 0,
      avgConfidence: 0,
      hasDirectOperator: false,
      reason: `L2 error: ${err instanceof Error ? err.message : 'unknown'}`,
    };
  }
}
