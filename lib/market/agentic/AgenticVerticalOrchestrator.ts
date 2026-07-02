import { GeminiScraperAdapter } from '../providers/geminiScraper';
import { GooglePlacesAdapter } from '../providers/google';
import { SupabaseVectorStore } from '@/lib/db/vector';

export interface ParsedUserIntent {
  vertical: 'edge_compute' | 'gas_station' | 'events_nightlife' | 'niche_retreat';
  primary_target: string;
  location: { lat: number; lng: number; radius: number } | string;
  requirements: string[];
  needs_accommodation?: boolean;
}

export class AgenticVerticalOrchestrator {
  private placesAdapter = new GooglePlacesAdapter();
  private aiBrowser = new GeminiScraperAdapter();
  private vectorDB = new SupabaseVectorStore();

  async buildIntelligentIndex(userPrompt: string): Promise<any> {
    const intent = await this.parseIntentWithLLM(userPrompt);

    switch (intent.vertical) {
      case 'events_nightlife':
        return this.executeExpediaWorkflow(intent);
      case 'edge_compute':
        return this.executeComputeScrapingWorkflow(intent);
      case 'gas_station':
        return this.executeSmartGasWorkflow(intent);
      default:
        return this.executeNicheDirectoryWorkflow(intent);
    }
  }

  private async executeExpediaWorkflow(intent: ParsedUserIntent) {
    const [eventsList, accommodations] = await Promise.all([
      this.vectorDB.searchHistoricalEvents(intent.primary_target, intent.location),
      intent.needs_accommodation
        ? this.placesAdapter.searchWithNegatives(`Hotels near ${intent.location}`, ['motel', 'roach'])
        : Promise.resolve([]),
    ]);

    return this.aiBrowser.synthesizeItinerary(eventsList, accommodations, intent.requirements);
  }

  private async executeComputeScrapingWorkflow(intent: ParsedUserIntent) {
    const targetFacilities = await this.vectorDB.query(
      `SELECT url FROM compute_facilities WHERE region = $1`,
      [intent.location]
    );

    const computeIndex: any[] = [];
    for (const facility of targetFacilities) {
      const extractionPrompt = `Scan this HPC/Compute facility website.
1. Look for hardware specs matching: ${intent.requirements.join(', ')}.
2. Find the hourly pricing.
3. Determine real-time availability if listed.
Return ONLY a JSON object with { hardware, price_per_hour, available }.`;

      const liveData = await this.aiBrowser.autonomousScrape(facility.url, extractionPrompt);
      if (liveData?.hardware) {
        computeIndex.push({
          facilityName: facility.name,
          ...liveData,
          bookingUrl: facility.url,
        });
      }
    }
    return computeIndex;
  }

  private async executeSmartGasWorkflow(intent: ParsedUserIntent) {
    const stations = await this.placesAdapter.search({
      zip: typeof intent.location === 'string' ? intent.location : '',
      vertical: 'industrial_wastewater',
      searchQueries: [`gas station ${typeof intent.location === 'string' ? intent.location : ''}`],
    });

    const enrichedStations = await Promise.all(
      stations.map(async (station) => {
        const prompt = `Find current gas price for regular. Also, look for a food menu or deli section. List the top 3 grab-and-go items available.`;
        const liveMenuData = await this.aiBrowser.autonomousScrape(station.website || '', prompt);
        return {
          brand: station.companyName,
          address: station.address,
          livePrice: liveMenuData?.price || 'Unknown',
          grabAndGoMenu: liveMenuData?.menuItems || [],
        };
      })
    );

    return enrichedStations;
  }

  private async executeNicheDirectoryWorkflow(intent: ParsedUserIntent): Promise<any> {
    return [];
  }

  private async parseIntentWithLLM(prompt: string): Promise<ParsedUserIntent> {
    return {
      vertical: 'events_nightlife',
      primary_target: prompt,
      location: 'Austin, TX',
      requirements: [],
      needs_accommodation: true,
    };
  }
}
