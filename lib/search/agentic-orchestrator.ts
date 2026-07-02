import { Company, Contact, SearchFilters, FitType } from '@/types/company';
import { VerticalConfig } from '@/types/config';
import { IndexIntelligenceOrchestrator } from '@/lib/market/adapter';
import { assessVerticalNiche, evaluateStageDecision, assessResults, classifyFitType, MIN_RESULTS, MIN_CONFIDENCE } from './intent-router';
import { deepScrapeCompany } from './playwright-scraper';
import { searchRegulatoryFacilities } from '@/lib/regulatory/provider';
import { geocodeZip, haversineDistance } from '@/lib/geo';
import { getCachedSearch, setCachedSearch } from '@/lib/intelligence/search-cache';
import { getDeepProfile, upsertDeepProfile, updateDeepProfile, buildCanonicalKey, isProfileStale, freshProfileTimestamp } from '@/lib/intelligence/store';
import { searchL2 } from '@/lib/intelligence/l2-search';
import { processScrape } from './extraction/pipeline';
import { generateMapLinks } from './map-utils';
import { GeoCandidate, L2SearchResult } from '@/lib/intelligence/types';

export interface AgenticSearchResult {
  mode: 'standard' | 'agentic';
  sourcesUsed: string[];
  stagesExecuted: number;
  decision: string;
  companies: Company[];
  contacts: Contact[];
  providerFailures: string[];
  isStale?: boolean;
  lastScrapedAt?: string;
  cacheSource?: 'L1_redis' | 'L2_intel_db' | 'L2_stale_or_weak' | 'L3_scrape';
}

export class AgenticOrchestrator extends IndexIntelligenceOrchestrator {
  async executeMarketDiscovery(
    filters: SearchFilters,
    config: VerticalConfig,
    organizationId?: string
  ): Promise<AgenticSearchResult> {
    const zipCoords = await geocodeZip(filters.zip);
    const radius = filters.radius || 50;
    const mode = filters.mode || 'labor';
    const vertical = config.id;

    // ── L1: Redis hot cache ───────────────────────────────────────────
    const cached = await getCachedSearch(vertical, filters.zip, radius, mode);
    if (cached) {
      return {
        mode: 'standard',
        sourcesUsed: cached.sourcesUsed || ['L1_cache'],
        stagesExecuted: cached.stagesExecuted || 1,
        decision: 'L1 Redis cache hit',
        companies: cached.results as Company[],
        contacts: [],
        providerFailures: [],
        cacheSource: 'L1_redis',
      };
    }

    // ── L2: PostGIS geo + intelligence ────────────────────────────────
    if (zipCoords) {
      const l2Result = await searchL2(vertical, zipCoords.lng, zipCoords.lat, filters.zip);

      if (l2Result.hit) {
        const companies = this.candidatesToCompanies(l2Result.candidates, config);
        // Warm L1 with L2 results
        await setCachedSearch(vertical, filters.zip, radius, mode, {
          results: companies,
          resultCount: companies.length,
          avgConfidence: l2Result.avgConfidence,
          cachedAt: new Date().toISOString(),
          sourcesUsed: ['L2_intel_db'],
          stagesExecuted: 1,
        }).catch(() => {});

        return {
          mode: 'standard',
          sourcesUsed: ['L2_intel_db'],
          stagesExecuted: 1,
          decision: l2Result.reason,
          companies,
          contacts: [],
          providerFailures: [],
          cacheSource: 'L2_intel_db',
        };
      }

      // L2 weak — background enrichment dispatched, fall through to Stage 1
    }

    // ── L3: Full discovery pipeline ────────────────────────────────────
    return this.runFullPipeline(filters, config, organizationId, zipCoords);
  }

  // ── Convert L2 PostGIS candidates to companies ───────────────────────
  private candidatesToCompanies(
    candidates: GeoCandidate[],
    config: VerticalConfig,
  ): Company[] {
    return candidates.map(c => {
      const coords = c.latitude != null && c.longitude != null
        ? { lat: c.latitude, lng: c.longitude }
        : undefined;

      return {
        companyName: c.companyName,
        address: c.address,
        city: c.city,
        state: c.state,
        zip: c.zip,
        latitude: c.latitude,
        longitude: c.longitude,
        distanceMiles: c.distanceMiles,
        source: 'L2_intel_db',
        enrichmentScore: c.confidenceScore,
        confidence: c.confidenceScore,
        intelligenceScore: c.intelligenceScore,
        evaluatedRing: c.evaluatedRing,
        fitType: c.fitType || classifyFitType({ companyName: c.companyName } as Company, ''),
        priority: c.intelligenceScore >= 70 ? 'A' : c.intelligenceScore >= 50 ? 'B' : 'C',
        naicsCodes: config.targetNaicsCodes,
        status: 'NOT_CONTACTED' as const,
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || new Date().toISOString(),
        coordinates: coords,
        navigation: coords ? generateMapLinks(coords.lat, coords.lng, c.companyName) : undefined,
      };
    }) as Company[];
  }

  // ── Full pipeline (Stage 1 → 2 → 3) ──────────────────────────────────
  private async runFullPipeline(
    filters: SearchFilters,
    config: VerticalConfig,
    organizationId?: string,
    zipCoords?: { lat: number; lng: number } | null
  ): Promise<AgenticSearchResult> {
    const sourcesUsed: string[] = [];
    const radius = filters.radius || 50;
    const mode = filters.mode || 'labor';

    // Stage 1: Fast Discovery
    const stage1Result = await super.executeMarketDiscovery(filters, config, organizationId);
    sourcesUsed.push('google', 'tomtom', 'overpass');

    const { avgConfidence } = assessResults(stage1Result.companies);
    const decision = evaluateStageDecision(config.id, stage1Result.companies.length, avgConfidence);

    if (!decision.runStage2 && !decision.runStage3) {
      await setCachedSearch(config.id, filters.zip, radius, mode, {
        results: stage1Result.companies,
        resultCount: stage1Result.companies.length,
        avgConfidence,
        cachedAt: new Date().toISOString(),
        sourcesUsed,
        stagesExecuted: 1,
      }).catch(() => {});

      return {
        mode: 'standard',
        sourcesUsed,
        stagesExecuted: 1,
        decision: decision.reason,
        companies: stage1Result.companies,
        contacts: stage1Result.contacts,
        providerFailures: stage1Result.providerFailures,
        cacheSource: 'L3_scrape',
      };
    }

    // Stage 2: Intelligence enrichment
    let stage2Companies: Partial<Company>[] = [];
    if (decision.runStage2) {
      sourcesUsed.push('apollo', 'regulatory');
      stage2Companies = await this.runStage2(filters, config, organizationId);
    }

    const allCompanies = this.mergeResults(stage1Result.companies, stage2Companies);

    // Stage 3: Playwright deep scrape
    if (decision.runStage3) {
      sourcesUsed.push('playwright', 'directories');
      const enriched = await this.runStage3(allCompanies, config);

      await this.persistProfiles(enriched.companies, config.id, zipCoords);

      await setCachedSearch(config.id, filters.zip, radius, mode, {
        results: enriched.companies,
        resultCount: enriched.companies.length,
        avgConfidence,
        cachedAt: new Date().toISOString(),
        sourcesUsed,
        stagesExecuted: 3,
      }).catch(() => {});

      return {
        mode: 'agentic',
        sourcesUsed,
        stagesExecuted: 3,
        decision: decision.reason,
        companies: enriched.companies,
        contacts: stage1Result.contacts,
        providerFailures: stage1Result.providerFailures,
        cacheSource: 'L3_scrape',
      };
    }

    // Stage 2 only
    await setCachedSearch(config.id, filters.zip, radius, mode, {
      results: allCompanies,
      resultCount: allCompanies.length,
      avgConfidence,
      cachedAt: new Date().toISOString(),
      sourcesUsed,
      stagesExecuted: 2,
    }).catch(() => {});

    return {
      mode: 'agentic',
      sourcesUsed,
      stagesExecuted: 2,
      decision: decision.reason,
      companies: allCompanies,
      contacts: stage1Result.contacts,
      providerFailures: stage1Result.providerFailures,
      cacheSource: 'L3_scrape',
    };
  }

  private async persistProfiles(
    companies: Company[],
    vertical: string,
    zipCoords?: { lat: number; lng: number } | null
  ): Promise<void> {
    for (const company of companies) {
      try {
        const canonicalKey = buildCanonicalKey(
          company.website,
          company.companyName,
          company.latitude,
          company.longitude,
          company.city,
          company.state
        );

        const existing = await getDeepProfile(canonicalKey);
        if (existing) {
          if (!existing.lastScrapedAt || isProfileStale(existing, vertical)) {
            await updateDeepProfile(canonicalKey, {
              scrapedContent: company.scrapedText,
              confidenceScore: company.extractionConfidence || company.enrichmentScore || company.confidence || 0,
              signalHits: company.matchedSignals || [],
              negativeHits: company.negativeHits || [],
              isCommercial: company.scrapedIsCommercial || false,
              isResidential: company.scrapedIsResidential || false,
              isMismatch: company.scrapedIsMismatch || false,
              fitType: company.fitType as FitType,
              services: (company.extractedServices || []).map(s => ({ name: s.id, description: `confidence:${s.confidence}` })),
              equipment: (company.extractedEquipment || []).map(e => ({ name: e.id })),
              structuredSignals: {
                services: (company.extractedServices || []).map(s => s.id),
                equipment: (company.extractedEquipment || []).map(e => e.id),
              },
              ...freshProfileTimestamp(vertical),
            });
          }
        } else {
          await upsertDeepProfile({
            canonicalKey,
            companyName: company.companyName || '',
            domain: company.website ? new URL(company.website).hostname : undefined,
            vertical,
            address: company.address,
            city: company.city,
            state: company.state,
            zip: company.zip,
            latitude: company.latitude,
            longitude: company.longitude,
            fitType: company.fitType as FitType,
            scrapedContent: company.scrapedText,
            structuredSignals: {
              services: (company.extractedServices || []).map(s => s.id),
              equipment: (company.extractedEquipment || []).map(e => e.id),
            },
            services: (company.extractedServices || []).map(s => ({ name: s.id, description: `confidence:${s.confidence}` })),
            equipment: (company.extractedEquipment || []).map(e => ({ name: e.id })),
            permits: [],
            naicsCodes: company.naicsCodes,
            confidenceScore: company.extractionConfidence || company.enrichmentScore || 0,
            signalHits: company.matchedSignals || [],
            negativeHits: company.negativeHits || [],
            isCommercial: company.scrapedIsCommercial || false,
            isResidential: company.scrapedIsResidential || false,
            isMismatch: company.scrapedIsMismatch || false,
            ...freshProfileTimestamp(vertical),
          });
        }
      } catch {
        // Non-fatal
      }
    }
  }

  private async runStage2(
    filters: SearchFilters,
    config: VerticalConfig,
    organizationId?: string
  ): Promise<Partial<Company>[]> {
    const results: Partial<Company>[] = [];
    const zipCoords = await geocodeZip(filters.zip);

    try {
      const regulatory = await searchRegulatoryFacilities({
        vertical: config.id,
        lat: zipCoords?.lat,
        lng: zipCoords?.lng,
        radiusMiles: Math.max(filters.radius || 50, 60),
        zip: filters.zip,
      });

      for (const facility of regulatory) {
        const dist = facility.latitude != null && facility.longitude != null && zipCoords
          ? Math.round(haversineDistance(zipCoords.lat, zipCoords.lng, facility.latitude, facility.longitude) * 10) / 10
          : undefined;

        results.push({
          companyName: facility.facilityName,
          address: facility.streetAddress,
          city: facility.city,
          state: facility.state,
          zip: facility.zip,
          latitude: facility.latitude,
          longitude: facility.longitude,
          distanceMiles: dist,
          source: 'regulatory_permit',
          hasRegulatoryPermit: true,
          notes: `${facility.activities.join(', ')} | ${facility.wasteTypes.join(', ')}`,
          enrichmentScore: 80,
          priority: 'A',
          confidence: 85,
          fitType: 'REGULATORY_NODE',
          naicsCodes: config.targetNaicsCodes,
          status: 'NOT_CONTACTED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Company);
      }
    } catch {
      // Non-fatal
    }

    return results;
  }

  private async runStage3(
    companies: Company[],
    config: VerticalConfig
  ): Promise<{ companies: Company[]; newSources: string[] }> {
    const newSources: string[] = [];
    const enriched: Company[] = [];

    for (const company of companies) {
      if (!company.website) {
        enriched.push(company);
        continue;
      }

      const scrapeResult = await deepScrapeCompany(company, config);
      const llmTriggered = scrapeResult.scrapedText ? true : false;

      // Run extraction pipeline on scraped text
      const pipeline = await processScrape(scrapeResult.scrapedText, config.id);

      if (scrapeResult.scrapedText) {
        newSources.push('playwright');
      }
      if (pipeline.llmTriggered) {
        newSources.push('llm_extraction');
      }

      enriched.push({
        ...company,
        scrapedIsCommercial: scrapeResult.scrapedIsCommercial || company.scrapedIsCommercial,
        scrapedIsResidential: scrapeResult.scrapedIsResidential || company.scrapedIsResidential,
        scrapedIsMismatch: scrapeResult.scrapedIsMismatch || company.scrapedIsMismatch,
        scrapedKeywords: [...new Set([...(company.scrapedKeywords || []), ...scrapeResult.scrapedKeywords])],
        scrapedLicenseNumbers: [...new Set([...(company.scrapedLicenseNumbers || []), ...scrapeResult.scrapedLicenseNumbers])],
        scrapedText: pipeline.cleanText || company.scrapedText,
        extractedServices: pipeline.extraction.services,
        extractedEquipment: pipeline.extraction.equipment,
        extractionConfidence: pipeline.extraction.confidence,
        fitType: pipeline.extraction.fitType || company.fitType,
      });
    }

    return { companies: enriched, newSources: [...new Set(newSources)] };
  }

  private mergeResults(companies: Company[], additions: Partial<Company>[]): Company[] {
    const seen = new Set<string>();
    const merged: Company[] = [];

    for (const c of companies) {
      const key = `${c.companyName || ''}|${c.address || ''}`.toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(c);
      }
    }

    for (const a of additions) {
      const key = `${a.companyName || ''}|${a.address || ''}`.toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(a as Company);
      }
    }

    merged.forEach(c => {
      if (!c.fitType) {
        c.fitType = classifyFitType(c, '');
      }
    });

    merged.sort((a, b) => {
      const gradeOrder: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      const g = (gradeOrder[a.priority || 'D'] ?? 3) - (gradeOrder[b.priority || 'D'] ?? 3);
      if (g !== 0) return g;
      return (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity);
    });

    return merged;
  }
}
