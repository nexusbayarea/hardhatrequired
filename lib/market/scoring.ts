import { Company } from '@/types/company';
import { VerticalConfig } from '@/types/config';

export interface ScoreBreakdown {
  signalScore: number;
  profileScore: number;
  distanceScore: number;
  categoryBonus: number;
  apolloBonus: number;
  regulatoryBonus: number;
  negativePenalty: number;
  historicalFeedbackBonus: number;
  total: number;
}

export interface ScoreResult {
  score: number;
  priority: 'A' | 'B' | 'C' | 'D';
  confidence: number;
  matchedSignals: string[];
  negativeHits: string[];
  relevanceReason: string;
  scoreBreakdown: ScoreBreakdown;
}

function normalizeText(text: string = ''): string {
  return text
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsTerm(text: string, term: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedTerm = normalizeText(term);
  const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(normalizedText);
}

export function calculateLeadScore(
  company: Partial<Company>,
  config: VerticalConfig,
  baseText: string,
  distanceMiles?: number
): ScoreResult {
  let score = 0;
  const matchedSignals: string[] = [];
  const negativeHits: string[] = [];

  const categoryText = (company.googleCategorySignals || []).join(' ');
  const apolloText = company.apolloDescription || '';

  const breakdown: ScoreBreakdown = {
    signalScore: 0,
    profileScore: 0,
    distanceScore: 0,
    categoryBonus: 0,
    apolloBonus: 0,
    regulatoryBonus: 0,
    negativePenalty: 0,
    historicalFeedbackBonus: 0,
    total: 0,
  };

  const fullText = [baseText, categoryText, apolloText]
    .filter(Boolean)
    .join(' ');

  const matchedPrimary = new Set<string>();

  // Primary Signals
  for (const sig of config.signals.primary) {
    if (containsTerm(fullText, sig.term)) {
      score += sig.weight;
      breakdown.signalScore += sig.weight;
      matchedSignals.push(sig.term);
      matchedPrimary.add(sig.term);
      if (containsTerm(categoryText, sig.term)) {
        breakdown.categoryBonus += Math.round(sig.weight * 0.5);
      }
      if (containsTerm(apolloText, sig.term)) {
        breakdown.apolloBonus += Math.round(sig.weight * 0.5);
      }
    }
  }

  // Secondary Signals
  for (const sig of config.signals.secondary) {
    if (containsTerm(fullText, sig.term)) {
      score += sig.weight;
      breakdown.signalScore += sig.weight;
      matchedSignals.push(sig.term);
      if (containsTerm(categoryText, sig.term)) {
        breakdown.categoryBonus += Math.round(sig.weight * 0.3);
      }
      if (containsTerm(apolloText, sig.term)) {
        breakdown.apolloBonus += Math.round(sig.weight * 0.3);
      }
    }
  }

  // Negative Signals (weighted from all sources)
  for (const sig of config.signals.negative) {
    let penalty = 0;
    if (containsTerm(baseText, sig.term)) penalty += Math.abs(sig.weight);
    if (containsTerm(categoryText, sig.term)) penalty += Math.abs(sig.weight) * 0.7;
    if (containsTerm(apolloText, sig.term)) penalty += Math.abs(sig.weight) * 0.5;
    if (penalty > 0) {
      score -= penalty;
      breakdown.negativePenalty += penalty;
      negativeHits.push(sig.term);
    }
  }

  // Profile Score
  const hasStrongSignal = matchedSignals.length > 0;
  if (hasStrongSignal) {
    let profileScore = 0;
    if (company.phone) profileScore += config.scoringWeights.hasPhone;
    if (company.website) profileScore += config.scoringWeights.hasWebsite;
    if (company.email) profileScore += config.scoringWeights.hasContactEmail;
    if (company.address) profileScore += config.scoringWeights.hasPhysicalAddress;
    score += profileScore;
    breakdown.profileScore = profileScore;

    if (company.hasRegulatoryPermit) {
      score += 15;
      breakdown.regulatoryBonus = 15;
    }

    const dist = distanceMiles ?? company.distanceMiles;
    if (dist !== undefined) {
      let distanceScore = 0;
      if (dist <= 10) distanceScore = 20;
      else if (dist <= 25) distanceScore = 15;
      else if (dist <= 50) distanceScore = 8;
      score += distanceScore;
      breakdown.distanceScore = distanceScore;
    }
  }

  // Feedback Learning Bonus
  const positiveFeedback = company.feedbackPositiveCount || 0;
  const negativeFeedback = company.feedbackNegativeCount || 0;
  const feedbackBonus = Math.min(25, positiveFeedback * 3) - Math.min(40, negativeFeedback * 5);
  score += feedbackBonus;
  breakdown.historicalFeedbackBonus = feedbackBonus;

  // Final Score
  score = Math.round(score);
  breakdown.total = score;

  // Confidence
  let confidence = 50;
  confidence += matchedSignals.length * 10;
  confidence += matchedPrimary.size * 15;
  confidence -= negativeHits.length * 15;
  confidence = Math.max(0, Math.min(100, confidence));

  // Priority
  let priority: 'A' | 'B' | 'C' | 'D';
  if (score >= 100) priority = 'A';
  else if (score >= 75) priority = 'B';
  else if (score >= 55) priority = 'C';
  else priority = 'D';

  // Reason
  const relevanceReason =
    matchedSignals.length > 0
      ? `Matched signals: ${matchedSignals.join(', ')}`
      : 'No strong signals matched';

  return {
    score,
    priority,
    confidence,
    matchedSignals,
    negativeHits,
    relevanceReason,
    scoreBreakdown: breakdown,
  };
}

export function buildAnalysisText(company: Partial<Company>): string {
  return [
    company.companyName,
    company.address,
    company.notes,
    company.capabilitySummary,
  ]
    .filter(Boolean)
    .join(' ');
}
