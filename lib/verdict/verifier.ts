import type { VerdictEntry, VerdictValue, HowReached } from './types';
import { scrapeCompanyWebsite } from '@/lib/market/workers/enrichmentScraper';

interface VerifierInput {
  id: string;
  companyName: string;
  website: string | null;
  source: string;
  score: number;
  grade: string;
  fitType: string;
  matchedSignals?: string[];
}

const RESIDENTIAL_INDICATORS = [
  'homeowner', 'residential', 'home repair', 'house', 'apartment', 'condo',
  'clogged toilet', 'kitchen sink', 'basement', 'garage door',
  'lawn care', 'landscaping', 'pool cleaning', 'carpet cleaning',
  'house cleaning', 'moving', 'pest control',
];

const DIRECTORY_INDICATORS = [
  'yellow pages', 'yp.com', 'bbb.org', 'merchant circle', 'nextdoor',
  'angies list', 'angi.com', 'thumbtack', 'porch.com', 'homeadvisor',
  'find a contractor', 'contractor directory', 'get quotes',
];

export async function verifyCompany(
  company: VerifierInput,
  verticalKeywords: string[],
  negativeKeywords: string[]
): Promise<Partial<VerdictEntry>> {
  if (company.source === 'regulatory_permit') {
    return {
      verdict: 'good' as VerdictValue,
      howReached: 'regulatory_permit' as HowReached,
      reason: 'Found via regulatory permit records — government-verified',
      evidence: ['regulatory_permit'],
    };
  }

  if (!company.website) {
    const hasSignalMatch = (company.matchedSignals?.length ?? 0) > 0;
    if (hasSignalMatch) {
      return {
        verdict: 'uncertain' as VerdictValue,
        howReached: 'signal_only' as HowReached,
        reason: 'No website to verify; signal match only',
        evidence: company.matchedSignals ?? [],
      };
    }
    return {
      verdict: 'bad' as VerdictValue,
      howReached: 'website_unreachable' as HowReached,
      reason: 'No website and no signal match',
      evidence: [],
    };
  }

  const scrapeResult = await scrapeCompanyWebsite(company.website, verticalKeywords, negativeKeywords);

  if (!scrapeResult.rawText) {
    return {
      verdict: 'uncertain' as VerdictValue,
      howReached: 'website_unreachable' as HowReached,
      reason: 'Could not access website content',
      evidence: [],
    };
  }

  const pageText = scrapeResult.rawText.toLowerCase();

  const isDirectory = DIRECTORY_INDICATORS.some(ind => pageText.includes(ind));
  if (isDirectory) {
    return {
      verdict: 'bad' as VerdictValue,
      howReached: 'website_mismatch' as HowReached,
      reason: 'Website is a directory/aggregator site, not the company itself',
      evidence: DIRECTORY_INDICATORS.filter(ind => pageText.includes(ind)),
    };
  }

  const isResidential = RESIDENTIAL_INDICATORS.some(ind => pageText.includes(ind));

  if (scrapeResult.matchedKeywords.length > 0) {
    if (isResidential && negativeKeywords.some(nk => pageText.includes(nk.toLowerCase()))) {
      return {
        verdict: 'bad' as VerdictValue,
        howReached: 'website_mismatch' as HowReached,
        reason: 'Website matches some keywords but primarily residential',
        evidence: [...scrapeResult.matchedKeywords, ...RESIDENTIAL_INDICATORS.filter(ind => pageText.includes(ind))],
      };
    }

    return {
      verdict: 'good' as VerdictValue,
      howReached: 'website_confirmed_signal' as HowReached,
      reason: `Website confirmed: ${scrapeResult.matchedKeywords.join(', ')}`,
      evidence: scrapeResult.matchedKeywords,
    };
  }

  if (scrapeResult.isMismatch) {
    return {
      verdict: 'bad' as VerdictValue,
      howReached: 'website_mismatch' as HowReached,
      reason: 'Website shows only negative keywords, no matching services',
      evidence: negativeKeywords.filter(nk => pageText.includes(nk.toLowerCase())),
    };
  }

  return {
    verdict: 'uncertain' as VerdictValue,
    howReached: 'website_unreachable' as HowReached,
    reason: 'Website reached but no matching keywords found',
    evidence: scrapeResult.matchedKeywords,
  };
}
