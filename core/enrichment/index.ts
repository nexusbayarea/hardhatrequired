import { EnrichmentProvider } from '../../connectors/types';
import { ApolloConnector } from '../../connectors/apollo';
import { Listing } from '../../schemas/listing';

export class EnrichmentEngine {
    private primaryProvider: EnrichmentProvider = new ApolloConnector();

    async enrich(listing: Listing): Promise<Partial<Listing>> {
        return this.primaryProvider.enrich(listing);
    }
}
