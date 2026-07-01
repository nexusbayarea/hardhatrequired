export interface ScoringWeights {
  distanceWeight: number;
  contactEnrichmentWeight: number;
  assetSignalWeight: number;
}

export interface ContactScoringWeights {
  hasWebsite: number;
  hasPhone: number;
  hasContactEmail: number;
  hasPhysicalAddress: number;
  distanceFactor: number;
}

export interface WeightedSignal {
  term: string;
  weight: number;
}

export interface SignalLayers {
  primary: WeightedSignal[];
  secondary: WeightedSignal[];
  negative: WeightedSignal[];
}

export interface LaborMatrixNode {
  labor: string;
  disposal: string;
}

export interface VerticalConfig {
  id: string;
  organizationId?: string;
  slug: string;
  industryName: string;
  targetNaicsCodes: string[];
  equipmentKeywords: string[];
  negativeKeywords: string[];
  searchQueries: string[];
  verticalSignals?: string[];
  signals: SignalLayers;
  scoringWeights: ContactScoringWeights;
  baseScoringWeights: ScoringWeights;
  createdAt: string;
  matrixNode?: LaborMatrixNode;
}
