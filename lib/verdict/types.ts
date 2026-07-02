export type VerdictValue = 'good' | 'bad' | 'uncertain';

export type HowReached =
  | 'enterprise_overlay'
  | 'website_confirmed_signal'
  | 'website_mismatch'
  | 'website_unreachable'
  | 'signal_only'
  | 'regulatory_permit';

export interface VerdictEntry {
  companyId: string;
  companyName: string;
  vertical: string;
  mode: 'labor' | 'disposal';
  verdict: VerdictValue;
  score: number;
  grade: string;
  fitType: string;
  website: string | null;
  reason: string;
  howReached: HowReached;
  evidence: string[];
  verifiedAt: string;
  source: string;
}

export interface VerdictSummary {
  total: number;
  good: number;
  bad: number;
  uncertain: number;
  byVertical: Record<string, { total: number; good: number; bad: number; uncertain: number }>;
}
