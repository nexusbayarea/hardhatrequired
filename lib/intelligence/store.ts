import { supabaseFetch } from '@/lib/db';
import { DeepProfile } from './types';
import { TTL, ttlDate, isFieldStale, isProfileExpired, getTtlForVertical } from './ttl';
import { buildBranchKey } from './geohash';

// ── Canonical key generation (domain|geohash composite) ────────────────────────
// Industrial enterprises have one domain but 50 physical branches.
// cleanharbors.com|9q8yy (downtown SF sales office) ≠ cleanharbors.com|9q9p1 (Benicia TSDF).
// Geohash precision 5 (~3mi grid) separates distinct industrial facilities.
export { buildBranchKey as buildCanonicalKey } from './geohash';

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getDeepProfile(canonicalKey: string): Promise<DeepProfile | null> {
  try {
    const res = await supabaseFetch(
      `/rest/v1/deep_profiles?canonical_key=eq.${encodeURIComponent(canonicalKey)}&limit=1`
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows?.length) return null;
    return rowToProfile(rows[0]);
  } catch {
    return null;
  }
}

export async function getDeepProfileByDomain(domain: string): Promise<DeepProfile | null> {
  try {
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    const res = await supabaseFetch(
      `/rest/v1/deep_profiles?domain=eq.${encodeURIComponent(clean)}&limit=1`
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows?.length) return null;
    return rowToProfile(rows[0]);
  } catch {
    return null;
  }
}

export async function upsertDeepProfile(profile: DeepProfile): Promise<boolean> {
  try {
    const body = profileToRow(profile);
    const res = await supabaseFetch('/rest/v1/deep_profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function updateDeepProfile(canonicalKey: string, updates: Partial<DeepProfile>): Promise<boolean> {
  try {
    const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.structuredSignals !== undefined) body.structured_signals = updates.structuredSignals;
    if (updates.permits !== undefined) body.permits = updates.permits;
    if (updates.equipment !== undefined) body.equipment = updates.equipment;
    if (updates.services !== undefined) body.services = updates.services;
    if (updates.scrapedContent !== undefined) body.scraped_content = updates.scrapedContent;
    if (updates.confidenceScore !== undefined) body.confidence_score = updates.confidenceScore;
    if (updates.signalHits !== undefined) body.signal_hits = updates.signalHits;
    if (updates.negativeHits !== undefined) body.negative_hits = updates.negativeHits;
    if (updates.isCommercial !== undefined) body.is_commercial = updates.isCommercial;
    if (updates.isResidential !== undefined) body.is_residential = updates.isResidential;
    if (updates.isMismatch !== undefined) body.is_mismatch = updates.isMismatch;
    if (updates.fitType !== undefined) body.fit_type = updates.fitType;
    if (updates.latitude !== undefined) body.latitude = updates.latitude;
    if (updates.longitude !== undefined) body.longitude = updates.longitude;
    if (updates.servicesTtl !== undefined) body.services_ttl = updates.servicesTtl;
    if (updates.equipmentTtl !== undefined) body.equipment_ttl = updates.equipmentTtl;
    if (updates.permitsTtl !== undefined) body.permits_ttl = updates.permitsTtl;
    if (updates.pricingTtl !== undefined) body.pricing_ttl = updates.pricingTtl;
    if (updates.contentTtl !== undefined) body.content_ttl = updates.contentTtl;
    if (updates.lastScrapedAt !== undefined) body.last_scraped_at = updates.lastScrapedAt;
    if (updates.expiresAt !== undefined) body.expires_at = updates.expiresAt;

    const res = await supabaseFetch(
      `/rest/v1/deep_profiles?canonical_key=eq.${encodeURIComponent(canonicalKey)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteExpiredProfiles(): Promise<number> {
  try {
    const res = await supabaseFetch(
      `/rest/v1/deep_profiles?expires_at=lt.${encodeURIComponent(new Date().toISOString())}`,
      { method: 'DELETE' }
    );
    if (!res.ok) return 0;
    const result = await res.json();
    return result?.length ?? 0;
  } catch {
    return 0;
  }
}

// ── Stale-while-revalidate helpers ────────────────────────────────────────────

export function isProfileStale(profile: DeepProfile, vertical: string): boolean {
  return (
    isFieldStale(profile.servicesTtl) &&
    isFieldStale(profile.equipmentTtl) &&
    isFieldStale(profile.permitsTtl)
  );
}

export function freshProfileTimestamp(vertical: string): {
  lastScrapedAt: string;
  servicesTtl: string;
  equipmentTtl: string;
  permitsTtl: string;
  contentTtl: string;
  expiresAt: string;
} {
  const now = new Date().toISOString();
  return {
    lastScrapedAt: now,
    servicesTtl: ttlDate(getTtlForVertical(vertical, 'services')),
    equipmentTtl: ttlDate(getTtlForVertical(vertical, 'equipment')),
    permitsTtl: ttlDate(getTtlForVertical(vertical, 'permits')),
    contentTtl: ttlDate(getTtlForVertical(vertical, 'content')),
    expiresAt: ttlDate(TTL.PROFILE_HARD_EXPIRY),
  };
}

// ── Mapping ───────────────────────────────────────────────────────────────────

function rowToProfile(row: Record<string, unknown>): DeepProfile {
  return {
    id: row.id as string,
    canonicalKey: row.canonical_key as string,
    companyName: row.company_name as string,
    domain: row.domain as string | undefined,
    geohash: row.geohash as string | undefined,
    vertical: row.vertical as string,
    address: row.address as string | undefined,
    city: row.city as string | undefined,
    state: row.state as string | undefined,
    zip: row.zip as string | undefined,
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    fitType: row.fit_type as FitType | undefined,
    scrapedContent: row.scraped_content as string | undefined,
    structuredSignals: (row.structured_signals as StructuredSignals) || {},
    permits: (row.permits as PermitInfo[]) || [],
    equipment: (row.equipment as EquipmentItem[]) || [],
    services: (row.services as ServiceItem[]) || [],
    naicsCodes: row.naics_codes as string[] | undefined,
    confidenceScore: (row.confidence_score as number) || 0,
    signalHits: (row.signal_hits as string[]) || [],
    negativeHits: (row.negative_hits as string[]) || [],
    isCommercial: (row.is_commercial as boolean) || false,
    isResidential: (row.is_residential as boolean) || false,
    isMismatch: (row.is_mismatch as boolean) || false,
    servicesTtl: row.services_ttl as string | undefined,
    equipmentTtl: row.equipment_ttl as string | undefined,
    permitsTtl: row.permits_ttl as string | undefined,
    pricingTtl: row.pricing_ttl as string | undefined,
    contentTtl: row.content_ttl as string | undefined,
    lastScrapedAt: row.last_scraped_at as string | undefined,
    expiresAt: row.expires_at as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

function profileToRow(p: DeepProfile): Record<string, unknown> {
  return {
    canonical_key: p.canonicalKey,
    company_name: p.companyName,
    domain: p.domain || null,
    geohash: p.geohash || null,
    vertical: p.vertical,
    address: p.address || null,
    city: p.city || null,
    state: p.state || null,
    zip: p.zip || null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    fit_type: p.fitType || null,
    scraped_content: p.scrapedContent || null,
    structured_signals: JSON.stringify(p.structuredSignals),
    permits: JSON.stringify(p.permits),
    equipment: JSON.stringify(p.equipment),
    services: JSON.stringify(p.services),
    naics_codes: p.naicsCodes || null,
    confidence_score: p.confidenceScore || 0,
    signal_hits: p.signalHits || [],
    negative_hits: p.negativeHits || [],
    is_commercial: p.isCommercial || false,
    is_residential: p.isResidential || false,
    is_mismatch: p.isMismatch || false,
    services_ttl: p.servicesTtl || null,
    equipment_ttl: p.equipmentTtl || null,
    permits_ttl: p.permitsTtl || null,
    pricing_ttl: p.pricingTtl || null,
    content_ttl: p.contentTtl || null,
    last_scraped_at: p.lastScrapedAt || null,
    expires_at: p.expiresAt || null,
  };
}

// Re-imported for type use in mapping
import { StructuredSignals, PermitInfo, EquipmentItem, ServiceItem } from './types';
import { FitType } from '@/types/company';
