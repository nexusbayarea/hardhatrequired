import { Company } from '@/types/company';
import { VerticalConfig } from '@/types/config';

export interface DiscoveryParams {
  zip: string;
  vertical: string;
  lat?: number;
  lng?: number;
  radius?: number;
  searchQueries?: string[];
  verticalConfig?: VerticalConfig;
}

export interface DiscoveryProvider {
  name: string;
  search(params: DiscoveryParams): Promise<Partial<Company>[]>;
}

export function getStateFromZip(zip: string): string {
  const prefix = parseInt(zip.substring(0, 3), 10);
  if (prefix >= 900 && prefix <= 961) return 'CA';
  if (prefix >= 750 && prefix <= 799) return 'TX';
  if (prefix >= 320 && prefix <= 349) return 'FL';
  if (prefix >= 100 && prefix <= 149) return 'NY';
  return 'CA';
}

export interface BaseSearchProvider {
  name: string;
  search?(filters: any): Promise<Partial<Company>[]>;
  searchWithNegatives?(query: string, negativeKeywords: string[]): Promise<Partial<Company>[]>;
}

export interface BaseEnrichmentProvider {
  name: string;
  enrich(company: Company): Promise<Partial<Company>>;
}

export interface SignalScanner {
  name: string;
  scanForSignals(website: string | undefined, equipmentKeywords: string[]): Promise<{
    hasSignals: boolean;
    extractedNotes: string;
  }>;
}
