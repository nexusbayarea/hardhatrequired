import { FitType } from '@/types/company';

export interface VerticalRule {
  /** Minimum candidates before we consider L2 sufficient */
  minResults: number;
  /** Expanding search rings in miles */
  searchRings: number[];
  /** Minimum average confidence to skip scrape */
  minConfidence: number;
  /** Require at least one DIRECT_OPERATOR or DISPOSAL_NODE? */
  requireDirectOperator: boolean;
}

export type VerticalId = string;

const VERTICAL_RULES: Record<VerticalId, VerticalRule> = {
  // ── Dense metro verticals ──────────────────────────────────────────
  slurry_processing:     { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  concrete:              { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  hvac_balance:          { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  fire_sprinkler:        { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  fire_extinguisher:     { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  commercial_roofing:    { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  backflow_testing:      { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  grease_trap:           { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  kitchen_exhaust:       { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  generator_testing:     { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  elevator_inspection:   { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  scrap_metal:           { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  tank_testing:          { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  stormwater_compliance: { minResults: 5,  searchRings: [25, 50],       minConfidence: 70, requireDirectOperator: true },
  hydro_excavation:      { minResults: 5,  searchRings: [25, 50, 100],  minConfidence: 65, requireDirectOperator: true },

  // ── Sparse niche verticals ─────────────────────────────────────────
  marine_construction:   { minResults: 2,  searchRings: [50, 100, 250], minConfidence: 60, requireDirectOperator: false },
  wind_infrastructure:   { minResults: 2,  searchRings: [50, 100, 250], minConfidence: 60, requireDirectOperator: false },
  hazardous_soil_remediation: { minResults: 3, searchRings: [25, 100, 200], minConfidence: 60, requireDirectOperator: false },
  industrial_wastewater: { minResults: 3,  searchRings: [25, 100, 200], minConfidence: 65, requireDirectOperator: false },
  asbestos_abatement:    { minResults: 3,  searchRings: [25, 50, 100],  minConfidence: 65, requireDirectOperator: false },
  medical_waste:         { minResults: 3,  searchRings: [25, 50, 100],  minConfidence: 65, requireDirectOperator: false },
  dewatering:            { minResults: 3,  searchRings: [25, 50, 100],  minConfidence: 65, requireDirectOperator: false },
};

const DEFAULT_RULE: VerticalRule = {
  minResults: 5,
  searchRings: [25, 50],
  minConfidence: 70,
  requireDirectOperator: true,
};

export function getVerticalRule(verticalId: string): VerticalRule {
  return VERTICAL_RULES[verticalId] || DEFAULT_RULE;
}

export function shouldTriggerScrape(
  verticalId: string,
  candidates: { confidenceScore: number; fitType?: FitType }[],
): boolean {
  const rule = getVerticalRule(verticalId);

  if (candidates.length < rule.minResults) return true;

  const avgConfidence =
    candidates.reduce((sum, c) => sum + c.confidenceScore, 0) / candidates.length;
  if (avgConfidence < rule.minConfidence) return true;

  if (rule.requireDirectOperator) {
    const hasDirect = candidates.some(
      c => c.fitType === 'DIRECT_OPERATOR' || c.fitType === 'DISPOSAL_NODE',
    );
    if (!hasDirect) return true;
  }

  return false;
}
