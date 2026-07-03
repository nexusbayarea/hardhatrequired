import { AhoCorasickTrie } from './trie';
import {
  CompiledOntology,
  OntologyMatch,
  OntologyEntityType,
  AliasMeta,
  MatchType,
} from './types';

export interface CompiledMatcher {
  trie: AhoCorasickTrie;
  aliasMap: Map<string, AliasMeta>;
}

export function compileMatcher(ontology: CompiledOntology): CompiledMatcher {
  const trie = new AhoCorasickTrie();
  const aliasMap = ontology.aliasMap;

  for (const [phrase] of aliasMap) {
    trie.add(phrase);
  }
  trie.build();

  return { trie, aliasMap };
}

export function matchText(
  text: string,
  matcher: CompiledMatcher,
  filterType?: OntologyEntityType,
): OntologyMatch[] {
  const matches = matcher.trie.search(text);
  const seen = new Set<string>();
  const results: OntologyMatch[] = [];

  for (const matchedAlias of matches) {
    const meta = matcher.aliasMap.get(matchedAlias.toLowerCase());
    if (!meta) continue;

    if (filterType && meta.entityType !== filterType) continue;

    const key = `${meta.canonicalId}:${meta.entityType}`;
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      canonicalId: meta.canonicalId,
      matchedAlias,
      weight: meta.weight,
      confidenceWeight: meta.confidenceWeight,
      entityType: meta.entityType,
      matchType: meta.matchType,
      source: meta.source,
    });
  }

  return results;
}

export function matchServices(
  text: string,
  matcher: CompiledMatcher,
): OntologyMatch[] {
  return matchText(text, matcher, 'service');
}

export function matchEquipment(
  text: string,
  matcher: CompiledMatcher,
): OntologyMatch[] {
  return matchText(text, matcher, 'equipment');
}

export function matchWaste(
  text: string,
  matcher: CompiledMatcher,
): OntologyMatch[] {
  return matchText(text, matcher, 'waste');
}

export function matchWasteTypes(text: string): string[] {
  const lower = text.toLowerCase();
  const waste: string[] = [];

  if (/asbestos|lead\s*paint|hazmat|hazardous\s+waste/i.test(lower)) {
    waste.push('hazardous');
  }
  if (/medical|biohazard|sharps|clinical\s+waste|pathological|regulated\s+medical/i.test(lower)) {
    waste.push('medical');
  }
  if (/slurry|concrete\s+washout/i.test(lower) && /disposal|recycling|reclaim|dewatering/i.test(lower)) {
    waste.push('slurry');
  }
  if (/contaminated\s+soil|petroleum|hydrocarbon|brownfield/i.test(lower)) {
    waste.push('contaminated_soil');
  }
  if (/wastewater|effluent|sludge|industrial\s+liquid/i.test(lower)) {
    waste.push('industrial_wastewater');
  }

  return waste;
}

const DISPOSAL_KEYWORDS = [
  'disposal', 'recycling', 'landfill', 'treatment', 'incineration',
  'remediation', 'dewatering', 'processing',
];

export function hasDisposalSignals(text: string): boolean {
  const lower = text.toLowerCase();
  return DISPOSAL_KEYWORDS.some(k => lower.includes(k));
}
