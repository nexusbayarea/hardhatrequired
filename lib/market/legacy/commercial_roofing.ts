import type { VerticalConfig } from '@/types/config';

const NOW = new Date().toISOString();

const SHARED_SCORING_WEIGHTS = {
  hasWebsite: 15, hasPhone: 20, hasContactEmail: 10, hasPhysicalAddress: 10, distanceFactor: 10,
};

export const COMMERCIAL_ROOFING_LEGACY: VerticalConfig = {
  id: 'commercial_roofing', slug: 'commercial_roofing',
  industryName: 'Industrial & Commercial Flat Roofing',
  searchQueries: ['commercial roofing contractor', 'flat roof installation', 'industrial roofing services', 'TPO roofing contractor', 'roof membrane replacement'],
  targetNaicsCodes: ['238160'],
  equipmentKeywords: ['TPO membrane', 'EPDM roofing', 'single-ply system', 'thermal roof inspection', 'built-up roofing', 'cool roof coating'],
  negativeKeywords: ['residential shingle repair', 'gutter cleaning', 'handyman services', 'chimney sweep', 'DIY shingle replacement', 'skylight installation home', 'home inspector', 'real estate', 'siding', 'window replacement', 'deck building', 'fence installation'],
  signals: {
    primary: [{ term: 'commercial roofing', weight: 30 }, { term: 'flat roof', weight: 30 }, { term: 'TPO roofing', weight: 30 }, { term: 'industrial roofing', weight: 30 }],
    secondary: [{ term: 'roof membrane', weight: 10 }, { term: 'built-up roofing', weight: 10 }, { term: 'EPDM roofing', weight: 10 }, { term: 'cool roof', weight: 10 }, { term: 'single-ply', weight: 10 }, { term: 'roof replacement', weight: 10 }],
    negative: [{ term: 'residential shingle', weight: -30 }, { term: 'gutter cleaning', weight: -30 }, { term: 'handyman', weight: -30 }, { term: 'siding', weight: -30 }, { term: 'window replacement', weight: -30 }],
  },
  scoringWeights: SHARED_SCORING_WEIGHTS,
  baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
  createdAt: NOW,
};
