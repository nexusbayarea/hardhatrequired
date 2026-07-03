import { OntologyMatch, OntologyRelationship, ConstraintResult } from './types';

/**
 * Truth engine that uses ontology_relationships to sanity-check extractions.
 *
 * If the system flags 'slurry_processing' but fails to locate any matching
 * ontological requirements (like 'vacuum_truck' or 'filter_press'), the
 * confidence score is penalized because the entity lacks the infrastructure
 * to actually perform the detected service.
 */

export interface ConstraintConfig {
  relationships: OntologyRelationship[];
  requiredRelations: string[];  // e.g. ['REQUIRES', 'NEEDS']
  penaltyPerMissing: number;    // confidence points to subtract per missing dep
  minDepsToSkip: number;        // if fewer deps than this, skip validation
}

const DEFAULT_CONFIG: ConstraintConfig = {
  relationships: [],
  requiredRelations: ['REQUIRES', 'NEEDS', 'DEPENDS_ON'],
  penaltyPerMissing: 30,
  minDepsToSkip: 1,
};

export function validateExtraction(
  matchedCanonicalIds: string[],
  config: ConstraintConfig = DEFAULT_CONFIG,
): ConstraintResult {
  const missingDependencies: string[] = [];

  for (const matchedId of matchedCanonicalIds) {
    // Find all REQUIRES relationships where matchedId is the source
    const requirements = config.relationships.filter(
      r =>
        r.sourceCanonicalId === matchedId &&
        config.requiredRelations.includes(r.relation),
    );

    if (requirements.length < config.minDepsToSkip) continue;

    for (const req of requirements) {
      if (!matchedCanonicalIds.includes(req.targetCanonicalId)) {
        missingDependencies.push(
          `${matchedId} ${req.relation} ${req.targetCanonicalId}`,
        );
      }
    }
  }

  const valid = missingDependencies.length === 0;
  const confidencePenalty = valid
    ? 0
    : Math.min(100, missingDependencies.length * config.penaltyPerMissing);

  return {
    valid,
    missingDependencies,
    confidencePenalty,
    reason: valid
      ? 'All ontological constraints satisfied'
      : `Missing required dependencies: ${missingDependencies.join(', ')}`,
  };
}

/**
 * Build a constraint audit for Stage 3 deep scrape results.
 * Returns adjusted confidence after applying any penalties.
 */
export function auditStage3Extraction(
  extractedServiceIds: string[],
  extractedEquipmentIds: string[],
  relationships: OntologyRelationship[],
  baseConfidence: number,
): { adjustedConfidence: number; constraintResult: ConstraintResult } {
  const allIds = [...extractedServiceIds, ...extractedEquipmentIds];

  const constraintResult = validateExtraction(allIds, {
    relationships,
    requiredRelations: ['REQUIRES', 'NEEDS', 'DEPENDS_ON'],
    penaltyPerMissing: 30,
    minDepsToSkip: 1,
  });

  const adjustedConfidence = Math.max(
    0,
    baseConfidence - constraintResult.confidencePenalty,
  );

  return { adjustedConfidence, constraintResult };
}
