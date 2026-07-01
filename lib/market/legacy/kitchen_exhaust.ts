import type { VerticalConfig } from '@/types/config';

const NOW = new Date().toISOString();

const SHARED_SCORING_WEIGHTS = {
  hasWebsite: 15, hasPhone: 20, hasContactEmail: 10, hasPhysicalAddress: 10, distanceFactor: 10,
};

export const KITCHEN_EXHAUST_LEGACY: VerticalConfig = {
  id: 'kitchen_exhaust', slug: 'kitchen_exhaust',
  industryName: 'Commercial Kitchen Hood Degreasing',
  searchQueries: ['restaurant hood cleaning', 'commercial kitchen cleaning', 'hood exhaust cleaning', 'kitchen degreasing service', 'hood suppression system'],
  targetNaicsCodes: ['561790', '926150'],
  equipmentKeywords: ['pressure washer', 'hood filter cart', 'exhaust fan cleaning tool', 'grease removal system', 'duct cleaning kit'],
  negativeKeywords: ['residential kitchen hood filter replacement', 'home cleaning service', 'maid service', 'chef', 'vegan', 'meal prep', 'food delivery', 'catering', 'private chef'],
  signals: {
    primary: [{ term: 'hood', weight: 30 }, { term: 'kitchen', weight: 30 }, { term: 'kitchen exhaust', weight: 30 }, { term: 'hood cleaning', weight: 35 }, { term: 'grease removal', weight: 25 }],
    secondary: [{ term: 'NFPA 96', weight: 10 }, { term: 'restaurant', weight: 10 }, { term: 'duct cleaning', weight: 10 }, { term: 'pressure washer', weight: 10 }, { term: 'exhaust cleaning', weight: 10 }],
    negative: [{ term: 'residential cleaning', weight: -30 }],
  },
  scoringWeights: SHARED_SCORING_WEIGHTS,
  baseScoringWeights: { distanceWeight: 20, contactEnrichmentWeight: 10, assetSignalWeight: 15 },
  createdAt: NOW,
};
