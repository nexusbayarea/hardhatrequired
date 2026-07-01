import type { VerticalConfig } from '@/types/config';

const NOW = new Date().toISOString();

const SHARED_SCORING_WEIGHTS = {
  hasWebsite: 15, hasPhone: 20, hasContactEmail: 10, hasPhysicalAddress: 10, distanceFactor: 10,
};

export const FIRE_EXTINGUISHER_LEGACY: VerticalConfig = {
  id: 'fire_extinguisher', slug: 'fire_extinguisher',
  industryName: 'Fire Extinguisher Inspection & Filling',
  searchQueries: ['fire extinguisher service', 'fire extinguisher inspection', 'fire extinguisher recharge', 'commercial fire protection', 'fire safety equipment'],
  targetNaicsCodes: ['423990', '561621', '811490'],
  equipmentKeywords: ['hydrostatic test unit', 'extinguisher fill station', 'dry chemical refill', 'CO2 fill manifold', 'pressure gauge'],
  negativeKeywords: ['buy smoke detector home', 'extinguisher mount bracket amazon', 'fire protection engineering degree', 'fireplace', 'firewood', 'fire pit', 'fire alarm installation', 'fire sprinkler', 'smoke detector', 'security system'],
  signals: {
    primary: [{ term: 'fire extinguisher', weight: 30 }, { term: 'recharge', weight: 30 }, { term: 'hydrotesting', weight: 30 }, { term: 'fire', weight: 15 }],
    secondary: [{ term: 'NFPA 10', weight: 10 }, { term: 'inspection tag', weight: 10 }, { term: 'safety inspection', weight: 10 }, { term: 'dry chemical', weight: 10 }, { term: 'CO2 refill', weight: 10 }, { term: 'extinguisher service', weight: 10 }],
    negative: [{ term: 'home extinguisher', weight: -30 }, { term: 'fireplace', weight: -30 }, { term: 'firewood', weight: -30 }, { term: 'smoke detector', weight: -30 }],
  },
  scoringWeights: SHARED_SCORING_WEIGHTS,
  baseScoringWeights: { distanceWeight: 15, contactEnrichmentWeight: 10, assetSignalWeight: 20 },
  createdAt: NOW,
};
