import { Redis } from '@upstash/redis';

function createClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export const redis = createClient();

export function redisAvailable(): boolean {
  return redis !== null;
}
