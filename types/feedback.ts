export type VoteType = 'accurate' | 'partial' | 'bad';

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface FeedbackVote {
  id: string;
  companyId: string;
  companyName: string;
  vertical: string;
  voteType: VoteType;
  userTrust: number;
  verticalTrust: number;
  consensusWeight: number;
  timeDecay: number;
  weightedImpact: number;
  leadScore: number;
  signals: string;
  createdAt: string;
}

export interface CompanyFeedbackProfile {
  companyId: string;
  vertical: string;
  feedbackScore: number;
  feedbackConfidence: number;
  totalVotes: number;
  accurateVotes: number;
  partialVotes: number;
  badVotes: number;
  voteHistory: FeedbackVoteSummary[];
  lastVoteAt: string;
  updatedAt: string;
}

export interface FeedbackVoteSummary {
  voteType: VoteType;
  weightedImpact: number;
  createdAt: string;
}

export interface FeedbackThresholds {
  confidence: ConfidenceLevel;
  scoreAdjustment: number;
  action: 'none' | 'downrank' | 'strong_downrank' | 'blacklist';
}

export const FEEDBACK_WEIGHTS = {
  baseUserTrust: 0.5,
  defaultVerticalTrust: 0.5,
  defaultConsensusWeight: 1.0,
  timeDecayHalfLifeDays: 30,
  voteValue: { accurate: 1, partial: 0, bad: -1 } as const,
  confidenceThresholds: {
    low: { minVotes: 0, maxConfidence: 0.3, adjustment: 0, action: 'none' as const },
    medium: { minVotes: 3, maxConfidence: 0.6, adjustment: -10, action: 'downrank' as const },
    high: { minVotes: 8, maxConfidence: 0.85, adjustment: -40, action: 'strong_downrank' as const },
    very_high: { minVotes: 15, maxConfidence: 1.0, adjustment: -100, action: 'blacklist' as const },
  },
} as const;
