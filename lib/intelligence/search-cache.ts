import { redis, redisAvailable } from '@/lib/redis';
import { SearchCacheEntry } from './types';
import { TTL } from './ttl';

function searchCacheKey(vertical: string, zip: string, radius: number, mode: string): string {
  return `agentic:search:${vertical}:${zip}:${radius}:${mode}`;
}

export async function getCachedSearch(
  vertical: string,
  zip: string,
  radius: number,
  mode: string
): Promise<SearchCacheEntry | null> {
  if (!redisAvailable()) return null;
  try {
    const key = searchCacheKey(vertical, zip, radius, mode);
    const raw = await redis!.get<SearchCacheEntry>(key);
    return raw;
  } catch {
    return null;
  }
}

export async function setCachedSearch(
  vertical: string,
  zip: string,
  radius: number,
  mode: string,
  entry: SearchCacheEntry
): Promise<void> {
  if (!redisAvailable()) return;
  try {
    const key = searchCacheKey(vertical, zip, radius, mode);
    await redis!.set(key, entry, { ex: TTL.SEARCH_CACHE });
  } catch {
    // Non-fatal
  }
}

export async function invalidateSearchCache(
  vertical: string,
  zip: string,
  radius: number,
  mode: string
): Promise<void> {
  if (!redisAvailable()) return;
  try {
    const key = searchCacheKey(vertical, zip, radius, mode);
    await redis!.del(key);
  } catch {
    // Non-fatal
  }
}
