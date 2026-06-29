import { FEEDBACK_WEIGHTS, ConfidenceLevel } from '@/types/feedback';

export interface TrustFactors {
  userTrust: number;
  verticalTrust: number;
  consensusWeight: number;
  timeDecay: number;
}

export interface FeedbackImpact {
  weightedImpact: number;
  factors: TrustFactors;
}

export function computeTrustFactors(params: {
  totalVotesByVoter?: number;
  accurateRateByVoter?: number;
  verticalVoteCount?: number;
  verticalAccurateRate?: number;
  companyVoteCount: number;
  companyRecentNegativeRate?: number;
  daysSinceLastVote?: number;
}): TrustFactors {
  const userTrust = computeUserTrust(
    params.totalVotesByVoter,
    params.accurateRateByVoter
  );

  const verticalTrust = computeVerticalTrust(
    params.verticalVoteCount,
    params.verticalAccurateRate
  );

  const consensusWeight = computeConsensusWeight(
    params.companyVoteCount,
    params.companyRecentNegativeRate
  );

  const timeDecay = computeTimeDecay(params.daysSinceLastVote);

  return { userTrust, verticalTrust, consensusWeight, timeDecay };
}

function computeUserTrust(
  totalVotes?: number,
  accurateRate?: number
): number {
  if (!totalVotes || totalVotes < 1) {
    return FEEDBACK_WEIGHTS.baseUserTrust;
  }
  const accuracy = accurateRate ?? 0.5;
  const weight = Math.min(totalVotes / 20, 1);
  return 0.3 + weight * accuracy * 0.7;
}

function computeVerticalTrust(
  voteCount?: number,
  accurateRate?: number
): number {
  if (!voteCount || voteCount < 1) {
    return FEEDBACK_WEIGHTS.defaultVerticalTrust;
  }
  const accuracy = accurateRate ?? 0.5;
  const weight = Math.min(voteCount / 50, 1);
  return 0.3 + weight * accuracy * 0.7;
}

function computeConsensusWeight(
  companyVoteCount: number,
  recentNegativeRate?: number
): number {
  const base = Math.min(companyVoteCount / 10, 1);
  const penalty = recentNegativeRate
    ? Math.min(recentNegativeRate * 1.5, 0.5)
    : 0;
  return Math.max(base - penalty, 0.1);
}

function computeTimeDecay(daysSinceLastVote?: number): number {
  if (!daysSinceLastVote || daysSinceLastVote <= 0) return 1;
  const halfLife = FEEDBACK_WEIGHTS.timeDecayHalfLifeDays;
  return Math.pow(0.5, daysSinceLastVote / halfLife);
}

export function calculateWeightedImpact(
  voteValue: number,
  factors: TrustFactors
): number {
  return voteValue * factors.userTrust * factors.verticalTrust * factors.consensusWeight * factors.timeDecay;
}

export function determineConfidenceLevel(
  totalVotes: number,
  badVoteRatio: number,
  feedbackScore: number
): ConfidenceLevel {
  const absScore = Math.abs(feedbackScore);

  if (totalVotes >= FEEDBACK_WEIGHTS.confidenceThresholds.very_high.minVotes) {
    return 'very_high';
  }
  if (totalVotes >= FEEDBACK_WEIGHTS.confidenceThresholds.high.minVotes) {
    if (badVoteRatio > 0.6 && absScore > 5) return 'very_high';
    return 'high';
  }
  if (totalVotes >= FEEDBACK_WEIGHTS.confidenceThresholds.medium.minVotes) {
    return 'medium';
  }
  return 'low';
}

export function getFeedbackAdjustment(
  profile: { totalVotes: number; badVotes: number; feedbackScore: number }
): { adjustment: number; action: string } {
  const badVoteRatio = profile.totalVotes > 0
    ? profile.badVotes / profile.totalVotes
    : 0;

  const confidence = determineConfidenceLevel(
    profile.totalVotes,
    badVoteRatio,
    profile.feedbackScore
  );

  const thresholds = FEEDBACK_WEIGHTS.confidenceThresholds;

  switch (confidence) {
    case 'very_high':
      if (badVoteRatio > 0.5 && profile.totalVotes >= thresholds.very_high.minVotes) {
        return { adjustment: -100, action: 'blacklist' };
      }
      return { adjustment: thresholds.high.adjustment, action: 'strong_downrank' };
    case 'high':
      return { adjustment: thresholds.high.adjustment, action: 'strong_downrank' };
    case 'medium':
      return { adjustment: thresholds.medium.adjustment, action: 'downrank' };
    default:
      return { adjustment: 0, action: 'none' };
  }
}
