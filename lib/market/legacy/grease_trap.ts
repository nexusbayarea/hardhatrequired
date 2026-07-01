import { VerticalConfig } from '@/types/config';

const NOW = new Date().toISOString();

const SHARED_SCORING_WEIGHTS = {
  hasWebsite: 15,
  hasPhone: 20,
  hasContactEmail: 10,
  hasPhysicalAddress: 10,
};

export const GREASE_TRAP_LEGACY: VerticalConfig = {
  id: 'grease_trap',
  slug: 'grease_trap',
  industryName: 'Commercial Grease Trap Pumping & Recycling',
  searchQueries: [
    'septic tank pumping', 'drain cleaning service',
    'waste removal service', 'grease trap cleaning',
    'restaurant grease disposal'
  ],
  targetNaicsCodes: ['562219', '562111', '562998'],
  equipmentKeywords: [
    'grease interceptor', 'vacuum tanker', 'hydro-jetting',
    'grease rendering', 'degreasing unit', 'yellow grease collection'
  ],
  negativeKeywords: [
    'plumber repair', 'residential plumbing', 'home kitchen cleaning',
    'sewer line repair', 'faucet installation', 'clogged toilet',
    'residential', 'cleaning service', 'handyman',
    'cooking oil', 'oil change', 'fryer repair'
  ],
  signals: {
    primary: [
      { term: 'grease trap', weight: 30 },
      { term: 'grease interceptor', weight: 30 },
      { term: 'grease', weight: 25 },
      { term: 'FOG', weight: 30 },
    ],
    secondary: [
      { term: 'pumping', weight: 10 },
      { term: 'wastewater', weight: 10 },
      { term: 'hydro jetting', weight: 10 },
      { term: 'vacuum truck', weight: 10 },
      { term: 'restaurant service', weight: 10 },
      { term: 'yellow grease', weight: 10 },
      { term: 'rendering', weight: 10 },
      { term: 'OSHA', weight: 10 },
    ],
    negative: [
      { term: 'concrete', weight: -60 },
      { term: 'recycling', weight: -60 },
      { term: 'landscape', weight: -50 },
      { term: 'restoration', weight: -50 },
      { term: 'home kitchen', weight: -30 },
    ],
  },
  scoringWeights: SHARED_SCORING_WEIGHTS,
  baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
  createdAt: NOW,
};
