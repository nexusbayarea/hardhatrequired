// TTL durations in seconds
const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const TTL = {
  // L1 — Redis hot search cache
  SEARCH_CACHE: 10 * MINUTE,

  // L2 — Supabase deep profiles (per-field granularity)
  SERVICES: 90 * DAY,        // company services rarely change
  EQUIPMENT: 30 * DAY,       // equipment availability
  PERMITS: 7 * DAY,          // permit status must stay fresh
  PRICING: 7 * DAY,          // pricing data
  CONTENT: 30 * DAY,         // general scraped content

  // Hard expiry — profile becomes eligible for deletion after this
  PROFILE_HARD_EXPIRY: 180 * DAY,
} as const;

export type TtlCategory = 'services' | 'equipment' | 'permits' | 'pricing' | 'content';

export function getFieldTtl(category: TtlCategory): number {
  switch (category) {
    case 'services': return TTL.SERVICES;
    case 'equipment': return TTL.EQUIPMENT;
    case 'permits': return TTL.PERMITS;
    case 'pricing': return TTL.PRICING;
    case 'content': return TTL.CONTENT;
  }
}

// Vertical-specific overrides
const VERTICAL_TTL_OVERRIDES: Record<string, Partial<Record<TtlCategory, number>>> = {
  slurry_processing: { services: 90 * DAY },
  tank_testing: { permits: 24 * HOUR },
  asbestos_abatement: { permits: 24 * HOUR },
  medical_waste: { permits: 24 * HOUR },
};

export function getTtlForVertical(vertical: string, category: TtlCategory): number {
  const overrides = VERTICAL_TTL_OVERRIDES[vertical];
  if (overrides?.[category] !== undefined) return overrides[category]!;
  return getFieldTtl(category);
}

export function ttlDate(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

// Determine if a profile (or its field) is stale
export function isFieldStale(ttlTimestamp: string | undefined | null): boolean {
  if (!ttlTimestamp) return true; // never scraped
  return new Date(ttlTimestamp) < new Date();
}

export function isProfileExpired(expiresAt: string | undefined | null): boolean {
  if (!expiresAt) return false; // no hard expiry
  return new Date(expiresAt) < new Date();
}

export function shouldRescrape(profile: { lastScrapedAt?: string | null; servicesTtl?: string | null; equipmentTtl?: string | null; permitsTtl?: string | null }): boolean {
  return (
    isFieldStale(profile.servicesTtl) &&
    isFieldStale(profile.equipmentTtl) &&
    isFieldStale(profile.permitsTtl)
  );
}
