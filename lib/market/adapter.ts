import { Company, Contact, SearchFilters } from '@/types/company';
import { VerticalConfig } from '@/types/config';
import { VerticalConfigWithProviders, isIrrelevant } from './registry';
import { getEnterpriseOverlay } from './enterpriseOverlay';
import { ApolloAdapter } from './providers/apollo';
import { KeywordSignalExtractor } from './signals';
import { buildAnalysisText } from './scoring';
import { ScoreEngine, createTenantProfile } from '@/lib/scoring';
import { geocodeZip, haversineDistance } from '@/lib/geo';
import { getBlacklistedVerticalCompanies } from '@/lib/feedback/storage';
import { FastJsonLdScraper } from '@/lib/market/scrapers/fastScraper';
import { scrapeCompanyWebsite } from '@/lib/market/workers/enrichmentScraper';

export class IndexIntelligenceEngine {
  private apolloAdapter = new ApolloAdapter();
  private signalExtractor = new KeywordSignalExtractor();
  private fastScraper = new FastJsonLdScraper();
  private scoreEngine = new ScoreEngine();

  async executeMarketDiscovery(
    filters: SearchFilters,
    config: VerticalConfig,
    organizationId?: string
  ): Promise<{ companies: Company[]; contacts: Contact[] }> {
    const configWithProviders = config as VerticalConfigWithProviders;
    const providers = configWithProviders.providers || [];

    const radiusFilter = filters.radius || 50;
    const zipCoords = await geocodeZip(filters.zip);
    const now = new Date().toISOString();

    const tenantId = organizationId || `${config.id}-anon`;
    const tenant = createTenantProfile(tenantId, organizationId || '', [config.id]);
    this.scoreEngine.registerTenant(tenant);

    const providerResults = await Promise.all(
      providers.map(provider =>
        provider.search({
          zip: filters.zip,
          vertical: config.id,
          lat: zipCoords?.lat,
          lng: zipCoords?.lng,
          radius: filters.radius,
          searchQueries: config.searchQueries,
          verticalConfig: config,
        }).catch(err => {
          console.error(`[${provider.name}] search failed:`, err);
          return [] as Partial<Company>[];
        })
      )
    );

    const candidatePool: Partial<Company>[] = [];
    const seenNames = new Set<string>();

    for (const results of providerResults) {
      for (const company of results) {
        const normalizedName = company.companyName?.toLowerCase().trim();
        if (normalizedName && !seenNames.has(normalizedName)) {
          seenNames.add(normalizedName);
          candidatePool.push(company);
        }
      }
    }

    const negativeKeywords = config.negativeKeywords || [];
    const blacklistedIds = await getBlacklistedVerticalCompanies(config.id);

    const filteredPool = candidatePool.filter(c => {
      if (isIrrelevant(c, negativeKeywords)) return false;
      if (c.id && blacklistedIds.includes(c.id)) {
        console.log(`[BLACKLIST] ${c.companyName} — excluded by feedback profile`);
        return false;
      }
      const d = c.distanceMiles ?? (
        c.latitude != null && c.longitude != null && zipCoords
          ? Math.round(haversineDistance(zipCoords.lat, zipCoords.lng, c.latitude, c.longitude) * 10) / 10
          : undefined
      );
      if (d != null && d > radiusFilter) return false;
      return true;
    });

    const finalizedCompanies: Company[] = [];
    const allContacts: Contact[] = [];

    // Phase 1: Pre-filter + permit fast path
    const toEnrich: { record: Partial<Company>; base: Partial<Company> }[] = [];
    for (const record of filteredPool) {
      const base: Partial<Company> = {
        ...record,
        organizationId,
        verticalId: config.id,
        enrichmentScore: 0,
        priority: 'C' as const,
        status: 'NOT_CONTACTED' as const,
        createdAt: now,
        updatedAt: now,
      };

      if (record.source === 'regulatory_permit') {
        const distance = record.latitude != null && record.longitude != null && zipCoords
          ? Math.round(haversineDistance(zipCoords.lat, zipCoords.lng, record.latitude, record.longitude) * 10) / 10
          : undefined;
        const recordWithDist = { ...record, distanceMiles: distance };
        const scored = await this.scoreEngine.getCachedOrScore(tenant, recordWithDist, config);
        if (!scored) continue;
        if (scored.feedbackAction === 'blacklist') continue;
        const sr = scored.result;
        if (sr.score < 65 || sr.grade === 'D') continue;
        finalizedCompanies.push({
          ...record,
          organizationId,
          verticalId: config.id,
          enrichmentScore: sr.score,
          priority: sr.grade,
          distanceMiles: distance,
          matchedSignals: sr.matchedSignals,
          negativeHits: sr.negativeHits,
          relevanceReason: sr.relevanceReason,
          confidence: sr.confidence,
          status: 'NOT_CONTACTED',
          createdAt: now,
          updatedAt: now,
        } as Company);
        continue;
      }

      // Pre-filter before Apollo
      const precheckText = `${record.companyName || ''} ${record.notes || ''} ${record.address || ''}`;
      const precheck = this.signalExtractor.extract(precheckText, config.signals, config.equipmentKeywords, record);
      if (!precheck.hasSignals) {
        console.log(`[PREFILTER] ${record.companyName} — skipped before Apollo (no signals)`);
        continue;
      }
      if (precheck.confidence === 'low') {
        const hasPrimaryMatch = precheck.matchedSignals.some(s =>
          config.signals.primary.some(p => p.term === s)
        );
        if (!hasPrimaryMatch) {
          console.log(`[PREFILTER] ${record.companyName} — skipped before Apollo (low confidence, no primary match)`);
          continue;
        }
      }
      toEnrich.push({ record, base });
    }

    // Pipeline all Apollo cache checks in one round-trip
    const apolloCache = await this.apolloAdapter.batchCheckCache(
      toEnrich.map(e => e.base)
    );

    // Phase 2: Enrich + scrape + score (sequential per company to protect Apollo credits)
    for (const { record, base } of toEnrich) {
      const apolloResult = await this.apolloAdapter.enrich(base, apolloCache);

      // Merge Apollo fields — base (provider data) wins for contacts, Apollo augments
      const mergedBase: Partial<Company> = {
        ...apolloResult.companyFields,
        ...base,
        source: base.source
          ? `${base.source}+apollo`
          : apolloResult.companyFields.source || 'apollo',
        apolloDescription: apolloResult.companyFields.apolloDescription || base.apolloDescription,
      };

      // Stage 2: Scrape website — FastJsonLd + full text in parallel
      if (mergedBase.website) {
        const [jsonLdResult, textResult] = await Promise.all([
          this.fastScraper.extractBusinessData(mergedBase.website),
          scrapeCompanyWebsite(mergedBase.website, config.equipmentKeywords || [], config.negativeKeywords),
        ]);
        if (jsonLdResult) {
          if (!mergedBase.phone && jsonLdResult.extractedPhone) mergedBase.phone = jsonLdResult.extractedPhone;
          if (!mergedBase.email && jsonLdResult.extractedEmail) mergedBase.email = jsonLdResult.extractedEmail;
          if (jsonLdResult.rawDescription) {
            mergedBase.apolloDescription = [mergedBase.apolloDescription, jsonLdResult.rawDescription]
              .filter(Boolean).join(' | ');
          }
        }
        if (textResult) {
          mergedBase.scrapedIsCommercial = textResult.isCommercial;
          mergedBase.scrapedIsResidential = textResult.isResidential;
          mergedBase.scrapedIsMismatch = textResult.isMismatch;
          mergedBase.scrapedKeywords = textResult.matchedKeywords;
          mergedBase.scrapedLicenseNumbers = textResult.licenseNumbers;
        }
      }

      // Stage 3: Rich signal extraction across all available data
      const signalText = buildAnalysisText(mergedBase);
      const signalResult = this.signalExtractor.extract(
        signalText,
        config.signals,
        config.equipmentKeywords,
        mergedBase
      );

      const mergedCompany: Partial<Company> = {
        ...mergedBase,
        capabilitySummary: signalResult.capabilitySummary,
      };

      const companyContacts: Partial<Contact>[] = apolloResult.contacts.map(c => ({
        ...c,
        companyId: mergedCompany.id!
      }));

      // Stage 4: Score via engine (caches per-vendor in Redis, applies 5-component formula + feedback)
      const scored = await this.scoreEngine.getCachedOrScore(tenant, mergedCompany, config);
      if (!scored) continue;

      const { result: scoreResult, feedbackAction } = scored;

      if (feedbackAction === 'blacklist') {
        console.log(`[BLACKLIST] ${mergedCompany.companyName} — score=${scoreResult.score} (${feedbackAction})`);
        continue;
      }

      mergedCompany.enrichmentScore = scoreResult.score;
      mergedCompany.priority = scoreResult.grade;
      mergedCompany.matchedSignals = scoreResult.matchedSignals;
      mergedCompany.negativeHits = scoreResult.negativeHits;
      mergedCompany.relevanceReason = scoreResult.relevanceReason;
      mergedCompany.confidence = scoreResult.confidence;

      // Stage 5: Hard filter garbage after scoring
      if (scoreResult.score < 65 || scoreResult.grade === 'D') {
        console.log(`[FILTERED] ${mergedCompany.companyName} — score=${scoreResult.score} confidence=${scoreResult.confidence} grade=${scoreResult.grade} negatives=${scoreResult.negativeHits.join(',')} reason=${scoreResult.relevanceReason} feedback=${feedbackAction}`);
        continue;
      }

      console.log(`[SCORE] ${mergedCompany.companyName} — score=${scoreResult.score} confidence=${scoreResult.confidence} grade=${scoreResult.grade} matched=${scoreResult.matchedSignals.join(',')} reason=${scoreResult.relevanceReason} feedback=${feedbackAction}`);

      const contactId = `contact-${mergedCompany.id}`;
      finalizedCompanies.push(mergedCompany as Company);
      allContacts.push(...companyContacts.map((c, i) => ({
        ...c,
        id: `${contactId}-${i}`
      })) as Contact[]);
    }

    // Stage 6: Enterprise overlay — inject known market leaders not found by providers
    const enterpriseCompanies = getEnterpriseOverlay(config.id, filters.zip, radiusFilter);
    for (const ec of enterpriseCompanies) {
      const alreadyIncluded = finalizedCompanies.some(fc =>
        fc.companyName?.toLowerCase().includes(ec.companyName?.toLowerCase().split(' - ')[0]?.toLowerCase() || '')
      );
      if (!alreadyIncluded) {
        const now = new Date().toISOString();
        finalizedCompanies.push({
          ...ec,
          organizationId: organizationId || '',
          verticalId: config.id,
          enrichmentScore: 130,
          priority: 'A',
          status: 'NOT_CONTACTED',
          matchedSignals: ['enterprise_overlay'],
          confidence: 100,
          relevanceReason: `Enterprise market leader — ${ec.notes || 'injected via overlay'}`,
          createdAt: now,
          updatedAt: now,
        } as Company);
        console.log(`[ENTERPRISE] ${ec.companyName} — injected at 130/A (enterprise overlay)`);
      }
    }

    const gradeOrder: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    finalizedCompanies.sort((a, b) => {
      const g = (gradeOrder[a.priority || 'D'] ?? 3) - (gradeOrder[b.priority || 'D'] ?? 3);
      if (g !== 0) return g;
      return (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity);
    });

    return { companies: finalizedCompanies, contacts: allContacts };
  }
}

export class IndexIntelligenceOrchestrator extends IndexIntelligenceEngine {}
