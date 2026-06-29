import { DiscoveryParams } from '../base';
import { Company } from '@/types/company';

export interface ScraperResult {
  success: boolean;
  records: Partial<Company>[];
  latencyMs: number;
  error?: string;
}

export interface StateScraper {
  stateCode: string;
  supportedVerticals: string[];
  scrape(params: DiscoveryParams): Promise<ScraperResult>;
}
