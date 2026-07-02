// ─── Overpass Disposal Provider (Rewrite) ────────────────────────────────────
//
// WHY THE ORIGINAL WAS SLOW AND EMPTY:
//
//   1. It queried OSM tag combinations one at a time in a loop — each HTTP
//      request takes 1–3s; 9 combinations = up to 27s just for Overpass.
//
//   2. It filtered on `el.tags?.name || el.tags?.['addr:street']` which passes
//      through unnamed nodes that have zero text for signal matching. These
//      show up as blank results that cost API time but produce nothing.
//
//   3. It only tagged 3–4 OSM keys. Industrial waste infrastructure in OSM is
//      tagged across 8+ different key families (landuse, amenity, man_made,
//      industrial, shop, operator:type, etc.). Missing most of them.
//
// THE FIX:
//
//   1. Single compound Overpass QL query — ALL tag combinations in one HTTP
//      request. Goes from ~27s to ~3s regardless of how many combos we check.
//
//   2. Name enrichment — facilities without a name tag get a synthetic name
//      built from their tags so signal matching has something to work with.
//
//   3. Full OSM tag coverage for industrial waste infrastructure.
//
//   4. Vertical-aware tag selection — only fetch the OSM tags relevant to the
//      waste stream you're actually searching for.
//
//   5. Concurrent with a 12s hard timeout so Overpass never blocks the pipeline.
// ──────────────────────────────────────────────────────────────────────────────

import { haversineDistance } from '@/lib/geo';
import { DisposalResult } from '@/types/indexes';
import { getDisposalFacilityTypes } from '../disposal-signals';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const OVERPASS_TIMEOUT_MS = 12_000;

// ── OSM tag sets per facility category ────────────────────────────────────────
//
// Each entry is a flat object of { key: value } that uniquely identifies that
// facility type in OSM. All entries are combined into a single Overpass UNION
// query so there's only one HTTP round-trip.

interface OsmTagSet {
  tags: Record<string, string>;
  category: string;      // maps to DisposalResult.category
  syntheticName: string; // used when OSM has no name tag
}

// The master tag list. Vertical-specific subsets are selected by
// getTagSetsForVertical() below.
const ALL_OSM_TAG_SETS: OsmTagSet[] = [
  // ── Landfills ──────────────────────────────────────────────────────────────
  { tags: { landuse: 'landfill' },                             category: 'landfill',          syntheticName: 'Landfill' },
  { tags: { amenity: 'waste_disposal' },                       category: 'landfill',          syntheticName: 'Waste Disposal Site' },
  { tags: { waste: 'dump_site' },                              category: 'landfill',          syntheticName: 'Dump Site' },

  // ── Transfer stations ──────────────────────────────────────────────────────
  { tags: { amenity: 'waste_transfer_station' },               category: 'waste_processor',   syntheticName: 'Waste Transfer Station' },
  { tags: { industrial: 'waste_transfer_station' },            category: 'waste_processor',   syntheticName: 'Waste Transfer Station' },

  // ── Recycling centers (full-scale, not kerbside bins) ─────────────────────
  { tags: { amenity: 'recycling', recycling_type: 'centre' },  category: 'recycler',          syntheticName: 'Recycling Center' },
  { tags: { landuse: 'industrial', industrial: 'recycling' },  category: 'recycler',          syntheticName: 'Recycling Facility' },
  { tags: { shop: 'scrap_metal' },                             category: 'recycler',          syntheticName: 'Scrap Metal Yard' },
  { tags: { industrial: 'scrap_yard' },                        category: 'recycler',          syntheticName: 'Scrap Yard' },

  // ── Wastewater / treatment plants ─────────────────────────────────────────
  { tags: { man_made: 'wastewater_plant' },                    category: 'treatment_facility', syntheticName: 'Wastewater Treatment Plant' },
  { tags: { industrial: 'wastewater_treatment' },              category: 'treatment_facility', syntheticName: 'Wastewater Treatment Facility' },
  { tags: { amenity: 'sewage_treatment' },                     category: 'treatment_facility', syntheticName: 'Sewage Treatment Plant' },

  // ── Waste processors / industrial waste handling ──────────────────────────
  { tags: { industrial: 'waste_treatment' },                   category: 'waste_processor',   syntheticName: 'Industrial Waste Treatment' },
  { tags: { industrial: 'waste_handling' },                    category: 'waste_processor',   syntheticName: 'Industrial Waste Handler' },
  { tags: { industrial: 'waste' },                             category: 'waste_processor',   syntheticName: 'Industrial Waste Facility' },

  // ── Hazardous waste ───────────────────────────────────────────────────────
  { tags: { amenity: 'recycling', recycling: 'hazardous_waste' }, category: 'epa_disposal_site', syntheticName: 'Hazardous Waste Collection' },
  { tags: { landuse: 'industrial', operator_type: 'hazardous_waste' }, category: 'epa_disposal_site', syntheticName: 'Hazardous Waste Facility' },

  // ── Concrete recyclers ────────────────────────────────────────────────────
  { tags: { industrial: 'concrete_recycling' },                category: 'recycler',          syntheticName: 'Concrete Recycling Facility' },
  { tags: { industrial: 'aggregate' },                         category: 'recycler',          syntheticName: 'Aggregate Processing Facility' },

  // ── Medical / biohazard ───────────────────────────────────────────────────
  { tags: { industrial: 'medical_waste' },                     category: 'epa_disposal_site', syntheticName: 'Medical Waste Facility' },

  // ── Composting / organics ─────────────────────────────────────────────────
  { tags: { landuse: 'industrial', industrial: 'composting' }, category: 'waste_processor',   syntheticName: 'Composting Facility' },
];

// Tag sets relevant per facility type — avoids fetching irrelevant OSM nodes
const FACILITY_TYPE_TAG_MAP: Record<string, string[]> = {
  landfill:          ['landfill', 'waste_processor'],
  recycling:         ['recycler'],
  concrete_recycler: ['recycler'],
  wastewater_plant:  ['treatment_facility'],
  treatment_facility:['treatment_facility', 'waste_processor'],
  hazardous_waste:   ['epa_disposal_site', 'landfill'],
  transfer_station:  ['waste_processor'],
  scrap_yard:        ['recycler'],
  medical_waste:     ['epa_disposal_site'],
};

function getTagSetsForVertical(facilityTypes: string[]): OsmTagSet[] {
  if (!facilityTypes.length) return ALL_OSM_TAG_SETS;

  const wantedCategories = new Set<string>();
  for (const ft of facilityTypes) {
    for (const cat of (FACILITY_TYPE_TAG_MAP[ft] ?? [])) {
      wantedCategories.add(cat);
    }
  }

  if (wantedCategories.size === 0) return ALL_OSM_TAG_SETS;
  return ALL_OSM_TAG_SETS.filter(ts => wantedCategories.has(ts.category));
}

// ── Single compound Overpass query ────────────────────────────────────────────
//
// Generates ONE query that includes ALL tag combinations as a UNION.
// This is the critical perf fix — one round-trip instead of N.

function buildCompoundQuery(
  lat: number,
  lng: number,
  radiusMeters: number,
  tagSets: OsmTagSet[]
): string {
  const around = `(around:${radiusMeters},${lat},${lng})`;

  // Each tag set becomes two clauses (node + way) in the union
  const unions = tagSets.flatMap(({ tags }) => {
    const tagFilters = Object.entries(tags)
      .map(([k, v]) => `["${k}"="${v}"]`)
      .join('');
    return [
      `node${tagFilters}${around};`,
      `way${tagFilters}${around};`,
    ];
  }).join('\n  ');

  return `
[out:json][timeout:12];
(
  ${unions}
);
out body;
>;
out skel qt;
  `.trim();
}

// ── Main provider class ────────────────────────────────────────────────────────

export class OverpassDisposalProvider {
  name = 'overpass';

  async searchDisposal(params: {
    lat: number;
    lng: number;
    radiusMiles?: number;
    verticalId: string;
  }): Promise<Partial<DisposalResult>[]> {
    // Disposal sites serve wide areas — default 80km (50mi)
    const radiusMeters = (params.radiusMiles ?? 50) * 1609.34;

    // Select only the OSM tag sets relevant to this vertical's waste stream
    const facilityTypes = getDisposalFacilityTypes(params.verticalId);
    const tagSets = getTagSetsForVertical(facilityTypes);

    if (tagSets.length === 0) return [];

    const query = buildCompoundQuery(params.lat, params.lng, radiusMeters, tagSets);

    let elements: OverpassElement[] = [];
    try {
      elements = await this.runQuery(query);
    } catch (err) {
      console.error(`[OverpassDisposalProvider] Query failed for ${params.verticalId}:`, err);
      return [];
    }

    if (elements.length === 0) return [];

    // Map elements, synthesizing names where OSM has none
    return elements
      .map(el => this.mapElement(el, params.lat, params.lng, params.verticalId, tagSets))
      .filter((r): r is Partial<DisposalResult> => r !== null);
  }

  private async runQuery(query: string): Promise<OverpassElement[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

    try {
      const res = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
      const data = await res.json();

      // Only keep elements that have location data (nodes have lat/lon, ways have center)
      return (data.elements ?? []).filter(
        (el: OverpassElement) => el.lat != null || el.center != null
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private mapElement(
    el: OverpassElement,
    originLat: number,
    originLng: number,
    verticalId: string,
    tagSets: OsmTagSet[]
  ): Partial<DisposalResult> | null {
    const tags = el.tags ?? {};
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;

    if (lat == null || lng == null) return null;

    const distanceMiles = Math.round(
      haversineDistance(originLat, originLng, lat, lng) * 10
    ) / 10;

    // Resolve category from the matched tag set
    const category = resolveCategory(tags, tagSets);

    // Build name — synthesize from tags if OSM has no name
    const name = buildName(tags, tagSets, category);

    // Extract accepted waste types from recycling:* sub-tags
    const acceptedWasteTypes = extractWasteTypes(tags);

    // Build address from addr:* tags
    const address = [tags['addr:housenumber'], tags['addr:street']]
      .filter(Boolean).join(' ') || undefined;

    // Build a rich notes string from OSM tags — this is what signal matching
    // will run against when the company name is opaque.
    const noteParts: string[] = [];
    if (tags.operator) noteParts.push(`Operator: ${tags.operator}`);
    if (tags.description) noteParts.push(tags.description);
    if (tags.landuse) noteParts.push(tags.landuse.replace(/_/g, ' '));
    if (tags.industrial) noteParts.push(tags.industrial.replace(/_/g, ' '));
    if (tags.amenity) noteParts.push(tags.amenity.replace(/_/g, ' '));
    if (tags['recycling:hazardous'] === 'yes') noteParts.push('hazardous waste');
    if (acceptedWasteTypes.length) noteParts.push(acceptedWasteTypes.join(', '));

    return {
      index: 'disposal' as const,
      id: `osm-${el.type}-${el.id}`,
      name,
      address,
      city: tags['addr:city'],
      state: tags['addr:state'],
      zip: tags['addr:postcode'],
      phone: tags.phone || tags['contact:phone'],
      website: tags.website || tags['contact:website'],
      latitude: lat,
      longitude: lng,
      distanceMiles,
      category: category as any,
      acceptedWasteTypes: acceptedWasteTypes.length ? acceptedWasteTypes : undefined,
      hoursOfOperation: tags.opening_hours,
      hazmatCertified: tags['recycling:hazardous'] === 'yes',
      requiresManifest: category === 'treatment_facility' || category === 'epa_disposal_site',
      // notes is the text blob that signal matching runs against
      notes: noteParts.filter(Boolean).join(' | ') || undefined,
      source: this.name,
      verticalId,
      score: 0,
      grade: 'D' as const,
      matchedSignals: [],
      createdAt: new Date().toISOString(),
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveCategory(tags: Record<string, string>, tagSets: OsmTagSet[]): string {
  for (const ts of tagSets) {
    const match = Object.entries(ts.tags).every(([k, v]) => tags[k] === v);
    if (match) return ts.category;
  }
  if (tags.landuse === 'landfill' || tags.amenity === 'waste_disposal') return 'landfill';
  if (tags.man_made === 'wastewater_plant') return 'treatment_facility';
  if (tags.amenity === 'recycling') return 'recycler';
  if (tags.amenity === 'waste_transfer_station') return 'waste_processor';
  return 'waste_processor';
}

function buildName(
  tags: Record<string, string>,
  tagSets: OsmTagSet[],
  category: string
): string {
  if (tags.name) return tags.name;
  if (tags.operator) return tags.operator;

  // Synthesize from the matched tag set's syntheticName
  for (const ts of tagSets) {
    const match = Object.entries(ts.tags).every(([k, v]) => tags[k] === v);
    if (match) return ts.syntheticName;
  }

  // Generic fallback based on category
  const fallbacks: Record<string, string> = {
    landfill:           'Landfill',
    recycler:           'Recycling Facility',
    treatment_facility: 'Wastewater Treatment Plant',
    waste_processor:    'Waste Transfer Station',
    epa_disposal_site:  'Hazardous Waste Facility',
  };
  return fallbacks[category] ?? 'Waste Facility';
}

function extractWasteTypes(tags: Record<string, string>): string[] {
  const prefix = 'recycling:';
  return Object.entries(tags)
    .filter(([k, v]) => k.startsWith(prefix) && v === 'yes')
    .map(([k]) => k.slice(prefix.length).replace(/_/g, ' '));
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export const overpassDisposalProvider = new OverpassDisposalProvider();
