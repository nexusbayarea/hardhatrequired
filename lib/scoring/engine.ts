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
} from './tenant';
import { SignalEvent, resolveImpactedTenants, VendorChangePayload } from './events';
import { calculateFiveComponentScore, FiveComponentInput } from './formula';

export interface ScoredVendor {
  result: TenantScoreResult;
  feedbackAction: 'none' | 'downrank' | 'strong_downrank' | 'blacklist';
}

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
  ): Promise<ScoredVendor> {
    const text = buildAnalysisText(company);
    const existingResult = calculateLeadScore(company, config, text, company.distanceMiles);

    const input: FiveComponentInput = {
      baseRelevanceScore: existingResult.score,
      permits: company.permits,
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
    let feedbackAction: ScoredVendor['feedbackAction'] = 'none';
    let feedbackAdjustment = 0;
    if (feedbackProfile && feedbackProfile.totalVotes >= 3) {
      const adj = getFeedbackAdjustment(feedbackProfile);
      feedbackAction = adj.action as ScoredVendor['feedbackAction'];
      feedbackAdjustment = adj.adjustment;
    }

    const finalScore = Math.round(Math.max(0, components.total + feedbackAdjustment));

    const result: TenantScoreResult = {
      tenantId: tenant.tenantId,
      vendorId: company.id || '',
      score: finalScore,
      grade: getGrade(finalScore),
      confidence: existingResult.confidence,
      fitType: existingResult.fitType,
      components,
      matchedSignals: existingResult.matchedSignals,
      negativeHits: existingResult.negativeHits,
      relevanceReason: existingResult.relevanceReason,
      scoredAt: new Date().toISOString(),
    };

    await this.cache.setScore(tenant.tenantId, result.vendorId, result);
    return { result, feedbackAction };
  }

  async recalculateVendor(
    tenant: TenantProfile,
    vendorId: string,
    verticalId: string,
  ): Promise<void> {
    await this.cache.invalidateVendor(vendorId);
  }

  async getCachedOrScore(
    tenant: TenantProfile,
    company: Partial<Company>,
    config: VerticalConfig,
  ): Promise<ScoredVendor | null> {
    const cached = await this.cache.getScore(tenant.tenantId, company.id || '');
    if (cached) return { result: cached, feedbackAction: 'none' };
    return this.hotScore(tenant, company, config);
  }

  async cacheSearchResults(
    tenantId: string,
    verticalId: string,
    zip: string,
    results: TenantScoreResult[],
  ): Promise<void> {
    await this.cache.cacheSearchResults(tenantId, verticalId, zip, results);
  }

  async getCachedSearchResults(
    tenantId: string,
    verticalId: string,
    zip: string,
  ): Promise<TenantScoreResult[] | null> {
    return this.cache.getSearchResults(tenantId, verticalId, zip);
  }

  async coldScore(
    tenant: TenantProfile,
    companies: Partial<Company>[],
    config: VerticalConfig,
  ): Promise<TenantScoreResult[]> {
    const results: TenantScoreResult[] = [];
    for (const company of companies) {
      const scored = await this.hotScore(tenant, company, config);
      results.push(scored.result);
    }
    return results;
  }
}
