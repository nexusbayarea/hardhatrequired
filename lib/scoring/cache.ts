import { redis, redisAvailable } from '@/lib/redis';
import { TenantScoreResult } from './tenant';
import { withTimeout } from '@/lib/timeouts';

const REDIS_TIMEOUT = 5000;

function hotScoreKey(tenantId: string, vendorId: string): string {
  return `tenant:${tenantId}:vendor:${vendorId}`;
}

function tenantScoresKey(tenantId: string): string {
  return `tenant_scores:${tenantId}`;
}

function searchResultsKey(tenantId: string, verticalId: string, zip: string): string {
  return `search:${tenantId}:${verticalId}:${zip}`;
}

const HOT_SCORE_TTL = 60 * 60 * 2;
const SEARCH_CACHE_TTL = 60 * 10;

export class HotScoreCache {
  async getScore(tenantId: string, vendorId: string): Promise<TenantScoreResult | null> {
    if (!redisAvailable()) return null;
    const key = hotScoreKey(tenantId, vendorId);
    return withTimeout(
      redis!.get(key) as Promise<TenantScoreResult | null>,
      REDIS_TIMEOUT,
      () => null
    );
  }

  async setScore(tenantId: string, vendorId: string, result: TenantScoreResult): Promise<void> {
    if (!redisAvailable()) return;
    const key = hotScoreKey(tenantId, vendorId);
    await withTimeout(
      redis!.set(key, result, { ex: HOT_SCORE_TTL }),
      REDIS_TIMEOUT,
      () => undefined
    );
  }

  async getScores(tenantId: string, vendorIds: string[]): Promise<(TenantScoreResult | null)[]> {
    if (!redisAvailable()) return vendorIds.map(() => null);
    if (vendorIds.length === 0) return [];
    const keys = vendorIds.map(v => hotScoreKey(tenantId, v));
    return withTimeout(
      redis!.mget(...keys) as Promise<(TenantScoreResult | null)[]>,
      REDIS_TIMEOUT,
      () => vendorIds.map(() => null)
    );
  }

  async setScores(tenantId: string, results: TenantScoreResult[]): Promise<void> {
    if (!redisAvailable() || results.length === 0) return;
    const pipe = redis!.pipeline();
    for (const r of results) {
      const key = hotScoreKey(tenantId, r.vendorId);
      pipe.set(key, r, { ex: HOT_SCORE_TTL });
    }
    await pipe.exec();
  }

  async invalidateVendor(vendorId: string): Promise<void> {
    if (!redisAvailable()) return;
    const pattern = `tenant:*:vendor:${vendorId}`;
    const keys = await redis!.keys(pattern);
    if (keys.length > 0) {
      await redis!.del(...keys);
    }
  }

  async invalidateTenant(tenantId: string): Promise<void> {
    if (!redisAvailable()) return;
    const pattern = `tenant:${tenantId}:*`;
    const keys = await redis!.keys(pattern);
    if (keys.length > 0) {
      await redis!.del(...keys);
    }
  }

  async cacheSearchResults(
    tenantId: string,
    verticalId: string,
    zip: string,
    results: TenantScoreResult[],
  ): Promise<void> {
    if (!redisAvailable()) return;
    const key = searchResultsKey(tenantId, verticalId, zip);
    await redis!.set(key, results, { ex: SEARCH_CACHE_TTL });
  }

  async getSearchResults(
    tenantId: string,
    verticalId: string,
    zip: string,
  ): Promise<TenantScoreResult[] | null> {
    if (!redisAvailable()) return null;
    const key = searchResultsKey(tenantId, verticalId, zip);
    return (await redis!.get(key)) as TenantScoreResult[] | null;
  }
}
