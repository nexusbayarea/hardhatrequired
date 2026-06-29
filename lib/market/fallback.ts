import { Company, Contact } from '@/types/company';
import { logger } from '@/lib/logger';

export type ProviderResult<T> = { success: true; data: T } | { success: false; error: string };

export interface FallbackStrategy<T> {
  primary: () => Promise<T>;
  fallback: () => Promise<T>;
  onFallback?: (error: unknown) => void;
}

export async function withFallback<T>(strategy: FallbackStrategy<T>): Promise<T> {
  try {
    return await strategy.primary();
  } catch (err) {
    logger.warn('Primary provider failed, using fallback', {
      route: 'market/fallback',
      error: String(err)
    });
    strategy.onFallback?.(err);
    return strategy.fallback();
  }
}

export function googleFallback(): Partial<Company>[] {
  return [];
}

export function apolloFallback(company: Partial<Company>): { companyFields: Partial<Company>; contacts: Partial<Contact>[] } {
  return { companyFields: { source: `${company.source || 'unknown'}+fallback` }, contacts: [] };
}

export function geminiFallback(): { hasSignals: boolean; capabilitySummary: string } {
  return { hasSignals: false, capabilitySummary: '' };
}
