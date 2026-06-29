import { DiscoveryProvider, DiscoveryParams, getStateFromZip } from './base';
import { Company } from '@/types/company';
import { StateScraper } from './scrapers/types';
import { CalRecycleScraper } from './scrapers/calrecycle';
import { TCEQScraper } from './scrapers/tceq';
import { getCachedScraperResult, setCachedScraperResult } from '@/lib/scraper/cache';

export class RegulatoryProvider implements DiscoveryProvider {
  name = 'regulatory_permit';
  private scrapers: Map<string, StateScraper> = new Map();

  constructor() {
    const ca = new CalRecycleScraper();
    const tx = new TCEQScraper();
    
    this.scrapers.set(ca.stateCode, ca);
    this.scrapers.set(tx.stateCode, tx);
  }

  async search(params: DiscoveryParams): Promise<Partial<Company>[]> {
    const state = getStateFromZip(params.zip);
    const vertical = params.vertical || 'slurry_concrete';

    const cached = await getCachedScraperResult(state, vertical);
    if (cached) {
      console.log(`[RegulatoryProvider] Cache hit for ${state}:${vertical}`);
      return cached;
    }

    const scraper = this.scrapers.get(state);
    
    if (!scraper) {
      console.warn(`[RegulatoryProvider] No live scraper configured for state: ${state}`);
      return [];
    }

    try {
      const result = await scraper.scrape(params);
      await setCachedScraperResult(state, vertical, result.records);
      return result.records;
    } catch (error) {
      console.error(`[RegulatoryProvider] Scraper failed for ${state}:`, error);
      return [];
    }
  }
}
