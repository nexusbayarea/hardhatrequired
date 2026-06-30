import { Company, Contact, SearchFilters } from '@/types/company';
import { VerticalConfig } from '@/types/config';
import { VerticalConfigWithProviders, isIrrelevant } from './registry';
import { ApolloAdapter } from './providers/apollo';
import { KeywordSignalExtractor } from './signals';
import { calculateLeadScore, buildAnalysisText } from './scoring';
import { geocodeZip, haversineDistance } from '@/lib/geo';
import { getCompanyProfile, getBlacklistedVerticalCompanies } from '@/lib/feedback/storage';
import { getFeedbackAdjustment } from '@/lib/feedback/trust';
import { FastJsonLdScraper } from '@/lib/market/scrapers/fastScraper';

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

    for (let i = 0; i < filteredPool.length; i++) {
      const record = filteredPool[i];
      const isPermit = record.source === 'regulatory_permit';

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

      if (isPermit) {
        const distance =
          record.latitude != null && record.longitude != null && zipCoords
            ? Math.round(haversineDistance(zipCoords.lat, zipCoords.lng, record.latitude, record.longitude) * 10) / 10
            : undefined;

        const text = buildAnalysisText(record);
        const result = calculateLeadScore(record, config, text, distance);

        const fbProfile = await getCompanyProfile(record.id || '', config.id);
        let fbAdj = 0;
        if (fbProfile && fbProfile.totalVotes >= 3) {
          fbAdj = getFeedbackAdjustment(fbProfile).adjustment;
          if (getFeedbackAdjustment(fbProfile).action === 'blacklist') {
            console.log(`[BLACKLIST] ${record.companyName} — regulatory permit blacklisted by feedback`);
            continue;
          }
        }

        base.enrichmentScore = Math.max(0, result.score + fbAdj);
        base.priority = result.priority;
        base.distanceMiles = distance;

        if (result.score < 65 || result.priority === 'D') {
          continue;
        }

        finalizedCompanies.push(base as Company);
        continue;
      }

      // Stage 1: Pre-filter before Apollo (saves API credits)
      const precheckText = `${record.companyName || ''} ${record.notes || ''} ${record.address || ''}`;
      const precheck = this.signalExtractor.extract(
        precheckText,
        config.signals,
        config.equipmentKeywords,
        record
      );
      if (!precheck.hasSignals || precheck.confidence === 'low') {
        console.log(`[PREFILTER] ${record.companyName} — skipped before Apollo (hasSignals=${precheck.hasSignals} confidence=${precheck.confidence})`);
        continue;
      }

      const apolloResult = await this.apolloAdapter.enrich(base);

      // Merge Apollo fields into base so buildAnalysisText + signalExtractor see apolloDescription
      const mergedBase: Partial<Company> = {
        ...base,
        ...apolloResult.companyFields,
      };

      // Stage 2a: Fast JSON-LD scrape before signal extraction (skips LLM if structured data found)
      if (mergedBase.website) {
        const scraped = await this.fastScraper.extractBusinessData(mergedBase.website);
        if (scraped) {
          if (!mergedBase.phone && scraped.extractedPhone) mergedBase.phone = scraped.extractedPhone;
          if (!mergedBase.email && scraped.extractedEmail) mergedBase.email = scraped.extractedEmail;
          if (scraped.rawDescription) {
            mergedBase.apolloDescription = [mergedBase.apolloDescription, scraped.rawDescription]
              .filter(Boolean)
              .join(' | ');
          }
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

      const scoringText = buildAnalysisText(mergedCompany);
      const result = calculateLeadScore(mergedCompany, config, scoringText, mergedCompany.distanceMiles);
      mergedCompany.enrichmentScore = result.score;
      mergedCompany.priority = result.priority;

      // Stage 4: User Feedback Layer — adjust score based on historical feedback
      const feedbackProfile = await getCompanyProfile(mergedCompany.id || '', config.id);
      let feedbackAction = 'none';
      if (feedbackProfile && feedbackProfile.totalVotes >= 3) {
        const adj = getFeedbackAdjustment(feedbackProfile);
        feedbackAction = adj.action;
        mergedCompany.enrichmentScore = Math.max(0, result.score + adj.adjustment);
        if (feedbackAction === 'blacklist') {
          console.log(`[BLACKLIST] ${mergedCompany.companyName} — score=${mergedCompany.enrichmentScore} (${feedbackAction})`);
          continue;
        }
      }

      // Stage 5: Hard filter garbage after scoring + feedback
      if (result.score < 65 || result.priority === 'D') {
        console.log(`[FILTERED] ${mergedCompany.companyName} — score=${result.score} confidence=${result.confidence} priority=${result.priority} negatives=${result.negativeHits.join(',')} reason=${result.relevanceReason} feedback=${feedbackAction}`);
        continue;
      }

      console.log(`[SCORE] ${mergedCompany.companyName} — score=${result.score} confidence=${result.confidence} priority=${result.priority} matched=${result.matchedSignals.join(',')} reason=${result.relevanceReason} feedback=${feedbackAction}`);

      const contactId = `contact-${mergedCompany.id}`;
      finalizedCompanies.push(mergedCompany as Company);
      allContacts.push(...companyContacts.map((c, i) => ({
        ...c,
        id: `${contactId}-${i}`
      })) as Contact[]);
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
