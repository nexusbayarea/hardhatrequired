import { FitType } from '@/types/company';
import { dbOntology, EQUIPMENT_ONTOLOGY, getServiceSignals, ExtractionPayload } from './ontology';
import { matchServices, matchEquipment, matchWasteTypes } from '@/lib/ontology/matcher';
import { OntologyMatch } from '@/lib/ontology/types';

// ── Layer 1+2: Triebacked ontology matching ────────────────────────────────
// Uses Aho-Corasick trie via DbBackedOntology (DB + Redis cache).
// Falls back to hardcoded dictionaries if DB unavailable.

export interface MatchResult {
  id: string;
  matchedAlias: string;
  confidence: number;
}

export async function runDeterministicExtractionAsync(
  cleanText: string,
  vertical: string,
): Promise<ExtractionPayload> {
  const lower = cleanText.toLowerCase();
  const wasteTypes = matchWasteTypes(cleanText);

  let services: OntologyMatch[] = [];
  let equipment: OntologyMatch[] = [];

  try {
    const matcher = await dbOntology.getMatcher();
    services = matchServices(lower, matcher);
    equipment = matchEquipment(lower, matcher);
  } catch {
    // Fallback to synchronous hardcoded version
    return runDeterministicExtraction(cleanText, vertical);
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
    services: services.map(s => ({ id: s.canonicalId, confidence: 95 })),
    equipment: equipment.map(e => ({ id: e.canonicalId, confidence: 95 })),
    wasteTypes,
    fitType,
    confidence: baseConfidence,
  };
}

// ── Synchronous fallback (kept for backward compat, uses hardcoded dicts) ────

export function runDeterministicExtraction(
  cleanText: string,
  vertical: string,
): ExtractionPayload {
  const lower = cleanText.toLowerCase();
  const services: MatchResult[] = [];
  const equipment: MatchResult[] = [];
  const wasteTypes: string[] = matchWasteTypes(cleanText);

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

function matchInText(text: string, aliases: string[]): string | null {
  const lower = text.toLowerCase();
  const sorted = [...aliases].sort((a, b) => b.length - a.length);
  return sorted.find(alias => lower.includes(alias)) || null;
}
