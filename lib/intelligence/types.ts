import { FitType } from '@/types/company';

export interface DeepProfile {
  id?: string;
  canonicalKey: string;
  companyName: string;
  domain?: string;
  geohash?: string;
  vertical: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  fitType?: FitType;
  scrapedContent?: string;
  structuredSignals: StructuredSignals;
  permits: PermitInfo[];
  equipment: EquipmentItem[];
  services: ServiceItem[];
  naicsCodes?: string[];
  confidenceScore: number;
  signalHits: string[];
  negativeHits: string[];
  isCommercial: boolean;
  isResidential: boolean;
  isMismatch: boolean;
  servicesTtl?: string;
  equipmentTtl?: string;
  permitsTtl?: string;
  pricingTtl?: string;
  contentTtl?: string;
  lastScrapedAt?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StructuredSignals {
  services?: string[];
  equipment?: string[];
  disposal?: string[];
}

export interface PermitInfo {
  agency: string;
  number: string;
  type: string;
  status: string;
}

export interface EquipmentItem {
  name: string;
  category?: string;
  quantity?: number;
}

export interface ServiceItem {
  name: string;
  description?: string;
}

export interface SearchCacheEntry {
  results: unknown[];
  resultCount: number;
  avgConfidence: number;
  cachedAt: string;
  sourcesUsed?: string[];
  stagesExecuted?: number;
}

export type JobPriority = 'high' | 'medium' | 'low';
export type JobStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface ScrapeJob {
  id?: string;
  canonicalKey: string;
  companyName?: string;
  domain?: string;
  vertical: string;
  status: JobStatus;
  priority: JobPriority;
  triggerReason?: string;
  attemptCount?: number;
  maxAttempts?: number;
  error?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
}

/** Returned by get_geo_candidates RPC — includes all DeepProfile fields + scoring */
export interface GeoCandidate {
  id: string;
  canonicalKey: string;
  companyName: string;
  domain?: string;
  vertical: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  fitType?: FitType;
  confidenceScore: number;
  signalHits: string[];
  negativeHits: string[];
  isCommercial: boolean;
  isResidential: boolean;
  isMismatch: boolean;
  servicesTtl?: string;
  equipmentTtl?: string;
  permitsTtl?: string;
  contentTtl?: string;
  lastScrapedAt?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Computed scoring fields from RPC */
  distanceMiles: number;
  intelligenceScore: number;
  evaluatedRing: number;
}

/** Result of L2 search — either hit (serve from Supabase) or miss (trigger scrape) */
export interface L2SearchResult {
  hit: boolean;
  candidates: GeoCandidate[];
  source: 'L2_INTEL_DB' | 'L2_STALE_OR_WEAK';
  enrichmentDispatched: boolean;
  ringExpandedTo: number;
  avgConfidence: number;
  hasDirectOperator: boolean;
  reason: string;
}
