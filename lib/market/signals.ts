import { SignalLayers } from '@/types/config';
import { Company } from '@/types/company';

export class KeywordSignalExtractor {
  extract(
    text: string,
    signals: SignalLayers,
    equipmentKeywords: string[],
    company?: Partial<Company>
  ): {
    hasSignals: boolean;
    capabilitySummary: string;
    matchedSignals: string[];
    negativeHits: string[];
    signalSources: SignalSourceMap;
  } {
    const categoryText = (company?.googleCategorySignals || []).join(' ');
    const apolloText   = company?.apolloDescription || '';

    const fullNormalized = [text, categoryText, apolloText]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const baseNormalized = (text || '').toLowerCase();

    const matched    = new Set<string>();
    const negatives  = new Set<string>();
    const sources: SignalSourceMap = {};

    const recordSource = (term: string, source: SignalSource) => {
      if (!sources[term]) sources[term] = source;
    };

    for (const s of signals.primary) {
      const t = s.term.toLowerCase();
      if (fullNormalized.includes(t)) {
        matched.add(s.term);
        if (baseNormalized.includes(t)) {
          recordSource(s.term, 'name');
        } else if (categoryText.toLowerCase().includes(t)) {
          recordSource(s.term, 'google_category');
        } else {
          recordSource(s.term, 'apollo');
        }
      }
    }

    for (const s of signals.secondary) {
      const t = s.term.toLowerCase();
      if (fullNormalized.includes(t)) {
        matched.add(s.term);
        if (baseNormalized.includes(t)) {
          recordSource(s.term, 'name');
        } else if (categoryText.toLowerCase().includes(t)) {
          recordSource(s.term, 'google_category');
        } else {
          recordSource(s.term, 'apollo');
        }
      }
    }

    for (const keyword of equipmentKeywords) {
      const k = keyword.toLowerCase();
      if (fullNormalized.includes(k)) {
        matched.add(keyword);
        if (baseNormalized.includes(k)) {
          recordSource(keyword, 'name');
        } else if (categoryText.toLowerCase().includes(k)) {
          recordSource(keyword, 'google_category');
        } else {
          recordSource(keyword, 'apollo');
        }
      }
    }

    for (const s of signals.negative) {
      if (baseNormalized.includes(s.term.toLowerCase())) {
        negatives.add(s.term);
      }
    }

    const matchedArray = Array.from(matched);

    return {
      hasSignals: matched.size > 0,
      capabilitySummary: matchedArray.join(', '),
      matchedSignals: matchedArray,
      negativeHits: Array.from(negatives),
      signalSources: sources,
    };
  }
}

export type SignalSource = 'name' | 'google_category' | 'apollo';

export type SignalSourceMap = Record<string, SignalSource>;
