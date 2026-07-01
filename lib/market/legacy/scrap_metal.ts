import type { VerticalConfig } from '@/types/config';

const NOW = new Date().toISOString();

const SHARED_SCORING_WEIGHTS = {
  hasWebsite: 15, hasPhone: 20, hasContactEmail: 10, hasPhysicalAddress: 10, distanceFactor: 10,
};

export const SCRAP_METAL_LEGACY: VerticalConfig = {
  id: 'scrap_metal', slug: 'scrap_metal',
  industryName: 'Industrial Scrap Metal Processing',
  searchQueries: ['scrap metal recycling facility', 'ferrous metal recycling', 'non-ferrous scrap processing', 'industrial metal recycling', 'scrap yard processing'],
  targetNaicsCodes: ['423930', '562920'],
  equipmentKeywords: ['alligator shear', 'metal shredder', 'scrap baler', 'non-ferrous separator', 'scrap crane magnet', 'roll-off scrap containers'],
  negativeKeywords: ['used car dealership', 'auto salvage retail', 'mechanic shop', 'pawn shop', 'residential junk collection', 'antique store', 'appliance repair', 'electronics repair', 'plastic recycling', 'paper recycling', 'e-waste', 'bottle recycling', 'cardboard'],
  signals: {
    primary: [{ term: 'scrap metal', weight: 30 }, { term: 'metal recycling', weight: 30 }, { term: 'ferrous scrap', weight: 30 }, { term: 'non-ferrous scrap', weight: 25 }, { term: 'recycling', weight: 20 }],
    secondary: [{ term: 'metal', weight: 10 }, { term: 'scrap', weight: 10 }, { term: 'metal processing', weight: 10 }, { term: 'scrap yard', weight: 10 }, { term: 'metal shredding', weight: 10 }, { term: 'metal baler', weight: 10 }],
    negative: [{ term: 'used car', weight: -30 }, { term: 'auto salvage', weight: -30 }, { term: 'mechanic shop', weight: -30 }, { term: 'plastic', weight: -30 }, { term: 'paper recycling', weight: -30 }],
  },
  scoringWeights: SHARED_SCORING_WEIGHTS,
  baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
  createdAt: NOW,
};
