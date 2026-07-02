import { StateScraper, ScraperResult } from './types';
import { DiscoveryParams } from '../base';
import { Company } from '@/types/company';
import { haversineDistance } from '@/lib/geo';
import { searchRegulatoryFacilities, getAvailableVerticals } from '@/lib/regulatory/provider';

export class CalRecycleScraper implements StateScraper {
  stateCode = 'CA';
  supportedVerticals = [...getAvailableVerticals()];

  async scrape(params: DiscoveryParams): Promise<ScraperResult> {
    const start = Date.now();
    const { vertical, lat, lng, zip } = params;

    if (!this.supportedVerticals.includes(vertical)) {
      return { success: true, records: [], latencyMs: Date.now() - start };
    }

    try {
      const radiusMiles = 200;
      const facilities = await searchRegulatoryFacilities({
        vertical,
        lat,
        lng,
        radiusMiles,
        zip,
      });

      const records: Partial<Company>[] = facilities.map(f => ({
        id: `reg-ca-${f.swisNumber?.toLowerCase().replace(/[^a-z0-9]/g, '-') || f.id}`,
        companyName: f.facilityName,
        address: f.streetAddress,
        city: f.city,
        state: f.state,
        zip: f.zip,
        latitude: f.latitude,
        longitude: f.longitude,
        phone: undefined,
        website: undefined,
        source: 'regulatory_permit',
        permits: [{
          agency: 'CalRecycle',
          permitType: 'SWIS',
          permitNumber: f.swisNumber || 'UNKNOWN',
          status: f.permitStatus || 'Active',
        }],
        notes: `CalRecycle SWIS Permit #${f.swisNumber}. ${f.activities?.slice(0, 3).join(', ') || ''}`,
        distanceMiles: lat && lng && f.latitude && f.longitude
          ? Math.round(haversineDistance(lat, lng, f.latitude, f.longitude) * 10) / 10
          : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return { success: true, records, latencyMs: Date.now() - start };
    } catch (err) {
      console.warn('[CalRecycleScraper] Ingestion query failed, returning empty:', err);
      return { success: false, records: [], latencyMs: Date.now() - start };
    }
  }
}
