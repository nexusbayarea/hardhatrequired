import { DiscoveryEngine } from './discovery';
import { EnrichmentEngine } from './enrichment';
import { ScoringEngine } from './scoring';
import { RankingEngine } from './ranking';
import { ReportingEngine } from './reporting';
import { SearchRequest, Listing } from '../schemas/listing';

export interface IndexConfiguration {
    name: string;
    industry: string;
    scoringWeights?: any; // Future: dynamic scoring
}

export class MarketIntelligenceEngine {
    private discovery = new DiscoveryEngine();
    private enrichment = new EnrichmentEngine();
    private scoring = new ScoringEngine();
    private ranking = new RankingEngine();
    private reporting = new ReportingEngine();

    async processMarket(config: IndexConfiguration, request: SearchRequest) {
        // 1. Discovery
        const rawListings = await this.discovery.find(request);

        // 2. Enrichment & Initial Scoring
        const processedListings: Listing[] = [];
        for (const raw of rawListings) {
            // Map basic priority logic
            const distance = raw.distanceMiles || 0;
            let priority: 'A' | 'B' | 'C' = 'C';
            if (distance < 10) priority = 'A';
            else if (distance >= 10 && distance < 15) priority = 'B';

            const baseListing = {
                ...raw,
                priority,
                status: raw.status || 'not_contacted'
            } as Listing;

            // Enrich
            const enrichmentData = await this.enrichment.enrich(baseListing);
            const combined = { ...baseListing, ...enrichmentData };

            // Score
            combined.score = this.scoring.score(combined);
            combined.enrichmentScore = combined.score; // Legacy compatibility

            processedListings.push(combined);
        }

        // 3. Ranking
        const rankedListings = this.ranking.rank(processedListings);

        // 4. Reporting
        const report = this.reporting.generate(config.name, rankedListings);

        return {
            listings: rankedListings,
            report
        };
    }
}
