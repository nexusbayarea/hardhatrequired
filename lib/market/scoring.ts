import { Company, FitType } from '@/types/company';
import { VerticalConfig } from '@/types/config';

export interface ScoreBreakdown {
  signalScore: number;
  profileScore: number;
  distanceScore: number;
  categoryBonus: number;
  apolloBonus: number;
  regulatoryBonus: number;
  webScrapeBonus: number;
  negativePenalty: number;
  historicalFeedbackBonus: number;
  total: number;
}

export interface ScoreResult {
  score: number;
  priority: 'A' | 'B' | 'C' | 'D';
  confidence: number;
  fitType: FitType;
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

function determineFitType(
  matchedSignals: string[],
  company: Partial<Company>,
): FitType {
  if (company.source === 'regulatory_permit') return 'REGULATORY_NODE';

  const signalSet = new Set(matchedSignals.map(s => s.toLowerCase()));

  const disposalTerms = ['disposal', 'recycling', 'recycle', 'landfill', 'washout', 'wastewater', 'filtration', 'slurry'];
  for (const t of disposalTerms) {
    for (const s of signalSet) {
      if (s.includes(t)) return 'DISPOSAL_NODE';
    }
  }

  const directTerms = ['concrete cutting', 'core drilling', 'saw cutting', 'sawcutting', 'demolition', 'grease trap', 'grease trap cleaning', 'abatement', 'scrap metal', 'marine construction', 'kitchen exhaust', 'fire extinguisher', 'fire sprinkler', 'stormwater'];
  for (const t of directTerms) {
    for (const s of signalSet) {
      if (s.includes(t)) return 'DIRECT_OPERATOR';
    }
  }

  return 'INDIRECT_VENDOR';
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
    webScrapeBonus: 0,
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
  // Physical disposal facilities (landfills, transfer stations, recycling yards) may
  // match negative terms like "hazardous" or "environmental" in their descriptions
  // but are legitimate disposal destinations — skip negative penalties for them.
  const companyName = (company.companyName || '').toLowerCase();
  const isPhysicalDisposalFacility =
    /\b(landfill|transfer station|recycling center|recycling yard|mrf|material recovery|waste processing|treatment facility|tsdf|scalehouse?|tipping)\b/i.test(companyName);

  for (const sig of config.signals.negative) {
    let penalty = 0;
    if (!isPhysicalDisposalFacility) {
      if (containsTerm(baseText, sig.term)) penalty += Math.abs(sig.weight);
      if (containsTerm(categoryText, sig.term)) penalty += Math.abs(sig.weight) * 0.7;
      if (containsTerm(apolloText, sig.term)) penalty += Math.abs(sig.weight) * 0.5;
    } else if (sig.weight < -40) {
      // For heavy negative terms, still apply a reduced penalty even to physical facilities
      if (containsTerm(companyName, sig.term)) penalty += Math.abs(sig.weight) * 0.3;
    }
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

    const activePermitCount = (company.permits ?? []).filter(p => p.status === 'Active').length;
    if (activePermitCount > 0) {
      const permitBonus = Math.min(30, activePermitCount * 15);
      score += permitBonus;
      breakdown.regulatoryBonus = permitBonus;
    }

    if (company.googleReviewCount && company.googleReviewCount > 15) {
      score += 8;
    }
    if (company.googleRating && company.googleRating >= 4.2) {
      score += 5;
    }

    // Web scrape bonuses
    let webScrapeBonus = 0;
    if (company.scrapedIsCommercial) {
      webScrapeBonus += 15;
    }
    if (company.scrapedKeywords?.length) {
      webScrapeBonus += Math.min(25, company.scrapedKeywords.length * 5);
    }
    if (company.scrapedLicenseNumbers?.length) {
      webScrapeBonus += 10;
    }
    if (company.scrapedIsResidential) {
      webScrapeBonus -= 20;
    }
    if (company.scrapedIsMismatch) {
      webScrapeBonus -= 30;
    }
    if (webScrapeBonus !== 0) {
      score += webScrapeBonus;
      breakdown.webScrapeBonus = webScrapeBonus;
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
  let confidence = 30;
  confidence += Math.min(45, matchedPrimary.size * 15);
  confidence += Math.min(15, (matchedSignals.length - matchedPrimary.size) * 5);

  const industryTerm = config.industryName?.toLowerCase().split(' ')[0] || '';
  if (industryTerm && containsTerm(company.companyName || '', industryTerm)) {
    confidence += 10;
  }

  if (company.phone) confidence += 8;
  if (company.website) confidence += 5;
  if (company.email) confidence += 5;

  const activePermits = (company.permits ?? []).filter(p => p.status === 'Active').length;
  if (activePermits > 0) confidence += Math.min(25, activePermits * 10);

  if (company.scrapedIsCommercial) confidence += 10;
  if (company.scrapedKeywords?.length) confidence += 5;
  if (company.scrapedIsResidential) confidence -= 15;
  if (company.scrapedIsMismatch) confidence -= 20;

  if (company.googleRating && company.googleRating >= 4.0) confidence += 8;
  if (company.googleReviewCount && company.googleReviewCount > 10) confidence += 5;

  if (company.apolloDescription) confidence += 5;

  const dist = distanceMiles ?? company.distanceMiles;
  if (dist !== undefined) {
    if (dist <= 10) confidence += 5;
    else if (dist <= 25) confidence += 2;
  }

  confidence -= Math.min(30, negativeHits.length * 10);
  confidence = Math.max(0, Math.min(100, confidence));

  // Fit type
  const fitType = determineFitType(matchedSignals, company);

  // Priority
  let priority: 'A' | 'B' | 'C' | 'D';
  if (score >= 100) priority = 'A';
  else if (score >= 80) priority = 'B';
  else if (score >= 60) priority = 'C';
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
    fitType,
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
    company.scrapedText,
  ]
    .filter(Boolean)
    .join(' ');
}
