import { Company } from '@/types/company';
import { DiscoveryProvider, DiscoveryParams } from './base';
import { haversineDistance } from '@/lib/geo';
import { VerticalConfig } from '@/types/config';

export const GOOGLE_TYPE_TO_VERTICAL_SIGNALS: Record<string, string[]> = {
  waste_management_service:     ['waste management', 'waste removal', 'industrial waste'],
  recycling_center:             ['recycling', 'material recovery', 'waste recycling'],
  hazardous_waste_disposal:     ['hazardous waste', 'hazmat disposal', 'environmental remediation'],
  environmental_consultant:     ['environmental', 'compliance', 'SWPPP', 'stormwater'],
  sewage_disposal_service:      ['wastewater', 'sewer service', 'pumping'],
  septic_system_service:        ['pumping', 'wastewater', 'tank service'],
  concrete_contractor:          ['concrete contractor', 'concrete', 'commercial concrete'],
  construction_company:         ['construction', 'demolition', 'contractor'],
  demolition_contractor:        ['demolition', 'concrete removal', 'construction waste'],
  ready_mix_concrete_supplier:  ['ready mix', 'concrete', 'batch plant'],
  excavating_contractor:        ['excavation', 'hydrovac', 'digging'],
  fire_protection_service:      ['fire protection', 'fire sprinkler', 'fire extinguisher', 'NFPA'],
  hvac_contractor:              ['HVAC', 'air balancing', 'test and balance'],
  plumber:                      ['backflow', 'plumbing', 'water service'],
  mechanical_contractor:        ['mechanical', 'HVAC', 'fire protection'],
  elevator_service:             ['elevator inspection', 'lift certification', 'elevator testing'],
  restaurant_supply_store:      ['restaurant service', 'kitchen equipment'],
  industrial_equipment_supplier: ['industrial equipment', 'commercial kitchen'],
  scrap_metal_dealer:           ['scrap metal', 'metal recycling', 'ferrous scrap'],
  metal_processing:             ['metal processing', 'scrap yard', 'metal recycling'],
  junk_removal_service:         ['scrap metal', 'waste removal', 'metal recycling'],
  marine_contractor:            ['marine construction', 'dock building', 'seawall'],
  dock_builder:                 ['dock building', 'marine construction', 'bulkhead'],
  medical_clinic:               ['medical waste', 'biohazard disposal'],
  laboratory:                   ['regulated medical waste', 'biohazard disposal'],
  roofing_contractor:           ['commercial roofing', 'flat roof', 'roof membrane'],
  fuel_supplier:                ['fuel tank', 'UST', 'tank testing'],
  gas_station:                  ['fuel tank', 'UST'],
};

export class GooglePlacesProvider implements DiscoveryProvider {
  name = 'google_places';

  async search(params: DiscoveryParams): Promise<Partial<Company>[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return [];

    const allResults: Partial<Company>[] = [];
    const seen = new Set<string>();

    const searchQueries = params.searchQueries?.length
      ? params.searchQueries
      : [
          'concrete slurry recycling',
          'concrete washout',
          'slurry disposal',
          'ready mix reclaiming',
          'concrete reclaiming',
        ];

    for (const query of searchQueries) {
      const textQuery = `${query} ${params.zip}`;
      try {
        const results = await this.searchWithNegatives(
          textQuery, [], params.lat, params.lng, params.verticalConfig
        );
        for (const r of results) {
          const key = (r.companyName || '').toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            allResults.push(r);
          }
        }
      } catch (err) {
        console.error(`[GooglePlacesProvider] Query '${textQuery}' failed:`, err);
      }
    }

    if (params.lat && params.lng) {
      try {
        const nearbyResults = await this.searchNearby(
          params.lat, params.lng, Math.min((params.radius || 50) * 1609, 50000),
          params.verticalConfig
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
    verticalConfig?: VerticalConfig
  ): Promise<Partial<Company>[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return [];

    const includedTypes = [
      'recycling_center', 'concrete_contractor', 'waste_management_service',
      'construction_company', 'demolition_contractor', 'ready_mix_concrete_supplier',
      'excavating_contractor', 'industrial_equipment_supplier',
      'environmental_consultant', 'hazardous_waste_disposal',
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
            'places.internationalPhoneNumber,places.websiteUri,' +
            'places.primaryType,places.types,places.primaryTypeDisplayName',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const rawPlaces: GooglePlace[] = data.places || [];

      return rawPlaces.map((p) => {
        const placeLat = p.location?.latitude;
        const placeLng = p.location?.longitude;
        const distanceMiles =
          lat != null && lng != null && placeLat != null && placeLng != null
            ? Math.round(haversineDistance(lat, lng, placeLat, placeLng) * 10) / 10
            : undefined;

        const allTypes: string[] = (p.types || []).filter(
          (t) => t !== 'establishment' && t !== 'point_of_interest'
        );
        if (p.primaryType) allTypes.unshift(p.primaryType);

        const categorySignals = extractCategorySignals(allTypes, verticalConfig);

        const now = new Date().toISOString();
        return {
          id: p.id,
          companyName: p.displayName?.text || 'Unindexed Business',
          address: p.formattedAddress,
          phone: p.internationalPhoneNumber,
          website: p.websiteUri,
          notes: `nearby: ${(p.primaryType || '').replace(/_/g, ' ')}` || undefined,
          googleCategorySignals: categorySignals.length > 0 ? categorySignals : undefined,
          latitude: placeLat,
          longitude: placeLng,
          distanceMiles,
          source: this.name,
          status: 'NOT_CONTACTED' as const,
          createdAt: now,
          updatedAt: now,
        };
      });
    } catch {
      return [];
    }
  }

  async searchWithNegatives(
    queryText: string,
    negativeKeywords: string[],
    zipLat?: number,
    zipLng?: number,
    verticalConfig?: VerticalConfig
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
            'places.internationalPhoneNumber,places.websiteUri,' +
            'places.primaryType,places.types,places.primaryTypeDisplayName,' +
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

    const now = new Date().toISOString();

    return filteredPlaces.map((p) => {
      const lat = p.location?.latitude;
      const lng = p.location?.longitude;
      const distanceMiles =
        zipLat != null && zipLng != null && lat != null && lng != null
          ? Math.round(haversineDistance(zipLat, zipLng, lat, lng) * 10) / 10
          : undefined;

      const allTypes: string[] = (p.types || []).filter(
        (t) => t !== 'establishment' && t !== 'point_of_interest'
      );
      if (p.primaryType) allTypes.unshift(p.primaryType);

      const categorySignals = extractCategorySignals(allTypes, verticalConfig);

      const googleType = (p.primaryType || '').replace(/_/g, ' ');
      const googleTypes = allTypes.map((t) => t.replace(/_/g, ' '));
      const typeContext = [...new Set([googleType, ...googleTypes])]
        .filter(Boolean)
        .join(', ');

      return {
        id: p.id,
        companyName: p.displayName?.text || 'Unindexed Business',
        address: p.formattedAddress,
        phone: p.internationalPhoneNumber,
        website: p.websiteUri,
        notes: typeContext || undefined,
        googleCategorySignals: categorySignals.length > 0 ? categorySignals : undefined,
        latitude: lat,
        longitude: lng,
        distanceMiles,
        source: this.name,
        status: 'NOT_CONTACTED' as const,
        createdAt: now,
        updatedAt: now,
      };
    });
  }
}

function extractCategorySignals(
  googleTypes: string[],
  verticalConfig?: VerticalConfig
): string[] {
  const mapped: string[] = [];
  for (const type of googleTypes) {
    const terms = GOOGLE_TYPE_TO_VERTICAL_SIGNALS[type];
    if (terms) mapped.push(...terms);
  }
  if (!verticalConfig || mapped.length === 0) {
    return [...new Set(mapped)];
  }
  const verticalTerms = new Set<string>([
    ...verticalConfig.signals.primary.map((s) => s.term.toLowerCase()),
    ...verticalConfig.signals.secondary.map((s) => s.term.toLowerCase()),
    ...verticalConfig.equipmentKeywords.map((k) => k.toLowerCase()),
  ]);
  const relevant = mapped.filter((term) => {
    const words = term.toLowerCase().split(/\s+/);
    return words.some((word) => {
      if (word.length < 4) return false;
      return (
        verticalTerms.has(term.toLowerCase()) ||
        [...verticalTerms].some((vt) => vt.includes(word) || word.includes(vt.split(/\s+/)[0]))
      );
    });
  });
  return [...new Set(relevant)];
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
}

export class GooglePlacesAdapter extends GooglePlacesProvider {}
