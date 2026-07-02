import { Company } from '@/types/company';
import { DiscoveryProvider, DiscoveryParams } from './base';
import { haversineDistance } from '@/lib/geo';
import { VerticalConfig } from '@/types/config';
import { GOOGLE_VERTICAL_MAPPING } from '@/lib/market/googlePlaceMapping';

export interface CategorySignal {
  term: string;
  weight: number;
  strength: 'strong' | 'weak';
}

export const GOOGLE_TYPE_TO_VERTICAL_SIGNALS: Record<string, CategorySignal[]> = {
  waste_management_service: [
    { term: 'waste management', weight: 20, strength: 'strong' },
    { term: 'industrial waste', weight: 20, strength: 'strong' },
  ],
  recycling_center: [
    { term: 'recycling', weight: 15, strength: 'strong' },
    { term: 'material recovery', weight: 12, strength: 'strong' },
  ],
  hazardous_waste_disposal: [
    { term: 'hazardous waste', weight: 25, strength: 'strong' },
    { term: 'environmental remediation', weight: 20, strength: 'strong' },
  ],
  environmental_consultant: [
    { term: 'environmental', weight: 12, strength: 'strong' },
    { term: 'compliance', weight: 10, strength: 'weak' },
    { term: 'SWPPP', weight: 15, strength: 'strong' },
  ],
  sewage_disposal_service: [
    { term: 'wastewater', weight: 18, strength: 'strong' },
    { term: 'pumping', weight: 15, strength: 'strong' },
  ],
  septic_system_service: [
    { term: 'pumping', weight: 12, strength: 'strong' },
    { term: 'tank service', weight: 10, strength: 'weak' },
  ],
  concrete_contractor: [
    { term: 'concrete', weight: 15, strength: 'strong' },
    { term: 'concrete contractor', weight: 15, strength: 'strong' },
  ],
  construction_company: [
    { term: 'construction', weight: 4, strength: 'weak' },
    { term: 'contractor', weight: 3, strength: 'weak' },
  ],
  demolition_contractor: [
    { term: 'demolition', weight: 8, strength: 'weak' },
    { term: 'concrete removal', weight: 10, strength: 'weak' },
    { term: 'construction waste', weight: 6, strength: 'weak' },
  ],
  ready_mix_concrete_supplier: [
    { term: 'ready mix', weight: 18, strength: 'strong' },
    { term: 'concrete', weight: 15, strength: 'strong' },
  ],
  excavating_contractor: [
    { term: 'excavation', weight: 15, strength: 'strong' },
    { term: 'hydrovac', weight: 20, strength: 'strong' },
  ],
  fire_protection_service: [
    { term: 'fire sprinkler', weight: 20, strength: 'strong' },
    { term: 'fire protection', weight: 18, strength: 'strong' },
    { term: 'fire extinguisher', weight: 18, strength: 'strong' },
  ],
  hvac_contractor: [
    { term: 'HVAC', weight: 20, strength: 'strong' },
    { term: 'air balancing', weight: 20, strength: 'strong' },
  ],
  plumber: [
    { term: 'backflow', weight: 8, strength: 'weak' },
    { term: 'plumbing', weight: 5, strength: 'weak' },
  ],
  mechanical_contractor: [
    { term: 'mechanical', weight: 4, strength: 'weak' },
    { term: 'HVAC', weight: 12, strength: 'weak' },
  ],
  elevator_service: [
    { term: 'elevator inspection', weight: 20, strength: 'strong' },
    { term: 'elevator testing', weight: 20, strength: 'strong' },
  ],
  scrap_metal_dealer: [
    { term: 'scrap metal', weight: 20, strength: 'strong' },
    { term: 'metal recycling', weight: 18, strength: 'strong' },
  ],
  metal_processing: [
    { term: 'metal processing', weight: 15, strength: 'strong' },
    { term: 'scrap yard', weight: 15, strength: 'strong' },
  ],
  marine_contractor: [
    { term: 'marine construction', weight: 20, strength: 'strong' },
    { term: 'dock building', weight: 18, strength: 'strong' },
  ],
  dock_builder: [
    { term: 'dock building', weight: 18, strength: 'strong' },
    { term: 'bulkhead', weight: 15, strength: 'strong' },
  ],
  roofing_contractor: [
    { term: 'commercial roofing', weight: 20, strength: 'strong' },
    { term: 'roof membrane', weight: 15, strength: 'strong' },
  ],
  fuel_supplier: [
    { term: 'fuel tank', weight: 18, strength: 'strong' },
    { term: 'UST', weight: 20, strength: 'strong' },
    { term: 'tank testing', weight: 18, strength: 'strong' },
  ],
  gas_station: [
    { term: 'fuel tank', weight: 5, strength: 'weak' },
    { term: 'UST', weight: 5, strength: 'weak' },
  ],
  electrician: [
    { term: 'generator', weight: 20, strength: 'strong' },
    { term: 'electrical contractor', weight: 15, strength: 'strong' },
    { term: 'high voltage', weight: 12, strength: 'weak' },
  ],
  electrical_contractor: [
    { term: 'generator', weight: 20, strength: 'strong' },
    { term: 'electrical contractor', weight: 15, strength: 'strong' },
    { term: 'high voltage', weight: 12, strength: 'weak' },
  ],
  general_contractor: [
    { term: 'contractor', weight: 2, strength: 'weak' },
    { term: 'construction', weight: 2, strength: 'weak' },
  ],
  consultant: [
    { term: 'consulting', weight: 3, strength: 'weak' },
    { term: 'environmental', weight: 3, strength: 'weak' },
  ],
  service: [
    { term: 'service', weight: 1, strength: 'weak' },
  ],
};

export function optimizeHhrQuery(userInput: string): string {
  const normalized = userInput.toLowerCase().trim();
  if (normalized.includes('c&d disposal') || normalized.includes('c&d dump')) {
    return 'Construction and Demolition Recycling Center';
  }
  return userInput;
}

export class GooglePlacesProvider implements DiscoveryProvider {
  name = 'google_places';

  async search(params: DiscoveryParams): Promise<Partial<Company>[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return [];

    const allResults: Partial<Company>[] = [];
    const seen = new Set<string>();
    const vertical = params.vertical;
    const mapping = GOOGLE_VERTICAL_MAPPING[vertical];
    const searchQueries = params.searchQueries?.length ? params.searchQueries : [];

    if (mapping && params.zip) {
      const isDisposalMode = searchQueries.some(q =>
        /\b(disposal|recycling|landfill|treatment|incineration|removal|dump|decommissioning)\b/i.test(q)
      );
      const modifier = isDisposalMode
        ? (mapping.disposalSearchModifier ?? mapping.searchModifier)
        : mapping.searchModifier;
      const useIncludedType = GooglePlacesProvider.INCLUDED_TYPE_SUPPORTED.has(mapping.googlePrimaryType);
      const textQuery = useIncludedType
        ? `${mapping.googlePrimaryType.replace(/_/g, ' ')} in ${params.zip}`
        : `${modifier} in ${params.zip}`;
      const typedQuery = optimizeHhrQuery(textQuery);
      try {
        const results = await this.searchWithPrimaryType(
          typedQuery,
          mapping.googlePrimaryType,
          params.verticalConfig?.negativeKeywords || [],
          params.lat,
          params.lng,
          params.verticalConfig,
          searchQueries
        );
        for (const r of results) {
          const key = (r.companyName || '').toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            allResults.push(r);
          }
        }
      } catch (err) {
        console.error(`[GooglePlacesProvider] Typed search failed for ${vertical}:`, err);
        // Fallback: iterate searchQueries as before
        for (const query of searchQueries) {
          const textQuery = `${query} ${params.zip}`;
          try {
            const results = await this.searchWithNegatives(
              textQuery,
              params.verticalConfig?.negativeKeywords || [],
              params.lat,
              params.lng,
              params.verticalConfig,
              searchQueries
            );
            for (const r of results) {
              const key = (r.companyName || '').toLowerCase().trim();
              if (!seen.has(key)) {
                seen.add(key);
                allResults.push(r);
              }
            }
          } catch (err2) {
            console.error(`[GooglePlacesProvider] Fallback query failed:`, err2);
          }
        }
      }
    } else {
      // Legacy: iterate searchQueries verbatim
      for (const query of searchQueries) {
        const textQuery = `${query} ${params.zip}`;
        try {
          const results = await this.searchWithNegatives(
            textQuery,
            params.verticalConfig?.negativeKeywords || [],
            params.lat,
            params.lng,
            params.verticalConfig,
            searchQueries
          );
          for (const r of results) {
            const key = (r.companyName || '').toLowerCase().trim();
            if (!seen.has(key)) {
              seen.add(key);
              allResults.push(r);
            }
          }
        } catch (err) {
          console.error(`[GooglePlacesProvider] Query failed:`, err);
        }
      }
    }

    if (params.lat && params.lng) {
      try {
        const nearbyResults = await this.searchNearby(
          params.lat, params.lng, Math.min((params.radius || 50) * 1609, 50000),
          params.verticalConfig,
          searchQueries,
          vertical
        );
        for (const r of nearbyResults) {
          const key = (r.companyName || '').toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            allResults.push(r);
          }
        }
      } catch (err) {
        console.error('[GooglePlacesProvider] Nearby search failed:', err);
      }
    }

    return allResults;
  }

  async searchNearby(
    lat: number, lng: number, radiusMeters: number,
    verticalConfig?: VerticalConfig,
    searchQueries?: string[],
    verticalId?: string
  ): Promise<Partial<Company>[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return [];

    const mapping = verticalId ? GOOGLE_VERTICAL_MAPPING[verticalId] : undefined;
    const includedTypes = mapping
      ? [mapping.googlePrimaryType, ...(mapping.googleSecondaryTypes || [])]
      : [
          'recycling_center', 'concrete_contractor', 'waste_management_service',
          'construction_company', 'demolition_contractor', 'ready_mix_concrete_supplier',
          'excavating_contractor', 'industrial_equipment_supplier',
          'environmental_consultant', 'hazardous_waste_disposal',
          'electrician', 'electrical_contractor', 'mechanical_contractor',
        ];

    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const body = {
      includedTypes,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
      maxResultCount: 20,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,' +
            'places.primaryType,places.types,places.websiteUri,' +
            'places.nationalPhoneNumber,places.rating,places.userRatingCount',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const rawPlaces: GooglePlace[] = data.places || [];

      return this.mapResults(rawPlaces, lat, lng, verticalConfig, searchQueries);
    } catch {
      return [];
    }
  }

  private static readonly INCLUDED_TYPE_SUPPORTED = new Set([
    'electrician', 'plumber', 'roofing_contractor',
  ]);

  async searchWithPrimaryType(
    queryText: string,
    primaryType: string,
    negativeKeywords: string[],
    zipLat?: number,
    zipLng?: number,
    verticalConfig?: VerticalConfig,
    searchQueries?: string[]
  ): Promise<Partial<Company>[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY is not configured.');
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';
    const allPlaces: GooglePlace[] = [];
    let pageToken: string | undefined;
    const MAX_PAGES = 2;

    for (let page = 0; page < MAX_PAGES; page++) {
      const body: Record<string, unknown> = {
        textQuery: queryText,
        pageSize: 20,
      };
      if (GooglePlacesProvider.INCLUDED_TYPE_SUPPORTED.has(primaryType)) {
        body.includedType = primaryType;
        body.strictTypeFiltering = true;
      }
      if (pageToken) body.pageToken = pageToken;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,' +
            'places.primaryType,places.types,places.websiteUri,' +
            'places.nationalPhoneNumber,places.rating,places.userRatingCount,' +
            'nextPageToken',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Google Places API returned status ${response.status}`);
      }

      const data = await response.json();
      allPlaces.push(...(data.places || []));

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
      await new Promise(r => setTimeout(r, 300));
    }

    const filteredPlaces = allPlaces.filter((place) => {
      const name = (place.displayName?.text || '').toLowerCase();
      const address = (place.formattedAddress || '').toLowerCase();
      const type = (place.primaryType || '').toLowerCase();
      return !negativeKeywords.some((keyword) => {
        const cleanK = keyword.toLowerCase();
        return name.includes(cleanK) || address.includes(cleanK) || type.includes(cleanK);
      });
    });

    return this.mapResults(filteredPlaces, zipLat, zipLng, verticalConfig, searchQueries);
  }

  async searchWithNegatives(
    queryText: string,
    negativeKeywords: string[],
    zipLat?: number,
    zipLng?: number,
    verticalConfig?: VerticalConfig,
    searchQueries?: string[]
  ): Promise<Partial<Company>[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY is not configured.');
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';
    const allPlaces: GooglePlace[] = [];
    let pageToken: string | undefined;
    const MAX_PAGES = 3;

    for (let page = 0; page < MAX_PAGES; page++) {
      const body: Record<string, unknown> = { textQuery: queryText, pageSize: 20 };
      if (pageToken) body.pageToken = pageToken;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,' +
             'places.primaryType,places.types,places.websiteUri,' +
             'places.nationalPhoneNumber,places.rating,places.userRatingCount,' +
             'nextPageToken',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Google Places API returned status ${response.status}`);
      }

      const data = await response.json();
      allPlaces.push(...(data.places || []));

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
      await new Promise(r => setTimeout(r, 300));
    }

    const filteredPlaces = allPlaces.filter((place) => {
      const name = (place.displayName?.text || '').toLowerCase();
      const address = (place.formattedAddress || '').toLowerCase();
      const type = (place.primaryType || '').toLowerCase();
      return !negativeKeywords.some((keyword) => {
        const cleanK = keyword.toLowerCase();
        return name.includes(cleanK) || address.includes(cleanK) || type.includes(cleanK);
      });
    });

    return this.mapResults(filteredPlaces, zipLat, zipLng, verticalConfig, searchQueries);
  }

  private mapResults(
    places: GooglePlace[],
    zipLat?: number,
    zipLng?: number,
    verticalConfig?: VerticalConfig,
    searchQueries?: string[]
  ): Partial<Company>[] {
    const queries = searchQueries?.length ? searchQueries : (verticalConfig?.searchQueries || []);
    const now = new Date().toISOString();

    const mapped: Partial<Company>[] = [];

    for (const p of places) {
      const allTypes = [
        ...(p.primaryType ? [p.primaryType] : []),
        ...(p.types || []).filter(
          (t) => t !== 'establishment' && t !== 'point_of_interest'
        ),
      ];

      const categorySignals = extractCategorySignals(allTypes, verticalConfig, queries);

      const hasStrongSignals = categorySignals.some((s) => s.strength === 'strong');

      const nameLower = (p.displayName?.text || '').toLowerCase();
      const fullQueryMatch = queries.some(q => nameLower.includes(q.toLowerCase()));
      const queryWords = new Set(
        queries.flatMap(q =>
          q.toLowerCase().split(/\s+/).filter(w => w.length >= 4 && !['inspection','service','company','contractor','repair','maintenance','construction','building','supply','solution'].includes(w))
        )
      );
      const signalWords = new Set(
        (verticalConfig?.signals?.primary || []).flatMap(s =>
          s.term.toLowerCase().split(/\s+/).filter(w => w.length >= 4)
        )
      );
      const queryWordMatches = [...queryWords].filter(w => nameLower.includes(w)).length;
      const signalWordMatches = [...signalWords].filter(w => nameLower.includes(w)).length;
      const hasUsefulNameSignal = fullQueryMatch || queryWordMatches >= 2 || (signalWordMatches >= 1 && queryWordMatches >= 1);

      const weakOnly =
        categorySignals.length > 0 &&
        categorySignals.every((s) => s.strength === 'weak');

      if (!hasStrongSignals && !hasUsefulNameSignal) continue;
      if (weakOnly && !hasUsefulNameSignal) continue;

      const lat = p.location?.latitude;
      const lng = p.location?.longitude;
      const distanceMiles =
        zipLat != null && zipLng != null && lat != null && lng != null
          ? Math.round(haversineDistance(zipLat, zipLng, lat, lng) * 10) / 10
          : undefined;

      mapped.push({
        id: p.id,
        companyName: p.displayName?.text || 'Unknown',
        address: p.formattedAddress,
        phone: p.nationalPhoneNumber,
        website: p.websiteUri,
        googlePrimaryType: p.primaryType,
        googleTypes: p.types || [],
        googleCategorySignals: categorySignals.map((s) => s.term),
        googleRating: p.rating,
        googleReviewCount: p.userRatingCount,
        latitude: lat,
        longitude: lng,
        distanceMiles,
        source: this.name,
        status: 'NOT_CONTACTED' as const,
        createdAt: now,
        updatedAt: now,
      });
    }

    return mapped;
  }
}

function extractCategorySignals(
  googleTypes: string[],
  verticalConfig?: VerticalConfig,
  searchQueries?: string[]
): CategorySignal[] {
  const mapped: CategorySignal[] = [];
  for (const type of googleTypes) {
    const signals = GOOGLE_TYPE_TO_VERTICAL_SIGNALS[type];
    if (signals) mapped.push(...signals);
  }
  if (!verticalConfig) return mapped;

  const verticalTerms = new Set([
    ...verticalConfig.signals.primary.map((s) => s.term.toLowerCase()),
    ...verticalConfig.signals.secondary.map((s) => s.term.toLowerCase()),
    ...verticalConfig.equipmentKeywords.map((k) => k.toLowerCase()),
    ...(searchQueries || []).flatMap(q =>
      q.toLowerCase().split(/\s+/).filter(w => w.length >= 3)
    ),
  ]);

  return mapped.filter((signal) => {
    const words = signal.term.toLowerCase().split(/\s+/);
    return words.some((word) =>
      [...verticalTerms].some((vt) => vt.includes(word) || word.includes(vt))
    );
  });
}

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  websiteUri?: string;
  primaryType?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
}

export class GooglePlacesAdapter extends GooglePlacesProvider {}
