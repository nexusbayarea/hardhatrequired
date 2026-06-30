import { redis } from '@/lib/redis';
import { Company } from '@/types/company';

export async function getCachedIntelligence(state: string, vertical: string): Promise<any | null> {
  return redis!.get(`intelligence:${state.toLowerCase()}:${vertical.toLowerCase()}`);
}

export async function setCachedIntelligence(state: string, vertical: string, data: any): Promise<void> {
  await redis!.set(
    `intelligence:${state.toLowerCase()}:${vertical.toLowerCase()}`,
    data,
    { ex: 60 * 60 * 6 },
  );
}

export async function getCachedScraperLeads(state: string, vertical: string): Promise<Partial<Company>[] | null> {
  return redis!.get(`scraper:${state.toLowerCase()}:${vertical.toLowerCase()}`);
}

export async function setCachedScraperLeads(state: string, vertical: string, leads: Partial<Company>[]): Promise<void> {
  await redis!.set(
    `scraper:${state.toLowerCase()}:${vertical.toLowerCase()}`,
    leads,
    { ex: 60 * 60 * 24 * 7 },
  );
}

export async function invalidateMarketCache(state: string, vertical: string): Promise<void> {
  const keys = [
    `intelligence:${state.toLowerCase()}:${vertical.toLowerCase()}`,
    `scraper:${state.toLowerCase()}:${vertical.toLowerCase()}`,
  ];
  await redis!.del(...keys);
}
