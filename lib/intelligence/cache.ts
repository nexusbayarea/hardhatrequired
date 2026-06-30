import { redis, redisAvailable } from '@/lib/redis';

type FeedType = 'bids' | 'compliance' | 'news';

function feedKey(vertical: string, state: string, type: FeedType): string {
  return `intelligence:${state}:${vertical}:${type}`;
}

const TTL: Record<FeedType, number> = {
  bids: 60 * 60 * 6,
  compliance: 60 * 60 * 24,
  news: 60 * 60 * 4,
};

export async function getCachedFeed(
  vertical: string,
  state: string,
  type: FeedType,
): Promise<any | null> {
  if (!redisAvailable()) return null;
  const key = feedKey(vertical, state, type);
  return redis!.get(key);
}

export async function getCachedFeeds(
  vertical: string,
  state: string,
  types: FeedType[],
): Promise<(any | null)[]> {
  if (!redisAvailable()) return types.map(() => null);
  const keys = types.map(t => feedKey(vertical, state, t));
  return (await redis!.mget(...keys)) as (any | null)[];
}

export async function setCachedFeed(
  vertical: string,
  state: string,
  type: FeedType,
  data: any,
): Promise<void> {
  if (!redisAvailable()) return;
  const key = feedKey(vertical, state, type);
  await redis!.set(key, data, { ex: TTL[type] });
}

export async function invalidateFeed(
  vertical: string,
  state: string,
): Promise<void> {
  if (!redisAvailable()) return;
  const keys = (['bids', 'compliance', 'news'] as FeedType[]).map(t =>
    feedKey(vertical, state, t),
  );
  await redis!.del(...keys);
}
