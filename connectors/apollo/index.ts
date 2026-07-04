import { EnrichmentProvider } from '../types';
import { Listing } from '../../schemas/listing';
import { ApolloAdapter } from '../../lib/market/providers/apollo';

export class ApolloConnector implements EnrichmentProvider {
    name = 'apollo';
    private adapter = new ApolloAdapter();

    async enrich(listing: Listing): Promise<Partial<Listing>> {
        const result = await this.adapter.enrich({
            companyName: listing.name,
            website: listing.website,
            source: listing.source || 'unknown',
        });

        return {
            email: result.companyFields.email,
            contactName: result.contacts?.[0]
                ? `${result.contacts[0].firstName || ''} ${result.contacts[0].lastName || ''}`.trim()
                : undefined,
            contactTitle: result.contacts?.[0]?.title,
            contactLinkedin: result.contacts?.[0]?.linkedinUrl,
            source: `${listing.source || 'unknown'}+${this.name}`,
        };
    }
}
