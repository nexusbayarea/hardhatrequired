import { Company } from '@/types/company';
import { VerticalConfig } from '@/types/config';

export interface ScoreResult {
  score: number;
  priority: 'A' | 'B' | 'C' | 'D';
  matchedSignals: string[];
  negativeHits: string[];
  scoreBreakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  signalScore: number;
  profileScore: number;
  distanceScore: number;
  categoryBonus: number;
  apolloBonus: number;
  regulatoryBonus: number;
  total: number;
}

export function calculateLeadScore(
  company: Partial<Company>,
  config: VerticalConfig,
  textToAnalyze: string,
  distanceMiles?: number
): ScoreResult {
  let score = 0;
  const matchedSignals: string[] = [];
  const negativeHits: string[] = [];

  const breakdown: ScoreBreakdown = {
    signalScore: 0,
    profileScore: 0,
    distanceScore: 0,
    categoryBonus: 0,
    apolloBonus: 0,
    regulatoryBonus: 0,
    total: 0,
  };

  const categoryText = (company.googleCategorySignals || []).join(' ');
  const apolloText = company.apolloDescription || '';

  const fullText = [textToAnalyze, categoryText, apolloText]
    .filter(Boolean)
    .join(' ');

  const checkSignal = (term: string): boolean => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(fullText);
  };

  const checkSignalInBase = (term: string): boolean => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(textToAnalyze);
  };

  const checkSignalInCategory = (term: string): boolean => {
    if (!categoryText) return false;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(categoryText);
  };

  const checkSignalInApollo = (term: string): boolean => {
    if (!apolloText) return false;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(apolloText);
  };

  for (const sig of config.signals.primary) {
    if (checkSignal(sig.term)) {
      score += sig.weight;
      matchedSignals.push(sig.term);

      if (checkSignalInCategory(sig.term) && !checkSignalInBase(sig.term)) {
        breakdown.categoryBonus += sig.weight;
      } else if (checkSignalInApollo(sig.term) && !checkSignalInBase(sig.term)) {
        breakdown.apolloBonus += sig.weight;
      } else {
        breakdown.signalScore += sig.weight;
      }
    }
  }

  for (const sig of config.signals.secondary) {
    if (checkSignal(sig.term)) {
      score += sig.weight;
      matchedSignals.push(sig.term);

      if (checkSignalInCategory(sig.term) && !checkSignalInBase(sig.term)) {
        breakdown.categoryBonus += sig.weight;
      } else if (checkSignalInApollo(sig.term) && !checkSignalInBase(sig.term)) {
        breakdown.apolloBonus += sig.weight;
      } else {
        breakdown.signalScore += sig.weight;
      }
    }
  }

  const checkNegativeSignal = (term: string): boolean => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(textToAnalyze);
  };

  for (const sig of config.signals.negative) {
    if (checkNegativeSignal(sig.term)) {
      score += sig.weight;
      negativeHits.push(sig.term);
    }
  }

  const hasMatch = matchedSignals.length > 0;

  if (hasMatch) {
    let profileScore = 0;
    if (company.phone)   profileScore += config.scoringWeights.hasPhone;
    if (company.website) profileScore += config.scoringWeights.hasWebsite;
    if (company.email)   profileScore += config.scoringWeights.hasContactEmail;
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
      if (dist <= 10)      distanceScore = config.scoringWeights.distanceFactor * 1.5;
      else if (dist <= 25) distanceScore = config.scoringWeights.distanceFactor;
      else if (dist <= 50) distanceScore = config.scoringWeights.distanceFactor * 0.5;
      score += distanceScore;
      breakdown.distanceScore = distanceScore;
    }
  }

  score = Math.round(score);
  breakdown.total = score;

  let priority: 'A' | 'B' | 'C' | 'D';
  if (score >= 90)     priority = 'A';
  else if (score >= 70) priority = 'B';
  else if (score >= 50) priority = 'C';
  else                  priority = 'D';

  if (score < 0) priority = 'D';

  return { score, priority, matchedSignals, negativeHits, scoreBreakdown: breakdown };
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
