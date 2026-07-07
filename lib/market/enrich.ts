import { Company } from '@/types/company';
import { EnrichmentEngine } from '../../core/enrichment';
import { Listing } from '../../schemas/listing';

export async function enrichCompanyData(company: Company): Promise<Partial<Company>> {
  const engine = new EnrichmentEngine();

  const listing = {
    ...company,
    name: company.companyName || (company as any).name || 'Unknown',
    industry: (company as any).industry || '',
  } as unknown as Listing;

  const result = await engine.enrich(listing);

  return result as Partial<Company>;
}
