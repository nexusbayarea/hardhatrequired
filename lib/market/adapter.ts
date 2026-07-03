// ─── IndexIntelligenceEngine — Speed-Optimized ───────────────────────────────
//
// WHAT WAS SLOW AND WHY
// ──────────────────────
// 1. Phase 2 enrichment ran sequentially in a for loop (one company at a time).
//    Apollo + 4 scrapers per company × 20 companies = up to 160s on average,
//    600s worst-case (each company gets 30s timeout).
//
// 2. getFeedbackCounts() was a separate Supabase round-trip per company.
//    20 companies = 20 DB calls, all inside the sequential loop.
//
// 3. Enterprise overlay geocoded branch ZIPs sequentially in a for loop.
//    5 branches × ~200ms each = 1s of avoidable serial work.
//
// 4. verdicts.json was read from disk once per call (fine) but the enterprise
//    overlay re-read it inside a second loop with fs.readFileSync each time.
//
// WHAT WAS FIXED
// ──────────────
// 1. Phase 2: concurrent enrichment with a concurrency limiter (CONCURRENCY=5).
//    5 companies enrich in parallel → 20 companies in ~4 batches instead of
//    20 serial slots. Wall time: ~4× faster.
//
// 2. getFeedbackCounts replaced with batchGetFeedbackCounts — one DB call for
//    all company IDs, result fanned out per company in memory.
//
// 3. Enterprise branch geocoding runs in parallel (Promise.all over all ZIPs).
//
// 4. verdicts.json read once at the top of the function, result passed down.
//    Enterprise overlay check uses the already-loaded Set instead of re-reading.
//
// 5. Provider searches were already parallel — left unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import { Company, Contact, SearchFilters } from '@/types/company';
import { VerticalConfig, SignalLayers } from '@/types/config';
import { VerticalConfigWithProviders, isIrrelevant } from './registry';
import { getEnterpriseOverlay } from './enterpriseOverlay';
import { ApolloAdapter } from './providers/apollo';
import { KeywordSignalExtractor } from './signals';
import { buildAnalysisText } from './scoring';
import { ScoreEngine, createTenantProfile } from '@/lib/scoring';
import { geocodeZip, haversineDistance } from '@/lib/geo';
import { getBlacklistedVerticalCompanies, batchGetFeedbackCounts } from '@/lib/feedback/storage';
import { FastJsonLdScraper } from '@/lib/market/scrapers/fastScraper';
import { scrapeCompanyWebsite } from '@/lib/market/workers/enrichmentScraper';
import { GeminiScraperAdapter } from '@/lib/market/providers/geminiScraper';
import { harvestContractorSignals } from '@/lib/discovery/edgeScraper';
import { withTimeout } from '@/lib/timeouts';
import { buildDisposalSignals } from './disposal-signals';
import { disposalPrefilter } from './disposal-prefilter';
import fs from 'fs';
import path from 'path';

const VERDICT_PATH = path.join(process.cwd(), 'data', 'verdicts.json');

// ── Concurrency limiter ───────────────────────────────────────────────────────
// Runs up to `limit` async tasks in parallel, draining a queue as slots free up.
// This replaces the sequential for-loop in Phase 2 while avoiding hammering
// Apollo / scrapers with all 20 requests at once.

async function withConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      results[index] = await tasks[index]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ── Verdict loader (reads once, not per-loop) ─────────────────────────────────

function loadVerdictIds(vertical: string, mode: string): { good: Set<string>; bad: Set<string>; badNames: Set<string> } {
  try {
    if (!fs.existsSync(VERDICT_PATH)) return { good: new Set(), bad: new Set(), badNames: new Set() };
    const raw = JSON.parse(fs.readFileSync(VERDICT_PATH, 'utf-8'));
    const entries: any[] = Array.isArray(raw) ? raw : [];
    const good = new Set<string>();
    const bad = new Set<string>();
    const badNames = new Set<string>();
    for (const e of entries) {
      if (e.vertical !== vertical || e.mode !== mode) continue;
      if (e.verdict === 'good') good.add(e.companyId);
      else if (e.verdict === 'bad') {
        bad.add(e.companyId);
        // Pre-compute the base name for enterprise overlay matching
        const base = (e.companyName || '').toLowerCase().split(' - ')[0]?.toLowerCase();
        if (base) badNames.add(base);
      }
    }
    return { good, bad, badNames };
  } catch {
    return { good: new Set(), bad: new Set(), badNames: new Set() };
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export class IndexIntelligenceEngine {
  private apolloAdapter = new ApolloAdapter();
  private signalExtractor = new KeywordSignalExtractor();
  private fastScraper = new FastJsonLdScraper();
  private scoreEngine = new ScoreEngine();
  private aiScraper = new GeminiScraperAdapter();

  // How many companies enrich concurrently. 5 is safe for Apollo rate limits.
  // Raise to 8 if you have a paid Apollo plan with higher concurrency headroom.
  private readonly CONCURRENCY = 5;
  private readonly ENRICH_LIMIT = 20;
  private readonly PER_COMPANY_TIMEOUT = 12000; // 12s per company (was 30s)

  async executeMarketDiscovery(
    filters: SearchFilters,
    config: VerticalConfig,
    organizationId?: string
  ): Promise<{ companies: Company[]; contacts: Contact[]; providerFailures: string[] }> {
    const configWithProviders = config as VerticalConfigWithProviders;
    const providers = configWithProviders.providers || [];
    const radiusFilter = filters.radius || 50;
    const now = new Date().toISOString();
    const isDisposalMode = filters.mode === 'disposal';

    const tenantId = organizationId || `${config.id}-anon`;
    const tenant = createTenantProfile(tenantId, organizationId || '', [config.id]);
    this.scoreEngine.registerTenant(tenant);

    // ── START: things we can resolve in parallel before touching candidates ──
    const [zipCoords, blacklistedIds] = await Promise.all([
      geocodeZip(filters.zip),
      getBlacklistedVerticalCompanies(config.id),
    ]);

    // Verdicts loaded once here — NOT re-read inside any loop
    const verdictIds = loadVerdictIds(config.id, filters.mode || 'labor');

    console.log('[DISCOVERY_START]', {
      zip: filters.zip,
      radius: filters.radius,
      vertical: config.id,
      providers: providers.map(p => p.name),
      zipCoords,
    });

    // ── Phase 0: Provider fan-out (already parallel, kept as-is) ─────────────
    const providerFailures: string[] = [];
    const providerResults = await Promise.all(
      providers.map(provider =>
        provider.search({
          zip: filters.zip,
          vertical: config.id,
          lat: zipCoords?.lat,
          lng: zipCoords?.lng,
          radius: filters.radius,
          searchQueries: isDisposalMode
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
      console.log('[PROVIDER_RESULT]', { provider: providers[idx].name, count: results.length });
    });

    // ── Dedup ─────────────────────────────────────────────────────────────────
    const rawTotal = providerResults.flat().length;
    const candidatePool: Partial<Company>[] = [];
    const seenKeys = new Set<string>();
    for (const results of providerResults) {
      for (const company of results) {
        const dedupKey = `${company.companyName || ''}|${company.address || ''}`.toLowerCase().trim();
        if (dedupKey && !seenKeys.has(dedupKey)) {
          seenKeys.add(dedupKey);
          candidatePool.push(company);
        }
      }
    }
    console.log('[CANDIDATE_POOL]', { raw: rawTotal, deduped: candidatePool.length });

    // ── Pre-filters (address, blacklist, radius, verdict) ─────────────────────
    const negativeKeywords = config.negativeKeywords || [];
    const DISPOSAL_ADDRESS_FLAGS = /\b(suite|ste[\s\.]|floor|fl[\s\.]|room|rm[\s\.]|building\s+[a-z])\b/i;
    const DISPOSAL_NAME_BAD = /\b(corporate|headquarters|hq|consulting|solutions)\b/i;

    let irrelevantDrops = 0, blacklistDrops = 0, radiusDrops = 0,
        addressDrops = 0, officeNameDrops = 0, verdictDrops = 0;

    const filteredPool = candidatePool.filter(c => {
      if (isDisposalMode) {
        if (DISPOSAL_ADDRESS_FLAGS.test(c.address || '')) { addressDrops++; return false; }
        if (DISPOSAL_NAME_BAD.test(c.companyName || '')) { officeNameDrops++; return false; }
      }
      if (isIrrelevant(c, negativeKeywords)) { irrelevantDrops++; return false; }
      if (c.id && blacklistedIds.includes(c.id)) { blacklistDrops++; return false; }
      if (c.id && verdictIds.bad.has(c.id)) { verdictDrops++; return false; }
      const d = c.distanceMiles ?? (
        c.latitude != null && c.longitude != null && zipCoords
          ? Math.round(haversineDistance(zipCoords.lat, zipCoords.lng, c.latitude, c.longitude) * 10) / 10
          : undefined
      );
      if (d != null && d > radiusFilter) { radiusDrops++; return false; }
      return true;
    });

    console.log('[FILTER_REASONS]', { irrelevantDrops, blacklistDrops, radiusDrops, verdictDrops, addressDrops, officeNameDrops });
    console.log('[FILTERED_POOL]', { candidatePool: candidatePool.length, filteredPool: filteredPool.length });

    // ── Signal / scoring config ───────────────────────────────────────────────
    const disposalSignals = buildDisposalSignals(config);
    const signalsToCheck = isDisposalMode ? disposalSignals : config.signals;
    const scoreConfig = isDisposalMode ? { ...config, signals: disposalSignals } : config;

    // ── Phase 1: Pre-filter + permit fast path ────────────────────────────────
    const finalizedCompanies: Company[] = [];
    const allContacts: Contact[] = [];
    const scoreBuckets = { A: 0, B: 0, C: 0, D: 0 };
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

      // Regulatory permit fast path — pre-verified, skip enrichment queue
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
          if (sr.score < 70) { sr.score = 70; sr.grade = 'B'; sr.confidence = Math.max(sr.confidence, 80); }
        } else {
          if (sr.score < 65 || sr.grade === 'D') continue;
        }
        finalizedCompanies.push({
          ...record, organizationId, verticalId: config.id,
          enrichmentScore: sr.score, priority: sr.grade, distanceMiles: distance,
          matchedSignals: sr.matchedSignals, negativeHits: sr.negativeHits,
          relevanceReason: sr.relevanceReason, confidence: sr.confidence, fitType: sr.fitType,
          status: 'NOT_CONTACTED', createdAt: now, updatedAt: now,
        } as Company);
        continue;
      }

      // Pre-filter: pass through curated results directly
      if (record.notes?.startsWith('Curated')) {
        toEnrich.push({ record, base });
        continue;
      }

      // Signal pre-check (disposal uses multi-gate prefilter)
      const precheckText = `${record.companyName || ''} ${record.notes || ''} ${record.address || ''}`;
      const precheck = this.signalExtractor.extract(precheckText, signalsToCheck, config.equipmentKeywords, record);

      if (isDisposalMode) {
        const gate = disposalPrefilter(record, precheck.hasSignals);
        if (!gate.pass) {
          console.log(`[DISPOSAL_PREFILTER] ${record.companyName} — dropped (${gate.reason})`);
          continue;
        }
      } else {
        if (!precheck.hasSignals) {
          console.log(`[PREFILTER] ${record.companyName} — skipped (no labor signals)`);
          continue;
        }
        if (precheck.confidence === 'low') {
          const hasPrimaryMatch = precheck.matchedSignals.some(s =>
            signalsToCheck.primary.some(p => p.term === s)
          );
          if (!hasPrimaryMatch) {
            console.log(`[PREFILTER] ${record.companyName} — skipped (low confidence, no primary)`);
            continue;
          }
        }
      }
      toEnrich.push({ record, base });
    }

    // ── Batch Apollo cache check (single round-trip) ──────────────────────────
    const apolloCache = await this.apolloAdapter.batchCheckCache(
      toEnrich.map(e => e.base)
    );

    // ── BATCH: feedback counts — ONE DB call for all company IDs ─────────────
    const companyIds = toEnrich
      .map(e => e.base.id)
      .filter((id): id is string => !!id);
    const feedbackCountsMap = await batchGetFeedbackCounts(companyIds, scoreConfig.id);

    // ── Phase 2: Concurrent enrichment ───────────────────────────────────────
    const toRich = toEnrich.slice(0, this.ENRICH_LIMIT);
    const toBasic = toEnrich.slice(this.ENRICH_LIMIT);

    const enrichTasks = toRich.map(({ record, base }) => async () => {
      return withTimeout(
        (async () => {
          // Apollo enrichment
          const apolloResult = await this.apolloAdapter.enrich(base, apolloCache);

          const mergedBase: Partial<Company> = {
            ...apolloResult.companyFields,
            ...base,
            source: base.source ? `${base.source}+apollo` : apolloResult.companyFields.source || 'apollo',
            apolloDescription: apolloResult.companyFields.apolloDescription || base.apolloDescription,
          };

          // Web scraping — 4 scrapers in parallel (unchanged, already fast)
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
                mergedBase.apolloDescription = [mergedBase.apolloDescription, jsonLdResult.rawDescription].filter(Boolean).join(' | ');
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
          const signalResult = this.signalExtractor.extract(signalText, config.signals, config.equipmentKeywords, mergedBase);
          const mergedCompany: Partial<Company> = { ...mergedBase, capabilitySummary: signalResult.capabilitySummary };
          const companyContacts: Partial<Contact>[] = apolloResult.contacts.map(c => ({ ...c, companyId: mergedCompany.id! }));

          // FIX: feedback counts from the pre-fetched map — no DB call here
          const feedbackCounts = feedbackCountsMap.get(mergedCompany.id || '') ?? { positiveCount: 0, negativeCount: 0 };
          mergedCompany.feedbackPositiveCount = feedbackCounts.positiveCount;
          mergedCompany.feedbackNegativeCount = feedbackCounts.negativeCount;

          const scored = await this.scoreEngine.getCachedOrScore(tenant, mergedCompany, scoreConfig);
          if (!scored) return null;
          const { result: scoreResult, feedbackAction } = scored;
          return { mergedCompany, companyContacts, scoreResult, feedbackAction };
        })(),
        this.PER_COMPANY_TIMEOUT,
        () => {
          console.log(`[ENRICH_TIMEOUT] ${record.companyName} — skipped after ${this.PER_COMPANY_TIMEOUT}ms`);
          return null;
        }
      );
    });

    // Run enrichment with concurrency limit
    const enrichResults = await withConcurrency(enrichTasks, this.CONCURRENCY);

    // Collect enrichment results
    for (const enriched of enrichResults) {
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
        console.log(`[BLACKLIST] ${mergedCompany.companyName} — score=${scoreResult.score}`);
        continue;
      }

      mergedCompany.enrichmentScore = scoreResult.score;
      mergedCompany.priority = scoreResult.grade;
      mergedCompany.matchedSignals = scoreResult.matchedSignals;
      mergedCompany.negativeHits = scoreResult.negativeHits;
      mergedCompany.relevanceReason = scoreResult.relevanceReason;
      mergedCompany.confidence = scoreResult.confidence;
      mergedCompany.fitType = scoreResult.fitType;

      if (isDisposalMode) {
        if (scoreResult.score < 40) continue;
      } else {
        if (scoreResult.score < 65 || scoreResult.grade === 'D') continue;
      }

      const contactId = `contact-${mergedCompany.id}`;
      finalizedCompanies.push(mergedCompany as Company);
      allContacts.push(...companyContacts.map((c, i) => ({ ...c, id: `${contactId}-${i}` })) as Contact[]);
    }

    // ── Basic scoring for companies beyond enrichment cap ─────────────────────
    const basicTasks = toBasic.map(({ record }) => async () => {
      const signalText = buildAnalysisText(record);
      const signalResult = this.signalExtractor.extract(
        signalText, isDisposalMode ? signalsToCheck : config.signals, config.equipmentKeywords, record
      );
      const mergedCompany = { ...record, capabilitySummary: signalResult.capabilitySummary };
      const scored = await this.scoreEngine.getCachedOrScore(tenant, mergedCompany, scoreConfig);
      if (!scored) return null;
      const { result: scoreResult, feedbackAction } = scored;
      if (feedbackAction === 'blacklist') return null;
      if (isDisposalMode) {
        if (scoreResult.score < 40) return null;
      } else {
        if (scoreResult.score < 65 || scoreResult.grade === 'D') return null;
      }
      return {
        ...mergedCompany,
        enrichmentScore: scoreResult.score, priority: scoreResult.grade,
        matchedSignals: scoreResult.matchedSignals, negativeHits: scoreResult.negativeHits,
        relevanceReason: scoreResult.relevanceReason, confidence: scoreResult.confidence,
        fitType: scoreResult.fitType, organizationId: organizationId || '',
        verticalId: config.id, status: 'NOT_CONTACTED', createdAt: now, updatedAt: now,
      } as Company;
    });

    // Basic scoring can also run concurrently — no Apollo, no scrapers, very cheap
    const basicResults = await withConcurrency(basicTasks, 10);
    for (const result of basicResults) {
      if (result) { finalizedCompanies.push(result); scoreBuckets[result.priority]++; }
    }

    // ── Stage 6: Enterprise overlay ───────────────────────────────────────────
    const enterpriseCompanies = getEnterpriseOverlay(config.id, filters.zip, radiusFilter);

    if (enterpriseCompanies.length > 0 && zipCoords) {
      // Collect unique ZIPs, geocode all in parallel
      const uniqueZips = [...new Set(enterpriseCompanies.map(ec => ec.zip).filter(Boolean))] as string[];
      const zipCoordResults = await Promise.all(uniqueZips.map(zip => geocodeZip(zip)));
      const zipCache = new Map<string, { lat: number; lng: number } | null>();
      uniqueZips.forEach((zip, i) => zipCache.set(zip, zipCoordResults[i]));

      for (const ec of enterpriseCompanies) {
        if (!ec.zip) continue;
        const branchCoords = zipCache.get(ec.zip);
        if (branchCoords) {
          ec.distanceMiles = Math.round(haversineDistance(
            zipCoords.lat, zipCoords.lng, branchCoords.lat, branchCoords.lng
          ) * 10) / 10;
        }
      }
    }

    const filteredEnterprise = enterpriseCompanies.filter(ec =>
      ec.distanceMiles == null || ec.distanceMiles <= radiusFilter
    );

    for (const ec of filteredEnterprise) {
      const alreadyIncluded = finalizedCompanies.some(fc =>
        fc.companyName?.toLowerCase().includes(ec.companyName?.toLowerCase().split(' - ')[0]?.toLowerCase() || '')
      );
      if (alreadyIncluded) continue;

      // FIX: use pre-loaded verdictIds.badNames set — no fs.readFileSync in loop
      const ecBase = (ec.companyName || '').toLowerCase().split(' - ')[0]?.toLowerCase() || '';
      const verdictSkipped = ecBase
        ? [...verdictIds.badNames].some(bad => ecBase.includes(bad) || bad.includes(ecBase))
        : false;
      if (verdictSkipped) {
        console.log(`[VERDICT] Enterprise skip ${ec.companyName} — matches bad verdict`);
        continue;
      }

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
      console.log(`[ENTERPRISE] ${ec.companyName} — injected at 100/A`);
    }

    console.log('[SCORE_DISTRIBUTION]', scoreBuckets);
    console.log('[FINAL_RESULTS]', { companies: finalizedCompanies.length, contacts: allContacts.length, providerFailures });

    const gradeOrder: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    finalizedCompanies.sort((a, b) => {
      const g = (gradeOrder[a.priority || 'D'] ?? 3) - (gradeOrder[b.priority || 'D'] ?? 3);
      return g !== 0 ? g : (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity);
    });

    return { companies: finalizedCompanies, contacts: allContacts, providerFailures };
  }
}

export class IndexIntelligenceOrchestrator extends IndexIntelligenceEngine {}
