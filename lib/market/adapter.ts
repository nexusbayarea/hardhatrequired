import { Company, Contact, SearchFilters } from '@/types/company';
import { VerticalConfig, SignalLayers } from '@/types/config';
import { VerticalConfigWithProviders, isIrrelevant } from './registry';
import { getEnterpriseOverlay } from './enterpriseOverlay';
import { ApolloAdapter } from './providers/apollo';
import { KeywordSignalExtractor } from './signals';
import { buildAnalysisText } from './scoring';
import { ScoreEngine, createTenantProfile } from '@/lib/scoring';
import { geocodeZip, haversineDistance } from '@/lib/geo';
import { getBlacklistedVerticalCompanies, getFeedbackCounts } from '@/lib/feedback/storage';
import { FastJsonLdScraper } from '@/lib/market/scrapers/fastScraper';
import { scrapeCompanyWebsite } from '@/lib/market/workers/enrichmentScraper';
import { GeminiScraperAdapter } from '@/lib/market/providers/geminiScraper';
import { harvestContractorSignals } from '@/lib/discovery/edgeScraper';
import { buildDisposalSignals } from './disposal-signals';
import { disposalPrefilter } from './disposal-prefilter';
import { GooglePlacesDisposalProvider } from './providers/google-disposal';
import { OverpassDisposalProvider } from './providers/overpass-disposal';
import { withTimeout } from '@/lib/timeouts';
import fs from 'fs';
import path from 'path';

const VERDICT_PATH = path.join(process.cwd(), 'data', 'verdicts.json');

function loadVerdictIds(vertical: string, mode: string): { good: Set<string>; bad: Set<string> } {
  try {
    if (!fs.existsSync(VERDICT_PATH)) return { good: new Set(), bad: new Set() };
    const raw = JSON.parse(fs.readFileSync(VERDICT_PATH, 'utf-8'));
    const entries: any[] = Array.isArray(raw) ? raw : [];
    const good = new Set<string>();
    const bad = new Set<string>();
    for (const e of entries) {
      if (e.vertical !== vertical || e.mode !== mode) continue;
      if (e.verdict === 'good') good.add(e.companyId);
      else if (e.verdict === 'bad') bad.add(e.companyId);
    }
    return { good, bad };
  } catch {
    return { good: new Set(), bad: new Set() };
  }
}

export class IndexIntelligenceEngine {
  private apolloAdapter = new ApolloAdapter();
  private signalExtractor = new KeywordSignalExtractor();
  private fastScraper = new FastJsonLdScraper();
  private scoreEngine = new ScoreEngine();
  private aiScraper = new GeminiScraperAdapter();

  async executeMarketDiscovery(
    filters: SearchFilters,
    config: VerticalConfig,
    organizationId?: string
  ): Promise<{ companies: Company[]; contacts: Contact[]; providerFailures: string[] }> {
    const configWithProviders = config as VerticalConfigWithProviders;
    const providers = configWithProviders.providers || [];

    const radiusFilter = filters.radius || 50;
    const zipCoords = await geocodeZip(filters.zip);
    const now = new Date().toISOString();

    const tenantId = organizationId || `${config.id}-anon`;
    const tenant = createTenantProfile(tenantId, organizationId || '', [config.id]);
    this.scoreEngine.registerTenant(tenant);

    console.log('[DISCOVERY_START]', {
      zip: filters.zip,
      radius: filters.radius,
      vertical: config.id,
      providers: providers.map(p => p.name),
      zipCoords,
    });

    const providerFailures: string[] = [];
    const providerResults = await Promise.all(
      providers.map(provider =>
        provider.search({
          zip: filters.zip,
          vertical: config.id,
          lat: zipCoords?.lat,
          lng: zipCoords?.lng,
          radius: filters.radius,
          searchQueries: filters.mode === 'disposal'
            ? (config.disposalQueries ?? config.searchQueries)
            : config.searchQueries,
          verticalConfig: config,
        }).catch(err => {
          console.error(`[${provider.name}] search failed:`, err);
          providerFailures.push(provider.name);
          return [] as Partial<Company>[];
        })
      )
    );

    providerResults.forEach((results, idx) => {
      console.log('[PROVIDER_RESULT]', {
        provider: providers[idx].name,
        count: results.length,
      });
    });

    // Stage 1b: Disposal-specific providers run in parallel with each other
    // but after the main providers — they use disposalSearchModifier directly
    // instead of generic searchQueries.
    if (filters.mode === 'disposal') {
      const disposalRadius = Math.max(filters.radius || 50, 60);
      const [googleDisposalResults, overpassResults] = await Promise.allSettled([
        new GooglePlacesDisposalProvider().searchDisposal({
          zip: filters.zip,
          lat: zipCoords?.lat,
          lng: zipCoords?.lng,
          radiusMiles: disposalRadius,
          verticalId: config.id,
          verticalConfig: config,
        }),
        zipCoords
          ? new OverpassDisposalProvider().searchDisposal({
              lat: zipCoords.lat,
              lng: zipCoords.lng,
              radiusMiles: disposalRadius,
              verticalId: config.id,
            })
          : Promise.resolve([]),
      ]);
      const disposalExtra = [
        ...(googleDisposalResults.status === 'fulfilled' ? googleDisposalResults.value : []),
        ...(overpassResults.status === 'fulfilled' ? overpassResults.value : []),
      ];
      console.log('[DISPOSAL_PROVIDERS]', {
        google: googleDisposalResults.status === 'fulfilled' ? googleDisposalResults.value.length : 'failed',
        overpass: overpassResults.status === 'fulfilled' ? overpassResults.value.length : 'failed',
      });
      providerResults.push(disposalExtra);
    }

    const rawTotal = providerResults.flat().length;
    const candidatePool: Partial<Company>[] = [];
    const seenKeys = new Set<string>();

    for (const results of providerResults) {
      for (const company of results) {
        const dedupKey = `${company.companyName || ''}|${company.address || ''}`
          .toLowerCase()
          .trim();
        if (dedupKey && !seenKeys.has(dedupKey)) {
          seenKeys.add(dedupKey);
          candidatePool.push(company);
        }
      }
    }

    console.log('[CANDIDATE_POOL]', {
      raw: rawTotal,
      deduped: candidatePool.length,
    });

    const negativeKeywords = config.negativeKeywords || [];
    const blacklistedIds = await getBlacklistedVerticalCompanies(config.id);
    const verdictIds = loadVerdictIds(config.id, filters.mode || 'labor');
    let verdictDrops = 0;

    let irrelevantDrops = 0;
    let blacklistDrops = 0;
    let radiusDrops = 0;
    let addressDrops = 0;
    let officeNameDrops = 0;

    // Disposal mode: reject non-physical addresses (suites, floors, rooms) and
    // non-operational names (corporate HQ, consulting offices, sales desks).
    // Permitted landfills and tipping yards don't have suite numbers.
    const DISPOSAL_ADDRESS_FLAGS = /\b(suite|ste[\s\.]|floor|fl[\s\.]|room|rm[\s\.]|building\s+[a-z])\b/i;
    const DISPOSAL_NAME_BAD = /\b(corporate|headquarters|hq|consulting|solutions)\b/i;

    const filteredPool = candidatePool.filter(c => {
      if (filters.mode === 'disposal') {
        const addr = c.address || '';
        if (DISPOSAL_ADDRESS_FLAGS.test(addr)) {
          addressDrops++;
          console.log(`[ADDRESS_FILTER] ${c.companyName} — dropped (office address: "${addr}")`);
          return false;
        }
        const name = c.companyName || '';
        if (DISPOSAL_NAME_BAD.test(name)) {
          officeNameDrops++;
          console.log(`[OFFICE_FILTER] ${c.companyName} — dropped (non-operational name)`);
          return false;
        }
      }
      if (isIrrelevant(c, negativeKeywords)) {
        irrelevantDrops++;
        return false;
      }
      if (c.id && blacklistedIds.includes(c.id)) {
        blacklistDrops++;
        console.log(`[BLACKLIST] ${c.companyName} — excluded by feedback profile`);
        return false;
      }
      if (c.id && verdictIds.bad.has(c.id)) {
        verdictDrops++;
        console.log(`[VERDICT] ${c.companyName} — excluded by verified bad verdict`);
        return false;
      }
      const d = c.distanceMiles ?? (
        c.latitude != null && c.longitude != null && zipCoords
          ? Math.round(haversineDistance(zipCoords.lat, zipCoords.lng, c.latitude, c.longitude) * 10) / 10
          : undefined
      );
      if (d != null && d > radiusFilter) {
        radiusDrops++;
        return false;
      }
      return true;
    });

    console.log('[FILTER_REASONS]', { irrelevantDrops, blacklistDrops, radiusDrops, verdictDrops, addressDrops, officeNameDrops });
    console.log('[FILTERED_POOL]', {
      candidatePool: candidatePool.length,
      filteredPool: filteredPool.length,
      dropped: candidatePool.length - filteredPool.length,
    });

    const finalizedCompanies: Company[] = [];
    const allContacts: Contact[] = [];
    const scoreBuckets = { A: 0, B: 0, C: 0, D: 0 };
    const isDisposalMode = filters.mode === 'disposal';
    const disposalSignals = buildDisposalSignals(config);
    const signalsToCheck = isDisposalMode ? disposalSignals : config.signals;
    const scoreConfig = isDisposalMode ? buildDisposalScoreConfig(config) : config;

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
        const scored = await this.scoreEngine.getCachedOrScore(tenant, recordWithDist, scoreConfig);
        if (!scored) continue;
        if (scored.feedbackAction === 'blacklist') continue;
        const sr = scored.result;
        if (isDisposalMode) {
          if (sr.score < 40) continue;
          // Regulatory-permitted facilities are government-verified physical sites;
          // never let them score below B-tier in disposal mode.
          if (sr.score < 70) {
            sr.score = 70;
            sr.grade = 'B';
            sr.confidence = Math.max(sr.confidence, 80);
            sr.relevanceReason = 'Regulatory-permitted facility (government-verified)';
          }
        } else {
          if (sr.score < 65 || sr.grade === 'D') continue;
        }
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
          fitType: sr.fitType,
          status: 'NOT_CONTACTED',
          createdAt: now,
          updatedAt: now,
        } as Company);
        continue;
      }

      // Pre-filter before Apollo
      const precheckText = `${record.companyName || ''} ${record.notes || ''} ${record.address || ''}`;
      const precheck = this.signalExtractor.extract(precheckText, signalsToCheck, config.equipmentKeywords, record);

      if (isDisposalMode) {
        // Disposal mode: use multi-gate prefilter instead of raw signal check.
        // Facilities like "Recology" or "GreenWaste" have opaque names with zero
        // disposal keywords, but are legitimate disposal destinations. The prefilter
        // checks Google category signals, OSM source, known operator names, and
        // NAICS codes before falling back to keyword matching.
        const gate = disposalPrefilter(record, precheck.hasSignals);
        if (!gate.pass) {
          console.log(`[DISPOSAL_PREFILTER] ${record.companyName} — dropped (${gate.reason})`);
          continue;
        }
        console.log(`[DISPOSAL_PREFILTER] ${record.companyName} — passed via ${gate.gate} (${gate.reason})`);
        toEnrich.push({ record, base });
        continue;
      }

      const isCuratedResult = record.notes?.startsWith('Curated');
      if (isCuratedResult) {
        toEnrich.push({ record, base });
        continue;
      }
      if (!precheck.hasSignals) {
        console.log(`[PREFILTER] ${record.companyName} — skipped before Apollo (no labor signals)`);
        continue;
      }
      if (precheck.confidence === 'low') {
        const hasPrimaryMatch = precheck.matchedSignals.some(s =>
          signalsToCheck.primary.some(p => p.term === s)
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
    // Cap enrichment to prevent 60s timeout — further companies get basic scoring
    const ENRICH_LIMIT = 20;
    const toRich = toEnrich.slice(0, ENRICH_LIMIT);
    const toBasic = toEnrich.slice(ENRICH_LIMIT);
    const PER_COMPANY_TIMEOUT = 30000;
    for (const { record, base } of toRich) {
      const enriched = await withTimeout(
        (async () => {
      const apolloResult = await this.apolloAdapter.enrich(base, apolloCache);

      const mergedBase: Partial<Company> = {
        ...apolloResult.companyFields,
        ...base,
        source: base.source
          ? `${base.source}+apollo`
          : apolloResult.companyFields.source || 'apollo',
        apolloDescription: apolloResult.companyFields.apolloDescription || base.apolloDescription,
      };

      if (mergedBase.website) {
        const [jsonLdResult, textResult, aiSignalResult, edgeResult] = await Promise.all([
          this.fastScraper.extractBusinessData(mergedBase.website),
          scrapeCompanyWebsite(mergedBase.website, config.equipmentKeywords || [], config.negativeKeywords),
          this.aiScraper.scanForSignals(mergedBase.website, config.equipmentKeywords || []).catch(() => null),
          harvestContractorSignals(mergedBase.website, config.equipmentKeywords || []).catch(() => null),
        ]);
        if (jsonLdResult) {
          if (!mergedBase.phone && jsonLdResult.extractedPhone) mergedBase.phone = jsonLdResult.extractedPhone;
          if (!mergedBase.email && jsonLdResult.extractedEmail) mergedBase.email = jsonLdResult.extractedEmail;
          if (jsonLdResult.rawDescription) {
            mergedBase.apolloDescription = [mergedBase.apolloDescription, jsonLdResult.rawDescription]
              .filter(Boolean).join(' | ');
          }
        }
        if (edgeResult) {
          mergedBase.scrapedIsCommercial = edgeResult.scrapedIsCommercial;
          mergedBase.scrapedIsResidential = edgeResult.scrapedIsResidential;
          mergedBase.scrapedKeywords = edgeResult.scrapedKeywords;
          mergedBase.scrapedLicenseNumbers = edgeResult.scrapedLicenseNumbers;
          mergedBase.scrapedText = edgeResult.scrapedText;
        } else if (textResult) {
          mergedBase.scrapedIsCommercial = textResult.isCommercial;
          mergedBase.scrapedIsResidential = textResult.isResidential;
          mergedBase.scrapedIsMismatch = textResult.isMismatch;
          mergedBase.scrapedKeywords = textResult.matchedKeywords;
          mergedBase.scrapedLicenseNumbers = textResult.licenseNumbers;
          mergedBase.scrapedText = textResult.rawText || undefined;
        }
        if (aiSignalResult?.hasSignals && aiSignalResult.capabilitySummary) {
          mergedBase.aiSummary = aiSignalResult.capabilitySummary;
        }
      }

      const signalText = buildAnalysisText(mergedBase);
      const signalResult = this.signalExtractor.extract(
        signalText, config.signals, config.equipmentKeywords, mergedBase
      );

      const mergedCompany: Partial<Company> = {
        ...mergedBase,
        capabilitySummary: signalResult.capabilitySummary,
      };

      const companyContacts: Partial<Contact>[] = apolloResult.contacts.map(c => ({
        ...c, companyId: mergedCompany.id!
      }));

      const feedbackCounts = await getFeedbackCounts(mergedCompany.id || '', scoreConfig.id);
      mergedCompany.feedbackPositiveCount = feedbackCounts.positiveCount;
      mergedCompany.feedbackNegativeCount = feedbackCounts.negativeCount;

      const scored = await this.scoreEngine.getCachedOrScore(tenant, mergedCompany, scoreConfig);
      if (!scored) return null;
      const { result: scoreResult, feedbackAction } = scored;
      return { mergedCompany, companyContacts, scoreResult, feedbackAction };
        })(),
        PER_COMPANY_TIMEOUT,
        () => {
          console.log(`[ENRICH_TIMEOUT] ${record.companyName} — skipped after ${PER_COMPANY_TIMEOUT}ms`);
          return null;
        }
      );
      if (!enriched) continue;
      const { mergedCompany, companyContacts, scoreResult, feedbackAction } = enriched;

      console.log('[SCORE_RESULT]', {
        company: mergedCompany.companyName,
        score: scoreResult.score,
        grade: scoreResult.grade,
        confidence: scoreResult.confidence,
        signals: scoreResult.matchedSignals,
        negatives: scoreResult.negativeHits,
        feedbackAction,
      });

      scoreBuckets[scoreResult.grade]++;

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
      mergedCompany.fitType = scoreResult.fitType;

      // Stage 5: Hard filter garbage after scoring
      if (isDisposalMode) {
        if (scoreResult.score < 40) continue;
      } else {
        if (scoreResult.score < 65 || scoreResult.grade === 'D') continue;
      }

      const contactId = `contact-${mergedCompany.id}`;
      finalizedCompanies.push(mergedCompany as Company);
      allContacts.push(...companyContacts.map((c, i) => ({
        ...c,
        id: `${contactId}-${i}`
      })) as Contact[]);
    }

    // Stage 5b: Basic scoring for companies beyond enrichment cap
    for (const { record, base } of toBasic) {
      const signalText = buildAnalysisText(record);
      const signalResult = this.signalExtractor.extract(
        signalText,
        isDisposalMode ? signalsToCheck : config.signals,
        config.equipmentKeywords,
        record
      );
      const mergedCompany = {
        ...record,
        capabilitySummary: signalResult.capabilitySummary,
      };
      const scored = await this.scoreEngine.getCachedOrScore(tenant, mergedCompany, scoreConfig);
      if (!scored) continue;
      const { result: scoreResult, feedbackAction } = scored;
      if (feedbackAction === 'blacklist') continue;
      if (isDisposalMode) {
        if (scoreResult.score < 40) continue;
      } else {
        if (scoreResult.score < 65 || scoreResult.grade === 'D') continue;
      }
      finalizedCompanies.push({
        ...mergedCompany,
        enrichmentScore: scoreResult.score,
        priority: scoreResult.grade,
        matchedSignals: scoreResult.matchedSignals,
        negativeHits: scoreResult.negativeHits,
        relevanceReason: scoreResult.relevanceReason,
        confidence: scoreResult.confidence,
        fitType: scoreResult.fitType,
        organizationId: organizationId || '',
        verticalId: config.id,
        status: 'NOT_CONTACTED',
        createdAt: now,
        updatedAt: now,
      } as Company);
      scoreBuckets[scoreResult.grade]++;
    }

    // Stage 6: Enterprise overlay — inject known market leaders not found by providers
    const enterpriseCompanies = getEnterpriseOverlay(config.id, filters.zip, radiusFilter);

    // Calculate distances for enterprise entries using zip geocoding
    if (enterpriseCompanies.length > 0) {
      const targetCoords = await geocodeZip(filters.zip);
      if (targetCoords) {
        const zipCache = new Map<string, { lat: number; lng: number } | null>();
        for (const ec of enterpriseCompanies) {
          if (!ec.zip) continue;
          if (!zipCache.has(ec.zip)) {
            zipCache.set(ec.zip, await geocodeZip(ec.zip));
          }
          const branchCoords = zipCache.get(ec.zip);
          if (branchCoords) {
            ec.distanceMiles = Math.round(haversineDistance(
              targetCoords.lat, targetCoords.lng,
              branchCoords.lat, branchCoords.lng
            ) * 10) / 10;
          }
        }
      }
    }

    // Filter enterprise entries beyond the search radius
    const filteredEnterprise = enterpriseCompanies.filter(ec => {
      if (ec.distanceMiles == null) return true;
      return ec.distanceMiles <= radiusFilter;
    });
    const droppedCount = enterpriseCompanies.length - filteredEnterprise.length;
    if (droppedCount > 0) {
      console.log(`[ENTERPRISE] Dropped ${droppedCount}/${enterpriseCompanies.length} entries — beyond ${radiusFilter}mi radius`);
    }

    for (const ec of filteredEnterprise) {
      const alreadyIncluded = finalizedCompanies.some(fc =>
        fc.companyName?.toLowerCase().includes(ec.companyName?.toLowerCase().split(' - ')[0]?.toLowerCase() || '')
      );
      if (!alreadyIncluded) {
        // Skip if verdict store says the base company name is bad
        const ecBase = (ec.companyName || '').toLowerCase().split(' - ')[0]?.toLowerCase() || '';
        let verdictSkipped = false;
        try {
          if (fs.existsSync(VERDICT_PATH)) {
            const raw = JSON.parse(fs.readFileSync(VERDICT_PATH, 'utf-8'));
            const entries: any[] = Array.isArray(raw) ? raw : [];
            for (const e of entries) {
              if (e.vertical !== config.id || e.mode !== (filters.mode || 'labor')) continue;
              if (e.verdict !== 'bad') continue;
              const eBase = (e.companyName || '').toLowerCase().split(' - ')[0]?.toLowerCase() || '';
              if (ecBase && eBase && (ecBase.includes(eBase) || eBase.includes(ecBase))) {
                verdictSkipped = true;
                console.log(`[VERDICT] Enterprise skip ${ec.companyName} — matches bad verdict for ${e.companyName}`);
                break;
              }
            }
          }
        } catch {}
        if (verdictSkipped) continue;
        const now = new Date().toISOString();
        finalizedCompanies.push({
          ...ec,
          organizationId: organizationId || '',
          verticalId: config.id,
          enrichmentScore: 100,
          priority: 'A',
          status: 'NOT_CONTACTED',
          matchedSignals: ['enterprise_overlay'],
          confidence: 100,
          fitType: isDisposalMode ? 'DISPOSAL_NODE' : 'DIRECT_OPERATOR',
          relevanceReason: `Enterprise market leader — ${ec.notes || 'injected via overlay'}`,
          createdAt: now,
          updatedAt: now,
        } as Company);
        console.log(`[ENTERPRISE] ${ec.companyName} — injected at 130/A (enterprise overlay)`);
      }
    }

    console.log('[SCORE_DISTRIBUTION]', scoreBuckets);
    console.log('[FINAL_RESULTS]', {
      companies: finalizedCompanies.length,
      contacts: allContacts.length,
      providerFailures,
    });

    const gradeOrder: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    finalizedCompanies.sort((a, b) => {
      const g = (gradeOrder[a.priority || 'D'] ?? 3) - (gradeOrder[b.priority || 'D'] ?? 3);
      if (g !== 0) return g;
      return (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity);
    });

    return { companies: finalizedCompanies, contacts: allContacts, providerFailures };
  }
}

export class IndexIntelligenceOrchestrator extends IndexIntelligenceEngine {}

function buildDisposalScoreConfig(config: VerticalConfig): VerticalConfig {
  return {
    ...config,
    signals: buildDisposalSignals(config),
  };
}
