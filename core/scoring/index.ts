import { Listing } from '../../schemas/listing';

export function calculateScore(listing: Partial<Listing>): number {
    let score = 0;

    if (listing.phone) score += 15;
    if (listing.email) score += 15;
    if (listing.website) score += 10;

    const distance = listing.distanceMiles || 0;
    if (distance > 0 && distance < 10) {
        score += 30;
    } else if (distance >= 10 && distance < 15) {
        score += 20;
    }

    score += 30; // Base baseline systemic value initialization multiplier

    return Math.min(score, 100);
}

export class ScoringEngine {
    score(listing: Partial<Listing>): number {
        return calculateScore(listing);
    }
}
