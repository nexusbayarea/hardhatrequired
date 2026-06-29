import { SearchProvider } from '../types';
import { Listing, SearchRequest } from '../../schemas/listing';

export class GooglePlacesConnector implements SearchProvider {
    name = 'google_places';

    async search(filters: SearchRequest): Promise<Partial<Listing>[]> {
        // Simulated network call to Google Places API Text Search / Nearby Search
        await new Promise((resolve) => setTimeout(resolve, 100));

        const mockGoogleResults = [
            {
                name: 'Bay Area Concrete Crushing & Recycling',
                address: '24900 Mission Blvd',
                city: 'Hayward',
                state: 'CA',
                zip: '94544',
                latitude: 37.6688,
                longitude: -122.0808,
                phone: '(510) 555-0192',
                website: 'https://www.bayareaconcreterecycling.com'
            },
            {
                name: 'Pacific Aggregates & Eco-Waste',
                address: '3000 Winton Ave',
                city: 'Hayward',
                state: 'CA',
                zip: '94545',
                latitude: 37.6622,
                longitude: -122.1241,
                phone: '(510) 555-0143',
                website: 'https://www.pacificaggregates.com'
            }
        ];

        return mockGoogleResults.map((item, idx) => ({
            ...item,
            id: `goog-${Math.random().toString(36).substring(2, 9)}`,
            industry: filters.industry,
            distanceMiles: idx === 0 ? 3.4 : 12.1,
            source: this.name,
            status: 'not_contacted' as const
        }));
    }
}
