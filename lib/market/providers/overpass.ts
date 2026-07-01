import { Company } from '@/types/company';
import { DiscoveryProvider, DiscoveryParams } from './base';

const NAICS_TO_OSM_TAGS: Record<string, string[]> = {
  '562211': ['amenity=waste_transfer_station', 'industrial=scrap_yard'],
  '562910': ['industrial=hazardous_waste', 'landuse=industrial'],
  '238110': ['industrial=concrete_batching', 'man_made=silo'],
  '327320': ['industrial=concrete_batching', 'man_made=silo'],
  '221320': ['man_made=wastewater_plant', 'man_made=water_works'],
  '423930': ['industrial=scrap_yard', 'amenity=recycling'],
  '562920': ['industrial=scrap_yard', 'amenity=recycling'],
  '237990': ['man_made=pier', 'waterway=dock'],
  '238160': ['industrial=roofing', 'man_made=storage_tank'],
  '541620': ['office=environmental_consultant', 'industrial=environmental'],
  '562219': ['amenity=waste_transfer_station', 'industrial=sewage'],
  '238220': ['craft=hvac', 'industrial=hvac', 'man_made=mechanical_room'],
  '561621': ['craft=fire_protection', 'industrial=fire_protection', 'man_made=sprinkler'],
  '811310': ['craft=electrician', 'industrial=generator', 'man_made=power_generator', 'office=company'],
  '811490': ['craft=maintenance', 'industrial=maintenance', 'man_made=test_equipment'],
  '238290': ['craft=elevator', 'industrial=elevator_service', 'office=company'],
  '541350': ['office=building_inspector', 'craft=inspector', 'office=company'],
  '561790': ['industrial=cleaning_plant', 'amenity=industrial_kitchen'],
  '541380': ['office=testing_laboratory', 'industrial=testing'],
  '221114': ['industrial=solar', 'man_made=solar_panel', 'industrial=power_plant'],
  '221115': ['industrial=wind', 'man_made=wind_turbine', 'industrial=power_plant'],
  '237110': ['craft=excavation', 'man_made=water_well', 'industrial=pipeline'],
  '238210': ['craft=electrician'],
  '238320': ['craft=painter', 'industrial=sandblasting', 'craft=blasting'],
  '238910': ['craft=excavation', 'industrial=excavation'],
  '238990': ['industrial=construction', 'craft=specialty'],
  '423320': ['industrial=construction_material', 'industrial=wholesale'],
  '423690': ['industrial=electronics', 'craft=electrician'],
  '532490': ['industrial=equipment_rental', 'amenity=rental'],
  '562112': ['amenity=hazardous_waste', 'industrial=hazardous_waste'],
  '562119': ['industrial=waste', 'amenity=waste_disposal'],
  '562998': ['industrial=waste_processing', 'amenity=waste_transfer_station'],
};

export class OverpassProvider implements DiscoveryProvider {
  name = 'osm_infrastructure';

  async search(params: DiscoveryParams): Promise<Partial<Company>[]> {
    if (!params.lat || !params.lng) return [];

    const radiusMeters = Math.round((params.radius || 50) * 1609.34);
    const naicsCodes = params.verticalConfig?.targetNaicsCodes || [];

    const tags = new Set<string>();
    for (const code of naicsCodes) {
      const osmTags = NAICS_TO_OSM_TAGS[code];
      if (osmTags) osmTags.forEach((t) => tags.add(t));
    }

    if (tags.size === 0) return [];

    const tagQueries = Array.from(tags)
      .map((tag) => {
        const [key, value] = tag.split('=');
        return `node["${key}"="${value}"](around:${radiusMeters},${params.lat},${params.lng});\nway["${key}"="${value}"](around:${radiusMeters},${params.lat},${params.lng});\nrelation["${key}"="${value}"](around:${radiusMeters},${params.lat},${params.lng});`;
      })
      .join('\n');

    const query = `[out:json][timeout:25];\n(\n${tagQueries}\n);\nout center;`;

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(25000),
      });

      if (!response.ok) return [];

      const data = await response.json();
      if (!data.elements?.length) return [];

      const seen = new Set<string>();
      return data.elements
        .filter((el: any) => {
          const name = el.tags?.name;
          if (!name || seen.has(name)) return false;
          seen.add(name);
          return true;
        })
        .map((el: any) => ({
          id: `osm_${el.id}`,
          companyName: el.tags.name,
          address: el.tags['addr:full'] || [el.tags['addr:street'], el.tags['addr:city'], el.tags['addr:state']].filter(Boolean).join(', ') || undefined,
          city: el.tags['addr:city'],
          state: el.tags['addr:state'],
          zip: el.tags['addr:postcode'],
          latitude: el.lat || el.center?.lat,
          longitude: el.lon || el.center?.lon,
          notes: `Asset: ${el.tags.industrial || el.tags.amenity || el.tags.man_made || el.tags.office || 'Infrastructure'}`,
          hasRegulatoryPermit: true,
          source: this.name,
          status: 'NOT_CONTACTED' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
    } catch (error) {
      console.warn('[OverpassProvider] Asset query failed:', error);
      return [];
    }
  }
}
