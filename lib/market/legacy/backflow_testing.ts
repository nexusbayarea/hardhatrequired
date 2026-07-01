import type { VerticalConfig } from '@/types/config';

const NOW = new Date().toISOString();

const SHARED_SCORING_WEIGHTS = {
  hasWebsite: 15, hasPhone: 20, hasContactEmail: 10, hasPhysicalAddress: 10, distanceFactor: 10,
};

export const BACKFLOW_TESTING_LEGACY: VerticalConfig = {
  id: 'backflow_testing', slug: 'backflow_testing',
  industryName: 'Backflow Prevention Testing',
  searchQueries: ['commercial plumbing backflow', 'backflow testing service', 'certified backflow tester', 'RPZ testing', 'commercial backflow assembly inspector'],
  targetNaicsCodes: ['238220', '541380'],
  equipmentKeywords: ['backflow test kit', 'pressure gauge', 'differential pressure meter', 'RPZ tester', 'double check valve tester'],
  negativeKeywords: ['residential water filtration pitcher', 'swimming pool backwash valve', 'sewer line replacement', 'water heater repair', 'water softener installation', 'plumbing', 'drain cleaning', 'sewer line', 'faucet repair', 'toilet repair'],
  signals: {
    primary: [{ term: 'backflow', weight: 30 }, { term: 'RPZ', weight: 30 }, { term: 'cross connection', weight: 30 }],
    secondary: [{ term: 'water testing', weight: 10 }, { term: 'certified tester', weight: 10 }, { term: 'assembly testing', weight: 10 }, { term: 'backflow preventer', weight: 10 }, { term: 'double check valve', weight: 10 }, { term: 'pressure gauge', weight: 10 }],
    negative: [{ term: 'pool', weight: -30 }, { term: 'home filter', weight: -30 }, { term: 'water heater', weight: -30 }, { term: 'plumbing', weight: -30 }],
  },
  scoringWeights: SHARED_SCORING_WEIGHTS,
  baseScoringWeights: { distanceWeight: 20, contactEnrichmentWeight: 10, assetSignalWeight: 15 },
  createdAt: NOW,
};
