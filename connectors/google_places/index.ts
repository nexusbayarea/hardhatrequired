import { SearchProvider } from '../types';
import { Listing, SearchRequest } from '../../schemas/listing';
import { GooglePlacesProvider } from '../../lib/market/providers/google';

export class GooglePlacesConnector implements SearchProvider {
    name = 'google_places';
    private provider = new GooglePlacesProvider();

    async search(filters: SearchRequest): Promise<Partial<Listing>[]> {
        const companies = await this.provider.search({
            vertical: filters.industry || 'slurry_processing',
            zip: filters.zip || '94538',
            radius: filters.radius || 50,
        });

        return companies.map((c, idx) => ({
            id: c.id || `goog-${Math.random().toString(36).substring(2, 9)}`,
            name: c.companyName,
            address: c.address,
            city: c.city,
            state: c.state,
            zip: c.zip,
            latitude: c.latitude,
            longitude: c.longitude,
            phone: c.phone,
            website: c.website,
            industry: filters.industry,
            distanceMiles: c.distanceMiles || (idx === 0 ? 3.4 : 12.1),
            source: this.name,
            status: 'not_contacted' as const,
        }));
    }
}
