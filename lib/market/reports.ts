import { ReportingEngine, MarketReport } from '../../core/reporting';
export type { MarketReport };
import { Listing } from '../../schemas/listing';
import { Company } from '@/types/company';

export function generateMarketReport(name: string, companies: Company[]): MarketReport {
  const engine = new ReportingEngine();

  // Map Company to Listing
  const listings: Listing[] = companies.map(c => ({
    ...c,
    name: c.companyName || (c as any).name || 'Unknown',
    industry: (c as any).industry || '',
  } as unknown as Listing));

  return engine.generate(name, listings);
}
