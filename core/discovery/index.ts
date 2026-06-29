import { SearchProvider } from '../../connectors/types';
import { GooglePlacesConnector } from '../../connectors/google_places';
import { SearchRequest, Listing } from '../../schemas/listing';

export class DiscoveryEngine {
    private primaryProvider: SearchProvider = new GooglePlacesConnector();

    async find(request: SearchRequest): Promise<Partial<Listing>[]> {
        return this.primaryProvider.search(request);
    }
}
