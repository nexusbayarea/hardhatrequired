import type { Permit } from '@/types/company';
import { VerticalConfig } from '@/types/config';
import { ScoreComponents } from './tenant';

export interface FiveComponentInput {
  baseRelevanceScore: number;
  permits?: Permit[];
  distanceMiles?: number;
  feedbackPositiveCount?: number;
  feedbackNegativeCount?: number;
  scrapedIsCommercial?: boolean;
  scrapedIsResidential?: boolean;
  scrapedIsMismatch?: boolean;
  scrapedKeywords?: string[];
  scrapedLicenseNumbers?: string[];
  hasWebsite?: boolean;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasAddress?: boolean;
  googleRating?: number;
  googleReviewCount?: number;
  matchedSignals?: string[];
  negativeHits?: string[];
}

export function calculateFiveComponentScore(
  input: FiveComponentInput,
  config: VerticalConfig,
  tenantWeights: {
    baseRelevance: number;
    compliance: number;
    geo: number;
    feedback: number;
    activity: number;
    distanceWeight: number;
    contactEnrichmentWeight: number;
  },
): ScoreComponents {
  const baseRelevance = Math.min(50, input.baseRelevanceScore);

  const activePermits = (input.permits ?? []).filter(p => p.status === 'Active').length;
  const expiredPermits = (input.permits ?? []).filter(p => p.status === 'Expired' || p.status === 'Revoked').length;
  const permitBonus = Math.min(tenantWeights.compliance, activePermits * 20);
  const expiredPenalty = expiredPermits * 10;
  const hasLicense = (input.scrapedLicenseNumbers?.length ?? 0) > 0;
  const complianceScore = Math.max(0, Math.min(tenantWeights.compliance, permitBonus + (hasLicense ? 10 : 0) - expiredPenalty));

  let geoScore = 0;
  const d = input.distanceMiles;
  if (d !== undefined) {
    if (d <= 10) geoScore = tenantWeights.geo + 10;
    else if (d <= 25) geoScore = tenantWeights.geo;
    else if (d <= 50) geoScore = tenantWeights.geo - 5;
    else geoScore = 0;
  }

  const positiveFeedback = input.feedbackPositiveCount || 0;
  const negativeFeedback = input.feedbackNegativeCount || 0;
  const feedbackScore = Math.max(
    0,
    Math.min(tenantWeights.feedback, positiveFeedback * 3) - negativeFeedback * 5,
  );

  let activityScore = 0;
  const profileBonus =
    (input.hasPhone ? tenantWeights.contactEnrichmentWeight : 0) +
    (input.hasWebsite ? 8 : 0) +
    (input.hasEmail ? 5 : 0);
  const scrapeBonus = input.scrapedIsCommercial
    ? 10
    : input.scrapedIsResidential
      ? -10
      : 0;
  const mismatchPenalty = input.scrapedIsMismatch ? -20 : 0;
  const keywordBonus = Math.min(15, (input.scrapedKeywords?.length ?? 0) * 3);
  activityScore = Math.max(
    0,
    Math.min(tenantWeights.activity, profileBonus + scrapeBonus + keywordBonus + mismatchPenalty),
  );

  const total = Math.round(baseRelevance + complianceScore + geoScore + feedbackScore + activityScore);

  return {
    baseRelevance,
    compliance: complianceScore,
    geo: geoScore,
    feedback: feedbackScore,
    activity: activityScore,
    total,
  };
}
