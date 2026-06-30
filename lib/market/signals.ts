import { SignalLayers } from '@/types/config';
import { Company } from '@/types/company';

export type SignalSource = 'name' | 'google_category' | 'apollo';
export type SignalSourceMap = Record<string, SignalSource[]>;

export interface SignalResult {
  hasSignals: boolean;
  capabilitySummary: string;
  matchedSignals: string[];
  negativeHits: string[];
  signalSources: SignalSourceMap;
  confidence: 'low' | 'medium' | 'high';
}

export class KeywordSignalExtractor {
  extract(
    text: string,
    signals: SignalLayers,
    equipmentKeywords: string[],
    company?: Partial<Company>
  ): SignalResult {
    const categoryText = (company?.googleCategorySignals || []).join(' ');
    const apolloText = company?.apolloDescription || '';

    const baseNormalized = (text || '').toLowerCase();
    const categoryNormalized = categoryText.toLowerCase();
    const apolloNormalized = apolloText.toLowerCase();

    const fullNormalized = [baseNormalized, categoryNormalized, apolloNormalized]
      .filter(Boolean)
      .join(' ');

    const matched = new Set<string>();
    const negatives = new Set<string>();
    const sources: SignalSourceMap = {};

    const hasSignal = (target: string, term: string): boolean => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(target);
    };

    const addSource = (term: string, source: SignalSource) => {
      if (!sources[term]) sources[term] = [];
      if (!sources[term].includes(source)) {
        sources[term].push(source);
      }
    };

    const processSignal = (term: string) => {
      if (!hasSignal(fullNormalized, term)) return;
      matched.add(term);
      if (hasSignal(baseNormalized, term)) {
        addSource(term, 'name');
      }
      if (hasSignal(categoryNormalized, term)) {
        addSource(term, 'google_category');
      }
      if (hasSignal(apolloNormalized, term)) {
        addSource(term, 'apollo');
      }
    };

    for (const signal of signals.primary) {
      processSignal(signal.term);
    }

    for (const signal of signals.secondary) {
      processSignal(signal.term);
    }

    const uniqueEquipment = [...new Set(equipmentKeywords)];
    for (const keyword of uniqueEquipment) {
      processSignal(keyword);
    }

    for (const signal of signals.negative) {
      if (hasSignal(baseNormalized, signal.term)) {
        negatives.add(signal.term);
      }
    }

    const matchedArray = Array.from(matched);

    const confidence: 'low' | 'medium' | 'high' =
      matchedArray.length >= 4
        ? 'high'
        : matchedArray.length >= 2
        ? 'medium'
        : 'low';

    const capabilitySummary =
      matchedArray.length > 0
        ? matchedArray
            .map(term => `${term} (${sources[term]?.join('|') || 'unknown'})`)
            .join(', ')
        : '';

    return {
      hasSignals: matchedArray.length > 0,
      capabilitySummary,
      matchedSignals: matchedArray,
      negativeHits: Array.from(negatives),
      signalSources: sources,
      confidence,
    };
  }
}
