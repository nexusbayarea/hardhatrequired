import { EnrichmentProvider } from '../types';
import { Listing } from '../../schemas/listing';

export class ApolloConnector implements EnrichmentProvider {
    name = 'apollo';

    async enrich(listing: Listing): Promise<Partial<Listing>> {
        // Simulated network lookup against Apollo organization/people search endpoints
        await new Promise((resolve) => setTimeout(resolve, 150));

        return {
            email: `operations@${listing.website?.replace('https://www.', '') || 'cleanwaste.com'}`,
            contactName: 'Marcus Vance',
            contactTitle: 'Director of Operations',
            contactLinkedin: 'https://www.linkedin.com/in/mock-marcus-vance-mie',
            source: `${listing.source || 'unknown'}+${this.name}`
        };
    }
}
