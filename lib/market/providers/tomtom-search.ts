import { haversineDistance } from '@/lib/geo';
import { LaborResult, EquipmentRentalResult, LaborCategory, RentalEquipmentType } from '@/types/indexes';

// ─── TomTom Places Provider ───────────────────────────────────────────────────
//
// TomTom's Places API covers categories that Google Places handles poorly:
// industrial facilities, equipment yards, specialty contractors, and logistics
// infrastructure. We use it as a supplementary discovery source for the
// Labor and Equipment Rental indexes.
//
// API: https://developer.tomtom.com/search-api/documentation/search-service/points-of-interest-search
// Auth: TOMTOM_API_KEY env var
// ──────────────────────────────────────────────────────────────────────────────

// TomTom category codes that map to HHR verticals
const TOMTOM_LABOR_CATEGORIES = [
  '9927001', // Construction company
  '9927009', // Contractor (general)
  '9927002', // Electrical contractor
  '9927003', // Plumbing contractor
  '9927004', // HVAC contractor
  '9927010', // Demolition
  '9369',    // Industrial facility
];

const TOMTOM_EQUIPMENT_CATEGORIES = [
  '9561001', // Equipment rental
  '9561002', // Heavy equipment dealer
  '9561003', // Industrial equipment
  '7013',    // Truck rental / leasing
  '9369003', // Industrial machinery
];

// TomTom → HHR labor category mapping
const TOMTOM_TO_LABOR_CATEGORY: Record<string, LaborCategory> = {
  '9927001': 'certified_contractor',
  '9927009': 'certified_contractor',
  '9927002': 'certified_contractor',
  '9927003': 'certified_contractor',
  '9927004': 'certified_contractor',
  '9927010': 'specialty_crew',
  '9369':    'operator',
};

// TomTom → HHR equipment type mapping
const TOMTOM_TO_EQUIPMENT_TYPE: Record<string, RentalEquipmentType> = {
  '9561001': 'heavy_equipment',
  '9561002': 'heavy_equipment',
  '9561003': 'heavy_equipment',
  '7013':    'vac_truck',
  '9369003': 'heavy_equipment',
};

export class TomTomProvider {
  name = 'tomtom';
  private apiKey = process.env.TOMTOM_API_KEY;

  // ── Search for labor / contractor results ─────────────────────────────────
  async searchLabor(params: {
    lat: number;
    lng: number;
    radiusMeters?: number;
    verticalId: string;
    query?: string;
  }): Promise<Partial<LaborResult>[]> {
    if (!this.apiKey) {
      console.warn('[TomTomProvider] TOMTOM_API_KEY not configured — skipping labor search');
      return [];
    }

    const radius = params.radiusMeters ?? 50000; // default 50km
    const results: Partial<LaborResult>[] = [];

    for (const categoryId of TOMTOM_LABOR_CATEGORIES) {
      try {
        const places = await this.searchByCategory(
          categoryId,
          params.lat,
          params.lng,
          radius,
          params.query
        );
        const mapped = places.map((p) =>
          this.mapToLaborResult(p, params.lat, params.lng, params.verticalId)
        );
        results.push(...mapped);
      } catch (err) {
        console.error(`[TomTomProvider] Labor category ${categoryId} failed:`, err);
      }
    }

    return deduplicateByName(results);
  }

  // ── Search for equipment rental results ───────────────────────────────────
  async searchEquipmentRental(params: {
    lat: number;
    lng: number;
    radiusMeters?: number;
    verticalId: string;
    query?: string;
  }): Promise<Partial<EquipmentRentalResult>[]> {
    if (!this.apiKey) {
      console.warn('[TomTomProvider] TOMTOM_API_KEY not configured — skipping equipment search');
      return [];
    }

    const radius = params.radiusMeters ?? 80000; // equipment rentals travel further — 80km
    const results: Partial<EquipmentRentalResult>[] = [];

    for (const categoryId of TOMTOM_EQUIPMENT_CATEGORIES) {
      try {
        const places = await this.searchByCategory(
          categoryId,
          params.lat,
          params.lng,
          radius,
          params.query
        );
        const mapped = places.map((p) =>
          this.mapToEquipmentResult(p, params.lat, params.lng, params.verticalId)
        );
        results.push(...mapped);
      } catch (err) {
        console.error(`[TomTomProvider] Equipment category ${categoryId} failed:`, err);
      }
    }

    return deduplicateByName(results);
  }

  // ── Core TomTom POI search ────────────────────────────────────────────────
  private async searchByCategory(
    categoryId: string,
    lat: number,
    lng: number,
    radiusMeters: number,
    query?: string
  ): Promise<TomTomPlace[]> {
    const baseUrl = 'https://api.tomtom.com/search/2/poiSearch';
    const searchTerm = query || 'contractor';

    const params = new URLSearchParams({
      key: this.apiKey!,
      lat: lat.toString(),
      lon: lng.toString(),
      radius: radiusMeters.toString(),
      categorySet: categoryId,
      limit: '25',
      language: 'en-US',
      countrySet: 'US',
    });

    const url = `${baseUrl}/${encodeURIComponent(searchTerm)}.json?${params}`;

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`TomTom API ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return (data.results || []) as TomTomPlace[];
  }

  // ── Mappers ───────────────────────────────────────────────────────────────
  private mapToLaborResult(
    p: TomTomPlace,
    originLat: number,
    originLng: number,
    verticalId: string
  ): Partial<LaborResult> {
    const lat = p.position?.lat;
    const lng = p.position?.lon;
    const distanceMiles =
      lat != null && lng != null
        ? Math.round(haversineDistance(originLat, originLng, lat, lng) * 10) / 10
        : undefined;

    const categoryId = p.poi?.categories?.[0]?.id?.toString() ?? '';
    const category = TOMTOM_TO_LABOR_CATEGORY[categoryId] ?? 'certified_contractor';

    return {
      index: 'labor',
      id: p.id || `tomtom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: p.poi?.name || 'Unknown Business',
      address: [p.address?.streetNumber, p.address?.streetName].filter(Boolean).join(' '),
      city: p.address?.municipality,
      state: p.address?.countrySubdivision,
      zip: p.address?.postalCode,
      phone: p.poi?.phone,
      website: p.poi?.url,
      latitude: lat,
      longitude: lng,
      distanceMiles,
      category,
      certifications: p.poi?.classifications
        ?.flatMap((c: any) => c.names?.map((n: any) => n.name) || [])
        .slice(0, 5),
      source: this.name,
      verticalId,
      score: 0,        // scored by HHR scoring engine after discovery
      grade: 'D',
      matchedSignals: [],
      createdAt: new Date().toISOString(),
    };
  }

  private mapToEquipmentResult(
    p: TomTomPlace,
    originLat: number,
    originLng: number,
    verticalId: string
  ): Partial<EquipmentRentalResult> {
    const lat = p.position?.lat;
    const lng = p.position?.lon;
    const distanceMiles =
      lat != null && lng != null
        ? Math.round(haversineDistance(originLat, originLng, lat, lng) * 10) / 10
        : undefined;

    const categoryId = p.poi?.categories?.[0]?.id?.toString() ?? '';
    const equipmentType = TOMTOM_TO_EQUIPMENT_TYPE[categoryId] ?? 'heavy_equipment';

    return {
      index: 'equipment_rental',
      id: p.id || `tomtom-eq-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: p.poi?.name || 'Unknown Business',
      address: [p.address?.streetNumber, p.address?.streetName].filter(Boolean).join(' '),
      city: p.address?.municipality,
      state: p.address?.countrySubdivision,
      zip: p.address?.postalCode,
      phone: p.poi?.phone,
      website: p.poi?.url,
      latitude: lat,
      longitude: lng,
      distanceMiles,
      equipmentTypes: [equipmentType],
      deliveryAvailable: true,     // assume until confirmed otherwise
      source: this.name,
      verticalId,
      score: 0,
      grade: 'D',
      matchedSignals: [],
      createdAt: new Date().toISOString(),
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deduplicateByName<T extends { name?: string }>(results: T[]): T[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = (r.name || '').toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── TomTom API types ─────────────────────────────────────────────────────────

interface TomTomPlace {
  id?: string;
  position?: { lat?: number; lon?: number };
  poi?: {
    name?: string;
    phone?: string;
    url?: string;
    categories?: Array<{ id?: number | string; names?: Array<{ name: string }> }>;
    classifications?: Array<{ names?: Array<{ name: string }> }>;
  };
  address?: {
    streetNumber?: string;
    streetName?: string;
    municipality?: string;
    countrySubdivision?: string;
    postalCode?: string;
  };
}
