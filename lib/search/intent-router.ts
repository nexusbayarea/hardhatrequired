import { Company, FitType } from '@/types/company';

export const MIN_RESULTS = 5;
export const MIN_CONFIDENCE = 70;

const NICHE_VERTICALS = new Set([
  'slurry_processing', 'asbestos_abatement', 'industrial_wastewater',
  'marine_construction', 'trench_shoring', 'hydro_excavation',
  'stormwater_compliance', 'scrap_metal', 'hazardous_soil_removal',
  'concrete', 'wind_energy',
]);

const MAINSTREAM_VERTICALS = new Set([
  'hvac_balance', 'fire_sprinkler', 'fire_extinguisher',
  'generator_testing', 'commercial_roofing', 'elevator_inspection',
  'backflow_testing', 'kitchen_exhaust', 'grease_trap',
  'tank_testing',
]);

export type NicheLevel = 'mainstream' | 'niche' | 'industrial';

export interface StageDecision {
  runStage2: boolean;
  runStage3: boolean;
  reason: string;
}

export interface ConfidenceAssessment {
  avgScore: number;
  count: number;
  nicheLevel: NicheLevel;
  decision: StageDecision;
}

export function assessVerticalNiche(verticalId: string): NicheLevel {
  if (NICHE_VERTICALS.has(verticalId)) {
    return verticalId === 'asbestos_abatement' || verticalId === 'industrial_wastewater'
      ? 'industrial'
      : 'niche';
  }
  if (MAINSTREAM_VERTICALS.has(verticalId)) return 'mainstream';
  return 'niche';
}

export function evaluateStageDecision(
  verticalId: string,
  resultsCount: number,
  avgConfidence: number
): StageDecision {
  const niche = assessVerticalNiche(verticalId);

  if (resultsCount >= MIN_RESULTS && avgConfidence >= MIN_CONFIDENCE) {
    return {
      runStage2: false,
      runStage3: false,
      reason: `Strong results: ${resultsCount} results, ${avgConfidence} avg confidence`,
    };
  }

  if (niche === 'industrial' && (resultsCount < MIN_RESULTS || avgConfidence < MIN_CONFIDENCE)) {
    return {
      runStage2: true,
      runStage3: true,
      reason: `Industrial vertical with weak results: ${resultsCount} results, ${avgConfidence} confidence — triggering full agentic pipeline`,
    };
  }

  if (resultsCount < MIN_RESULTS) {
    return {
      runStage2: true,
      runStage3: avgConfidence < 40,
      reason: `Low result count (${resultsCount}) — running stage 2${avgConfidence < 40 ? ' + stage 3 (very weak)' : ''}`,
    };
  }

  if (avgConfidence < MIN_CONFIDENCE) {
    return {
      runStage2: true,
      runStage3: avgConfidence < 50,
      reason: `Weak confidence (${avgConfidence}) — running stage 2${avgConfidence < 50 ? ' + stage 3' : ''}`,
    };
  }

  return {
    runStage2: false,
    runStage3: false,
    reason: 'No escalation needed',
  };
}

export function assessResults(results: Partial<Company>[]): { avgScore: number; avgConfidence: number } {
  if (!results.length) return { avgScore: 0, avgConfidence: 0 };
  let totalScore = 0;
  let totalConfidence = 0;
  for (const r of results) {
    totalScore += r.enrichmentScore || 0;
    totalConfidence += r.confidence || 0;
  }
  return {
    avgScore: Math.round(totalScore / results.length),
    avgConfidence: Math.round(totalConfidence / results.length),
  };
}

export function classifyFitType(
  company: Partial<Company>,
  verticalId: string
): FitType {
  if (company.source === 'regulatory_permit') {
    return 'REGULATORY_NODE';
  }
  if (company.isDisposalFacilityByCategory || verticalId.includes('disposal')) {
    return 'DISPOSAL_NODE';
  }
  if (company.hasRegulatoryPermit) {
    return 'REGULATORY_NODE';
  }
  if (company.source === 'apollo' || company.source?.includes('apollo')) {
    return 'INDIRECT_VENDOR';
  }
  if (company.naicsCodes?.length && company.enrichmentScore && company.enrichmentScore >= 60) {
    return 'DIRECT_OPERATOR';
  }
  return 'INDIRECT_VENDOR';
}
