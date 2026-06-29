import { ScoringWeights } from './config';

export interface ProviderAuditPayload {
  organizationId?: string;
  verticalId: string;
  providerName: 'google_places' | 'apollo' | 'gemini_grounding' | 'system_adapter';
  actionPerformed: string;
  latencyMs: number;
  tokensConsumed?: number;
  estimatedCost?: number;
  isSuccess: boolean;
  errorMessage?: string;
}

export interface VerticalCRUDPayload {
  slug: string;
  industryName: string;
  targetNaicsCodes: string[];
  equipmentKeywords: string[];
  negativeKeywords: string[];
  searchQueries: string[];
  baseScoringWeights: ScoringWeights;
}

export interface SystemObservabilityStats {
  totalApiCalls: number;
  accumulatedCost: number;
  averageLatencyMs: number;
  averageGeminiLatencyMs: number;
  googleCalls: number;
  apolloCalls: number;
  geminiCalls: number;
  adapterCalls: number;
  failureRatePercentage: number;
  latencyByProvider: Record<string, {
    avg_latency: number;
    success_rate: number;
    total_cost: number;
  }>;
}
