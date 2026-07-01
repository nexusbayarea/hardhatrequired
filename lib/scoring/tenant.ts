import { VerticalConfig } from '@/types/config';
import { VERTICAL_REGISTRY } from '@/lib/market/registry';

export interface TenantProfile {
  tenantId: string;
  organizationId: string;
  verticals: string[];
  weights: TenantScoringWeights;
  configs: Map<string, VerticalConfig>;
}

export interface TenantScoringWeights {
  baseRelevance: number;
  compliance: number;
  geo: number;
  feedback: number;
  activity: number;
  distanceWeight: number;
  contactEnrichmentWeight: number;
}

export interface TenantScoreResult {
  tenantId: string;
  vendorId: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  confidence: number;
  components: ScoreComponents;
  scoredAt: string;
}

export interface ScoreComponents {
  baseRelevance: number;
  compliance: number;
  geo: number;
  feedback: number;
  activity: number;
  total: number;
}

const DEFAULT_WEIGHTS: TenantScoringWeights = {
  baseRelevance: 35,
  compliance: 25,
  geo: 15,
  feedback: 10,
  activity: 8,
  distanceWeight: 10,
  contactEnrichmentWeight: 10,
};

export function createTenantProfile(
  tenantId: string,
  organizationId: string,
  verticals: string[],
  weights?: Partial<TenantScoringWeights>,
): TenantProfile {
  const configs = new Map<string, VerticalConfig>();
  for (const v of verticals) {
    const cfg = VERTICAL_REGISTRY[v];
    if (cfg) configs.set(v, cfg);
  }

  return {
    tenantId,
    organizationId,
    verticals: [...configs.keys()],
    weights: { ...DEFAULT_WEIGHTS, ...weights },
    configs,
  };
}

export function getGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 100) return 'A';
  if (score >= 80) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}
