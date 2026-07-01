import { Company } from '@/types/company';
import { VerticalConfig } from '@/types/config';
import { calculateLeadScore, buildAnalysisText } from '@/lib/market/scoring';
import { getCompanyProfile } from '@/lib/feedback/storage';
import { getFeedbackAdjustment } from '@/lib/feedback/trust';
import { HotScoreCache } from './cache';
import {
  TenantProfile,
  TenantScoreResult,
  ScoreComponents,
  getGrade,
  createTenantProfile,
} from './tenant';
import { SignalEvent, resolveImpactedTenants, VendorChangePayload } from './events';
import { calculateFiveComponentScore, FiveComponentInput } from './formula';

export class ScoreEngine {
  private cache: HotScoreCache;
  private tenants: Map<string, TenantProfile>;

  constructor(cache?: HotScoreCache) {
    this.cache = cache ?? new HotScoreCache();
    this.tenants = new Map();
  }

  registerTenant(profile: TenantProfile): void {
    this.tenants.set(profile.tenantId, profile);
  }

  getTenant(tenantId: string): TenantProfile | undefined {
    return this.tenants.get(tenantId);
  }

  async handleEvent(event: SignalEvent): Promise<void> {
    const impacted = resolveImpactedTenants(event.vendorId, event, this.tenants);
    for (const tenantId of impacted.verticalIds) {
      const tenant = this.tenants.get(tenantId);
      if (!tenant) continue;
      await this.recalculateVendor(tenant, event.vendorId, event.verticalId);
    }
  }

  async handleVendorChange(
    payload: VendorChangePayload,
    vendorCompany: Partial<Company>,
    config: VerticalConfig,
  ): Promise<void> {
    const event: SignalEvent = {
      id: `change-${payload.vendorId}-${Date.now()}`,
      eventType: payload.eventType,
      vendorId: payload.vendorId,
      verticalId: '',
      timestamp: new Date().toISOString(),
      payload: payload.newData,
    };

    for (const [, tenant] of this.tenants) {
      if (tenant.verticals.includes(config.id)) {
        event.verticalId = config.id;
        await this.hotScore(tenant, vendorCompany, config);
      }
    }
  }

  async hotScore(
    tenant: TenantProfile,
    company: Partial<Company>,
    config: VerticalConfig,
  ): Promise<TenantScoreResult> {
    const text = buildAnalysisText(company);
    const existingResult = calculateLeadScore(company, config, text, company.distanceMiles);

    const input: FiveComponentInput = {
      baseRelevanceScore: existingResult.score,
      hasRegulatoryPermit: company.hasRegulatoryPermit ?? false,
      distanceMiles: company.distanceMiles,
      feedbackPositiveCount: company.feedbackPositiveCount,
      feedbackNegativeCount: company.feedbackNegativeCount,
      scrapedIsCommercial: company.scrapedIsCommercial,
      scrapedIsResidential: company.scrapedIsResidential,
      scrapedIsMismatch: company.scrapedIsMismatch,
      scrapedKeywords: company.scrapedKeywords,
      scrapedLicenseNumbers: company.scrapedLicenseNumbers,
      hasWebsite: !!company.website,
      hasPhone: !!company.phone,
      hasEmail: !!company.email,
      hasAddress: !!company.address,
      googleRating: company.googleRating,
      googleReviewCount: company.googleReviewCount,
      matchedSignals: existingResult.matchedSignals,
      negativeHits: existingResult.negativeHits,
    };

    const components = calculateFiveComponentScore(input, config, tenant.weights);

    const feedbackProfile = await getCompanyProfile(company.id || '', config.id);
    let feedbackAdjustment = 0;
    if (feedbackProfile && feedbackProfile.totalVotes >= 3) {
      feedbackAdjustment = getFeedbackAdjustment(feedbackProfile).adjustment;
    }

    const finalScore = Math.round(Math.max(0, components.total + feedbackAdjustment));

    const result: TenantScoreResult = {
      tenantId: tenant.tenantId,
      vendorId: company.id || '',
      score: finalScore,
      grade: getGrade(finalScore),
      confidence: existingResult.confidence,
      components,
      scoredAt: new Date().toISOString(),
    };

    await this.cache.setScore(tenant.tenantId, result.vendorId, result);
    return result;
  }

  async recalculateVendor(
    tenant: TenantProfile,
    vendorId: string,
    verticalId: string,
  ): Promise<void> {
    await this.cache.invalidateVendor(vendorId);
  }

  async coldScore(
    tenant: TenantProfile,
    companies: Partial<Company>[],
    config: VerticalConfig,
  ): Promise<TenantScoreResult[]> {
    const results: TenantScoreResult[] = [];
    for (const company of companies) {
      const result = await this.hotScore(tenant, company, config);
      results.push(result);
    }
    return results;
  }
}
