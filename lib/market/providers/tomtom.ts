import { Company } from '@/types/company';
import { DiscoveryProvider, DiscoveryParams, getStateFromZip } from './base';

export class TomTomProvider implements DiscoveryProvider {
  name = 'tomtom_discovery';
  private apiKey = process.env.TOM_TOM_API;

  async search(params: DiscoveryParams): Promise<Partial<Company>[]> {
    if (!this.apiKey || !params.lat || !params.lng) {
      if (!this.apiKey) console.warn('[TomTomProvider] TOM_TOM_API key is missing.');
      return [];
    }

    const radiusMeters = Math.min(Math.round((params.radius || 50) * 1609.34), 50000);
    const queries = params.searchQueries?.length
      ? params.searchQueries
      : [params.verticalConfig?.industryName || 'business'];

    const seen = new Set<string>();
    const results: Partial<Company>[] = [];

    for (const rawQuery of queries) {
      const query = encodeURIComponent(rawQuery);
      const url = `https://api.tomtom.com/search/2/poiSearch/${query}.json?key=${this.apiKey}&lat=${params.lat}&lon=${params.lng}&radius=${radiusMeters}&limit=100`;

      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) continue;

        const data = await response.json();
        if (!data.results?.length) continue;

        for (const poi of data.results) {
          const name = poi.poi?.name || 'Unknown Business';
          if (seen.has(name)) continue;
          seen.add(name);
          results.push({
            id: `tt_${poi.id}`,
            companyName: name,
            address: poi.address?.freeformAddress,
            city: poi.address?.localName,
            state: poi.address?.countrySubdivision,
            zip: poi.address?.extendedPostalCode || poi.address?.postalCode,
            phone: poi.poi?.phone,
            website: poi.poi?.url,
            latitude: poi.position?.lat,
            longitude: poi.position?.lon,
            distanceMiles: poi.dist ? Math.round((poi.dist / 1609.34) * 10) / 10 : undefined,
            notes: poi.poi?.categories?.join(', '),
            source: this.name,
            status: 'NOT_CONTACTED' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn(`[TomTomProvider] POI search failed for "${rawQuery}":`, error);
      }
    }

    return results;
  }
}
