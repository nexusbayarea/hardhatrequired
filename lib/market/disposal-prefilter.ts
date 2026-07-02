// ─── Disposal Mode Prefilter ──────────────────────────────────────────────────
//
// THE BUG IT FIXES:
//
//   adapter.ts line 254–267: the prefilter calls signalExtractor.extract()
//   against a company BEFORE Apollo runs. For disposal, this kills legitimate
//   facilities whose Google Places name is opaque ("Recology", "GreenWaste",
//   "Apex Environmental") because the name contains no disposal keyword.
//
//   In labor mode, an opaque name is a yellow flag.
//   In disposal mode, an opaque name is NORMAL — these are industrial facilities
//   named after their founders or brand, not their function.
//
// THE FIX:
//
//   Disposal prefilter uses three additional gates BEFORE falling back to
//   signal matching:
//
//     Gate 1 — Google Business Category match
//       If the company's googleCategorySignals contain a known disposal category
//       term, pass it through regardless of name.
//
//     Gate 2 — OSM source passthrough
//       Overpass results are already pre-filtered by tag set — if they came
//       from Overpass, they are disposal facilities by definition. Pass through.
//
//     Gate 3 — Known operator name match
//       If the company name contains a known national/regional operator name
//       (Recology, Clean Harbors, Republic Services, etc.), pass through.
//
//     Gate 4 — NAICS code match
//       If the company has a NAICS code in the disposal range, pass through.
//
//   Only AFTER all four gates fail do we fall back to keyword signal matching.
//   This ensures Apollo enrichment runs on all plausible candidates, not just
//   ones with obvious names.
// ─────────────────────────────────────────────────────────────────────────────

import { Company } from '@/types/company';
import { DISPOSAL_GOOGLE_TYPE_SIGNALS, getCategorySignalsForDisposal } from './disposal-signals';

// ── Gate 1: Google category signals ──────────────────────────────────────────
// These are the Google Places type[] values we know indicate disposal facilities.
// If the company already has categorySignals from the Google provider, check them.

const DISPOSAL_CATEGORY_TERMS = new Set<string>([
  'waste management service', 'waste disposal', 'recycling center',
  'material recovery', 'hazardous waste disposal', 'hazmat facility',
  'wastewater disposal', 'sewage treatment', 'waste removal', 'debris disposal',
  'sanitation', 'solid waste collection', 'garbage collection', 'solid waste',
  'landfill', 'solid waste disposal', 'transfer station', 'waste transfer',
  'environmental services', 'waste treatment', 'industrial waste',
  'biohazard', 'wastewater treatment',
]);

// ── Gate 2: OSM / Overpass source passthrough ─────────────────────────────────
const OVERPASS_SOURCES = new Set(['overpass', 'osm', 'overpass_osm']);

// ── Gate 3: Known operator names ──────────────────────────────────────────────
const KNOWN_DISPOSAL_OPERATORS = [
  'clean harbors', 'republic services', 'waste management', 'casella',
  'covanta', 'veolia', 'stericycle', 'us ecology', 'heritage crystal',
  'envirostar', 'recology', 'norcal waste', 'greenwaste', 'bay area recycling',
  'bay waste', 'golden gate disposal', 'santek', 'advanced disposal',
  'arrow disposal', 'lauber waste', 'aptus', 'waste connections',
  'waste industries', 'rumpke', 'sun disposal', 'allied waste',
  'enviroq', 'heritage environmental', 'clean earth', 'us ecology',
  'envirite', 'geochem', 'perma fix', 'chemical waste management',
  'envirocare', 'safety kleen', 'clean venture',
];

// ── Gate 4: NAICS codes for waste/disposal ────────────────────────────────────
// 5621xx = Waste Collection / Treatment / Remediation
const DISPOSAL_NAICS_PREFIXES = ['5621', '5622', '5629', '3825', '5511'];

// ── Main export: disposal-aware prefilter ─────────────────────────────────────

export interface DisposalPrefilterResult {
  pass: boolean;
  reason: string;
  gate: 'osm_source' | 'category_signal' | 'known_operator' | 'naics' | 'keyword_signal' | 'failed';
}

export function disposalPrefilter(
  record: Partial<Company>,
  hasKeywordSignals: boolean
): DisposalPrefilterResult {

  // Gate 2: OSM/Overpass results are pre-tagged as disposal — always pass
  if (record.source && OVERPASS_SOURCES.has(record.source.toLowerCase())) {
    return { pass: true, reason: 'Overpass OSM source (pre-classified disposal facility)', gate: 'osm_source' };
  }

  // Gate 1: Google category signals
  if (record.googleCategorySignals?.length) {
    const categoryText = record.googleCategorySignals.join(' ').toLowerCase();
    for (const term of DISPOSAL_CATEGORY_TERMS) {
      if (categoryText.includes(term)) {
        return { pass: true, reason: `Google category match: "${term}"`, gate: 'category_signal' };
      }
    }
  }

  // Also check notes field which contains the raw Google type context
  if (record.notes) {
    const notesLower = record.notes.toLowerCase();
    for (const term of DISPOSAL_CATEGORY_TERMS) {
      if (notesLower.includes(term)) {
        return { pass: true, reason: `Google notes category match: "${term}"`, gate: 'category_signal' };
      }
    }
  }

  // Gate 3: Known operator name
  const nameLower = (record.companyName || '').toLowerCase();
  for (const operator of KNOWN_DISPOSAL_OPERATORS) {
    if (nameLower.includes(operator)) {
      return { pass: true, reason: `Known disposal operator: "${operator}"`, gate: 'known_operator' };
    }
  }

  // Gate 4: NAICS code match
  if (record.naicsCodes?.length) {
    for (const code of record.naicsCodes) {
      if (DISPOSAL_NAICS_PREFIXES.some(prefix => String(code).startsWith(prefix))) {
        return { pass: true, reason: `NAICS disposal code: ${code}`, gate: 'naics' };
      }
    }
  }

  // Gate 5: Keyword signal match (the only gate the old code had)
  if (hasKeywordSignals) {
    return { pass: true, reason: 'Keyword signal match', gate: 'keyword_signal' };
  }

  return {
    pass: false,
    reason: 'No disposal signals found in name, category, operator list, NAICS, or keywords',
    gate: 'failed',
  };
}

// ── Wiring instructions for adapter.ts ───────────────────────────────────────
//
// In adapter.ts, replace lines ~253–267 (the disposal prefilter block):
//
// BEFORE:
//   const precheck = this.signalExtractor.extract(precheckText, signalsToCheck, ...);
//   if (!precheck.hasSignals) {
//     console.log(`[PREFILTER] ${record.companyName} — skipped before Apollo (no disposal signals)`);
//     continue;
//   }
//   if (precheck.confidence === 'low') { ... }
//   toEnrich.push({ record, base });
//
// AFTER:
//   const precheckText = `${record.companyName || ''} ${record.notes || ''} ${record.address || ''}`;
//   if (isDisposalMode) {
//     const precheck = this.signalExtractor.extract(precheckText, signalsToCheck, config.equipmentKeywords, record);
//     const gate = disposalPrefilter(record, precheck.hasSignals);
//     if (!gate.pass) {
//       console.log(`[DISPOSAL_PREFILTER] ${record.companyName} — dropped (${gate.reason})`);
//       continue;
//     }
//     console.log(`[DISPOSAL_PREFILTER] ${record.companyName} — passed via ${gate.gate} (${gate.reason})`);
//   } else {
//     // existing labor prefilter logic unchanged
//     const precheck = this.signalExtractor.extract(precheckText, signalsToCheck, config.equipmentKeywords, record);
//     if (!precheck.hasSignals) { ... }
//   }
//   toEnrich.push({ record, base });
