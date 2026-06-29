import { Listing, SearchRequest } from '../schemas/listing';

export interface SearchProvider {
    name: string;
    search(filters: SearchRequest): Promise<Partial<Listing>[]>;
}

export interface EnrichmentProvider {
    name: string;
    enrich(listing: Listing): Promise<Partial<Listing>>;
}
