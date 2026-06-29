import { Listing } from '../../schemas/listing';

export class RankingEngine {
    rank(listings: Listing[]): Listing[] {
        return [...listings].sort((a, b) => (b.score || 0) - (a.score || 0));
    }
}
