import { Company, Contact, SearchFilters } from '@/types/company';
import { VerticalConfig } from '@/types/config';
import { VerticalConfigWithProviders, isIrrelevant } from './registry';
import { getEnterpriseOverlay } from './enterpriseOverlay';
import { ApolloAdapter } from './providers/apollo';
import { KeywordSignalExtractor } from './signals';
import { calculateLeadScore, buildAnalysisText } from './scoring';
import { geocodeZip, haversineDistance } from '@/lib/geo';
import { getCompanyProfile, getBlacklistedVerticalCompanies } from '@/lib/feedback/storage';
import { getFeedbackAdjustment } from '@/lib/feedback/trust';
import { FastJsonLdScraper } from '@/lib/market/scrapers/fastScraper';
import { scrapeCompanyWebsite } from '@/lib/market/workers/enrichmentScraper';

export class IndexIntelligenceEngine {
  private apolloAdapter = new ApolloAdapter();
  private signalExtractor = new KeywordSignalExtractor();
  private fastScraper = new FastJsonLdScraper();

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

    // Split regulatory permits (fast, synchronous path) from standard companies
    const permits = filteredPool.filter(r => r.source === 'regulatory_permit');
    const standardRecords = filteredPool.filter(r => r.source !== 'regulatory_permit');

    // Process permits synchronously (fast — no network calls)
    for (const record of permits) {
      const distance = record.latitude != null && record.longitude != null && zipCoords
        ? Math.round(haversineDistance(zipCoords.lat, zipCoords.lng, record.latitude, record.longitude) * 10) / 10
        : undefined;
      const text = buildAnalysisText(record);
      const result = calculateLeadScore(record, config, text, distance);
      const fbProfile = await getCompanyProfile(record.id || '', config.id);
      let fbAdj = 0;
      if (fbProfile && fbProfile.totalVotes >= 3) {
        fbAdj = getFeedbackAdjustment(fbProfile).adjustment;
        if (getFeedbackAdjustment(fbProfile).action === 'blacklist') continue;
      }
      const score = Math.max(0, result.score + fbAdj);
      if (score < 65 || result.priority === 'D') continue;
      finalizedCompanies.push({
        ...record,
        organizationId,
        verticalId: config.id,
        enrichmentScore: score,
        priority: result.priority,
        distanceMiles: distance,
        matchedSignals: result.matchedSignals,
        negativeHits: result.negativeHits,
        relevanceReason: result.relevanceReason,
        confidence: result.confidence,
        status: 'NOT_CONTACTED',
        createdAt: now,
        updatedAt: now,
      } as Company);
    }

    // Stage 1: Pre-filter standard records (synchronous) before batching
    const toEnrich: { record: Partial<Company>; base: Partial<Company> }[] = [];
    for (const record of standardRecords) {
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

    // Process enrichment in parallel batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
      const batch = toEnrich.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(async ({ record, base }) => {
          const apolloResult = await this.apolloAdapter.enrich(base);
          const mergedBase: Partial<Company> = {
            ...apolloResult.companyFields,
            ...base,
            source: base.source ? `${base.source}+apollo` : apolloResult.companyFields.source || 'apollo',
            apolloDescription: apolloResult.companyFields.apolloDescription || base.apolloDescription,
          };

          // Stage 2: Scrape website — FastJsonLd + full text in parallel
          if (mergedBase.website) {
            const [jsonLdResult, textResult] = await Promise.all([
              this.fastScraper.extractBusinessData(mergedBase.website).catch(() => null),
              scrapeCompanyWebsite(mergedBase.website, config.equipmentKeywords || []).catch(() => null),
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
              mergedBase.scrapedKeywords = textResult.matchedKeywords;
              mergedBase.scrapedLicenseNumbers = textResult.licenseNumbers;
            }
          }

          // Stage 3: Signal extraction + scoring
          const signalText = buildAnalysisText(mergedBase);
          const signalResult = this.signalExtractor.extract(signalText, config.signals, config.equipmentKeywords, mergedBase);
          const mergedCompany: Partial<Company> = {
            ...mergedBase,
            capabilitySummary: signalResult.capabilitySummary,
          };
          const companyContacts: Partial<Contact>[] = apolloResult.contacts.map(c => ({
            ...c,
            companyId: mergedCompany.id!
          }));
          const scoringText = buildAnalysisText(mergedCompany);
          const result = calculateLeadScore(mergedCompany, config, scoringText, mergedCompany.distanceMiles);
          mergedCompany.enrichmentScore = result.score;
          mergedCompany.priority = result.priority;
          mergedCompany.matchedSignals = result.matchedSignals;
          mergedCompany.negativeHits = result.negativeHits;
          mergedCompany.relevanceReason = result.relevanceReason;
          mergedCompany.confidence = result.confidence;

          // Stage 4: Feedback adjustment
          const feedbackProfile = await getCompanyProfile(mergedCompany.id || '', config.id);
          let feedbackAction = 'none';
          if (feedbackProfile && feedbackProfile.totalVotes >= 3) {
            const adj = getFeedbackAdjustment(feedbackProfile);
            feedbackAction = adj.action;
            mergedCompany.enrichmentScore = Math.max(0, result.score + adj.adjustment);
            if (feedbackAction === 'blacklist') return null;
          }

          // Stage 5: Hard filter
          if (result.score < 65 || result.priority === 'D') {
            console.log(`[FILTERED] ${mergedCompany.companyName} — score=${result.score} confidence=${result.confidence} priority=${result.priority} negatives=${result.negativeHits.join(',')} reason=${result.relevanceReason} feedback=${feedbackAction}`);
            return null;
          }

          console.log(`[SCORE] ${mergedCompany.companyName} — score=${result.score} confidence=${result.confidence} priority=${result.priority} matched=${result.matchedSignals.join(',')} reason=${result.relevanceReason} feedback=${feedbackAction}`);
          return { company: mergedCompany as Company, contacts: companyContacts as Contact[] };
        })
      );

      for (const settled of batchResults) {
        if (settled.status === 'fulfilled' && settled.value) {
          finalizedCompanies.push(settled.value.company);
          allContacts.push(...settled.value.contacts);
        }
      }
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
