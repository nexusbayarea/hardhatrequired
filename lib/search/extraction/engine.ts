import { FitType } from '@/types/company';
import { CanonicalEntity, ExtractionPayload, EQUIPMENT_ONTOLOGY, getServiceSignals } from './ontology';

// ── Layer 1: Direct regex matching ──────────────────────────────────────────
// Score: 95 for exact phrase match

function matchInText(text: string, aliases: string[]): string | null {
  const lower = text.toLowerCase();
  // Sort by length desc so longer, more specific phrases match first
  const sorted = [...aliases].sort((a, b) => b.length - a.length);
  return sorted.find(alias => lower.includes(alias)) || null;
}

// ── Layer 2: Ontology matching ───────────────────────────────────────────────
// Score: 90 for ontology-validated match

export interface MatchResult {
  id: string;
  matchedAlias: string;
  confidence: number;
}

export function runDeterministicExtraction(
  cleanText: string,
  vertical: string,
): ExtractionPayload {
  const lower = cleanText.toLowerCase();
  const services: MatchResult[] = [];
  const equipment: MatchResult[] = [];
  const wasteTypes: string[] = [];

  // ── Match services from vertical ontology ───────────────────────────
  const serviceSignals = getServiceSignals(vertical);
  for (const [canonicalId, aliases] of Object.entries(serviceSignals)) {
    const matched = matchInText(lower, aliases);
    if (matched) {
      services.push({ id: canonicalId, matchedAlias: matched, confidence: 95 });
    }
  }

  // ── Match equipment from global ontology ────────────────────────────
  for (const [canonicalId, aliases] of Object.entries(EQUIPMENT_ONTOLOGY)) {
    const matched = matchInText(lower, aliases);
    if (matched) {
      equipment.push({ id: canonicalId, matchedAlias: matched, confidence: 95 });
    }
  }

  // ── Waste type detection (disposal-specific terms) ─────────────────
  if (/asbestos|lead\s*paint|hazmat|hazardous\s+waste/i.test(lower)) {
    wasteTypes.push('hazardous');
  }
  if (/medical|biohazard|sharps|clinical\s+waste|pathological|regulated\s+medical/i.test(lower)) {
    wasteTypes.push('medical');
  }
  if (/slurry|concrete\s+washout/i.test(lower) && /disposal|recycling|reclaim|dewatering/i.test(lower)) {
    wasteTypes.push('slurry');
  }
  if (/contaminated\s+soil|petroleum|hydrocarbon|brownfield/i.test(lower)) {
    wasteTypes.push('contaminated_soil');
  }
  if (/wastewater|effluent|sludge|industrial\s+liquid/i.test(lower)) {
    wasteTypes.push('industrial_wastewater');
  }

  // ── Determine fit type ─────────────────────────────────────────────
  let fitType: FitType | null = null;
  if (services.length >= 2 || equipment.length >= 2) {
    fitType = 'DIRECT_OPERATOR';
  } else if (wasteTypes.length > 0) {
    fitType = 'DISPOSAL_NODE';
  } else if (services.length > 0) {
    fitType = 'INDIRECT_VENDOR';
  }

  // ── Overall confidence ─────────────────────────────────────────────
  const totalHits = services.length + equipment.length;
  const baseConfidence = totalHits > 0
    ? Math.min(95, 60 + totalHits * 10)
    : 0;

  return {
    services: services.map(s => ({ id: s.id, confidence: s.confidence })),
    equipment: equipment.map(e => ({ id: e.id, confidence: e.confidence })),
    wasteTypes,
    fitType,
    confidence: baseConfidence,
  };
}

// ── Disposal-specific signal detection ───────────────────────────────────────

const DISPOSAL_KEYWORDS = [
  'disposal', 'recycling', 'landfill', 'treatment', 'incineration',
  'remediation', 'dewatering', 'processing',
];

export function hasDisposalSignals(text: string): boolean {
  const lower = text.toLowerCase();
  return DISPOSAL_KEYWORDS.some(k => lower.includes(k));
}
