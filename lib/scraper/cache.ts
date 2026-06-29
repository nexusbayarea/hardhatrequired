import { redis, redisAvailable } from '@/lib/redis';

function scraperKey(state: string, vertical: string): string {
  return `scraper:${state}:${vertical}`;
}

export async function getCachedScraperResult(
  state: string,
  vertical: string,
): Promise<any | null> {
  if (!redisAvailable()) return null;
  const key = scraperKey(state, vertical);
  return redis!.get(key);
}

export async function setCachedScraperResult(
  state: string,
  vertical: string,
  data: any,
  ttlSeconds: number = 60 * 60 * 24,
): Promise<void> {
  if (!redisAvailable()) return;
  const key = scraperKey(state, vertical);
  await redis!.set(key, data, { ex: ttlSeconds });
}

export async function invalidateScraperCache(
  state: string,
  vertical: string,
): Promise<void> {
  if (!redisAvailable()) return;
  const key = scraperKey(state, vertical);
  await redis!.del(key);
}
