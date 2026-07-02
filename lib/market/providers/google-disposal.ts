// ─── Google Places — Disposal Mode Search ────────────────────────────────────
//
// WHY THE ORIGINAL WASN'T WORKING:
//
//   googlePlaceMapping.ts defines `disposalSearchModifier` for every vertical.
//   But adapter.ts passes `config.disposalQueries ?? config.searchQueries` as
//   the search queries — which are contractor-focused queries like
//   "concrete slurry recycling contractor near me".
//
//   Google Places returns CONTRACTORS when you search for contractors.
//   It returns FACILITIES when you search for facilities.
//
//   The fix: in disposal mode, use the `disposalSearchModifier` from
//   googlePlaceMapping.ts as the actual search query sent to Google Places.
//   This is a one-line change in the provider but the impact is large.
//
//   ALSO: Google Places types[] gives us pre-classification of results.
//   A result with type "waste_management_service" IS a disposal facility even
//   if its name is "Recology". We set googleCategorySignals from these types
//   so scoring can use them.
// ──────────────────────────────────────────────────────────────────────────────

import { Company } from '@/types/company';
import { VerticalConfig } from '@/types/config';
import { haversineDistance } from '@/lib/geo';
import { GOOGLE_VERTICAL_MAPPING } from '../googlePlaceMapping';
import { getCategorySignalsForDisposal, DISPOSAL_GOOGLE_TYPE_SIGNALS } from '../disposal-signals';

// Google Place types that we know indicate a disposal/waste facility.
// Results with ANY of these types get boosted googleCategorySignals regardless
// of name.
const DISPOSAL_INDICATOR_TYPES = new Set(Object.keys(DISPOSAL_GOOGLE_TYPE_SIGNALS));

export class GooglePlacesDisposalProvider {
  name = 'google_places_disposal';

  async searchDisposal(params: {
    zip: string;
    lat?: number;
    lng?: number;
    radiusMiles?: number;
    verticalId: string;
    verticalConfig: VerticalConfig;
  }): Promise<Partial<Company>[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return [];

    const mapping = GOOGLE_VERTICAL_MAPPING[params.verticalId];
    if (!mapping?.disposalSearchModifier) {
      console.warn(`[GooglePlacesDisposal] No disposalSearchModifier for vertical: ${params.verticalId}`);
      return [];
    }

    // Build queries: the disposalSearchModifier plus up to 2 of config.disposalQueries
    const disposalQueries = [
      mapping.disposalSearchModifier,
      ...(params.verticalConfig.disposalQueries ?? []).slice(0, 2),
    ];

    const allResults: Partial<Company>[] = [];
    const seen = new Set<string>();

    for (const query of disposalQueries) {
      const textQuery = `${query} near ${params.zip}`;
      try {
        const results = await this.searchPlaces(textQuery, apiKey, params.lat, params.lng);
        for (const r of results) {
          const key = `${(r.companyName || '').toLowerCase()}|${(r.address || '').toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            allResults.push(r);
          }
        }
      } catch (err) {
        console.error(`[GooglePlacesDisposal] Query "${textQuery}" failed:`, err);
      }
    }

    return allResults;
  }

  private async searchPlaces(
    textQuery: string,
    apiKey: string,
    zipLat?: number,
    zipLng?: number
  ): Promise<Partial<Company>[]> {
    const url = 'https://places.googleapis.com/v1/places:searchText';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.internationalPhoneNumber',
          'places.websiteUri',
          'places.primaryType',
          'places.types',
          'places.primaryTypeDisplayName',
          'places.rating',
          'places.userRatingCount',
        ].join(','),
      },
      body: JSON.stringify({ textQuery }),
    });

    if (!response.ok) {
      throw new Error(`Google Places API ${response.status}`);
    }

    const data = await response.json();
    const places: GooglePlace[] = data.places ?? [];
    const now = new Date().toISOString();

    return places.map(p => {
      const lat = p.location?.latitude;
      const lng = p.location?.longitude;

      const distanceMiles =
        zipLat != null && zipLng != null && lat != null && lng != null
          ? Math.round(haversineDistance(zipLat, zipLng, lat, lng) * 10) / 10
          : undefined;

      // Collect all types, de-noise
      const allTypes = [
        p.primaryType,
        ...(p.types ?? []),
      ].filter((t): t is string => !!t && t !== 'establishment' && t !== 'point_of_interest');

      // Map Google types to disposal signal terms
      const categorySignals = getCategorySignalsForDisposal(allTypes);

      // Human-readable type context stored in notes
      const typeContext = [...new Set(allTypes.map(t => t.replace(/_/g, ' ')))].join(', ');

      // Flag if any Google type directly indicates this is a disposal facility
      const isDisposalFacility = allTypes.some(t => DISPOSAL_INDICATOR_TYPES.has(t));

      return {
        id: p.id,
        companyName: p.displayName?.text || 'Unknown Facility',
        address: p.formattedAddress,
        phone: p.internationalPhoneNumber,
        website: p.websiteUri,
        // notes contains the raw Google type context — signal matching reads this
        notes: typeContext || undefined,
        // googleCategorySignals is the pre-mapped signal terms for scoring
        googleCategorySignals: categorySignals.length > 0 ? categorySignals : undefined,
        // Surface the raw types so the prefilter can check them
        googleTypes: allTypes,
        latitude: lat,
        longitude: lng,
        distanceMiles,
        googleRating: p.rating,
        googleReviewCount: p.userRatingCount,
        // Mark disposal facility flag for the prefilter to use
        isDisposalFacilityByCategory: isDisposalFacility,
        source: this.name,
        status: 'NOT_CONTACTED' as const,
        createdAt: now,
        updatedAt: now,
      };
    });
  }
}

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  internationalPhoneNumber?: string;
  websiteUri?: string;
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  types?: string[];
  rating?: number;
  userRatingCount?: number;
}

export const googlePlacesDisposalProvider = new GooglePlacesDisposalProvider();
