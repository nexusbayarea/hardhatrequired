import { haversineDistance } from '@/lib/geo';
import { DisposalResult, DisposalCategory } from '@/types/indexes';

// ─── Overpass API Provider ────────────────────────────────────────────────────
//
// OpenStreetMap's Overpass API lets us query infrastructure data that Google
// Places and TomTom miss: waste transfer stations, recycling facilities, landfills,
// treatment plants, and industrial sites. This is a free, no-key-required source
// which makes it particularly valuable for the Disposal Index.
//
// API: https://overpass-api.de/api/interpreter
// No auth required. Rate limited to ~10,000 req/day.
// ──────────────────────────────────────────────────────────────────────────────

// OSM tag combinations that match disposal/recycling infrastructure
const DISPOSAL_TAG_SETS: Array<{ tags: Record<string, string>; category: DisposalCategory }> = [
  // Landfills
  { tags: { 'landuse': 'landfill' },                        category: 'landfill' },
  { tags: { 'amenity': 'waste_disposal' },                  category: 'landfill' },

  // Recycling
  { tags: { 'amenity': 'recycling', 'recycling_type': 'centre' }, category: 'recycler' },
  { tags: { 'landuse': 'industrial', 'industrial': 'recycling' }, category: 'recycler' },

  // Treatment facilities
  { tags: { 'man_made': 'wastewater_plant' },               category: 'treatment_facility' },
  { tags: { 'industrial': 'wastewater_treatment' },         category: 'treatment_facility' },

  // Waste processors / transfer stations
  { tags: { 'amenity': 'waste_transfer_station' },          category: 'waste_processor' },
  { tags: { 'industrial': 'waste_treatment' },              category: 'waste_processor' },
  { tags: { 'industrial': 'waste_handling' },               category: 'waste_processor' },
];

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const REQUEST_TIMEOUT_MS = 15_000;

export class OverpassProvider {
  name = 'overpass';

  // ── Main entry: search for disposal sites near a lat/lng ─────────────────
  async searchDisposal(params: {
    lat: number;
    lng: number;
    radiusMeters?: number;
    verticalId: string;
  }): Promise<Partial<DisposalResult>[]> {
    const radius = params.radiusMeters ?? 80_000; // 80km — disposal sites serve wider areas

    const query = this.buildDisposalQuery(params.lat, params.lng, radius);

    try {
      const elements = await this.runQuery(query);
      return elements.map((el) =>
        this.mapToDisposalResult(el, params.lat, params.lng, params.verticalId)
      );
    } catch (err) {
      console.error('[OverpassProvider] Disposal search failed:', err);
      return [];
    }
  }

  // ── Build the Overpass QL query ───────────────────────────────────────────
  private buildDisposalQuery(lat: number, lng: number, radiusMeters: number): string {
    const around = `(around:${radiusMeters},${lat},${lng})`;

    // Build a union of all tag combinations — both nodes and ways
    const tagUnions = DISPOSAL_TAG_SETS.flatMap(({ tags }) => {
      const tagFilters = Object.entries(tags)
        .map(([k, v]) => `["${k}"="${v}"]`)
        .join('');
      return [
        `node${tagFilters}${around};`,
        `way${tagFilters}${around};`,
      ];
    }).join('\n  ');

    return `
[out:json][timeout:25];
(
  ${tagUnions}
);
out body;
>;
out skel qt;
    `.trim();
  }

  // ── Execute the Overpass query ────────────────────────────────────────────
  private async runQuery(query: string): Promise<OverpassElement[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Overpass API ${response.status}`);
      }

      const data = await response.json();
      // Filter to elements that have at least a name or addr:street tag
      return (data.elements || []).filter(
        (el: OverpassElement) => el.tags?.name || el.tags?.['addr:street']
      );
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Map OSM element → DisposalResult ─────────────────────────────────────
  private mapToDisposalResult(
    el: OverpassElement,
    originLat: number,
    originLng: number,
    verticalId: string
  ): Partial<DisposalResult> {
    const tags = el.tags || {};

    // Resolve lat/lng: nodes have direct coords, ways use center
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;

    const distanceMiles =
      lat != null && lng != null
        ? Math.round(haversineDistance(originLat, originLng, lat, lng) * 10) / 10
        : undefined;

    const category = resolveDisposalCategory(tags);

    const address = [
      tags['addr:housenumber'],
      tags['addr:street'],
    ]
      .filter(Boolean)
      .join(' ');

    // Infer accepted waste types from OSM tags
    const acceptedWasteTypes: string[] = [];
    if (tags['recycling:glass'] === 'yes')     acceptedWasteTypes.push('glass');
    if (tags['recycling:paper'] === 'yes')     acceptedWasteTypes.push('paper');
    if (tags['recycling:metal'] === 'yes')     acceptedWasteTypes.push('metal');
    if (tags['recycling:plastic'] === 'yes')   acceptedWasteTypes.push('plastic');
    if (tags['recycling:hazardous'] === 'yes') acceptedWasteTypes.push('hazardous');
    if (tags['industrial'] === 'wastewater_treatment') acceptedWasteTypes.push('wastewater');
    if (tags['landuse'] === 'landfill')        acceptedWasteTypes.push('general solid waste');

    return {
      index: 'disposal',
      id: `osm-${el.type}-${el.id}`,
      name: tags.name || tags['short_name'] || 'Unnamed Facility',
      address: address || undefined,
      city: tags['addr:city'],
      state: tags['addr:state'],
      zip: tags['addr:postcode'],
      phone: tags.phone || tags['contact:phone'],
      website: tags.website || tags['contact:website'],
      latitude: lat,
      longitude: lng,
      distanceMiles,
      category,
      acceptedWasteTypes: acceptedWasteTypes.length > 0 ? acceptedWasteTypes : undefined,
      hoursOfOperation: tags.opening_hours,
      requiresManifest: category === 'treatment_facility' || category === 'epa_disposal_site',
      hazmatCertified: tags['recycling:hazardous'] === 'yes',
      source: this.name,
      verticalId,
      score: 0,       // scored by HHR scoring engine after discovery
      grade: 'D',
      matchedSignals: [],
      createdAt: new Date().toISOString(),
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveDisposalCategory(tags: Record<string, string>): DisposalCategory {
  if (tags.landuse === 'landfill' || tags.amenity === 'waste_disposal') return 'landfill';
  if (tags.amenity === 'recycling' || tags.industrial === 'recycling')  return 'recycler';
  if (tags.man_made === 'wastewater_plant' || tags.industrial === 'wastewater_treatment')
    return 'treatment_facility';
  if (tags.amenity === 'waste_transfer_station') return 'waste_processor';
  return 'waste_processor';
}

// ─── OSM element types ────────────────────────────────────────────────────────

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}
