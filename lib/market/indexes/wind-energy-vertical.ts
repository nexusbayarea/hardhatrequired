// ─── Wind Energy Vertical ─────────────────────────────────────────────────────
// Add this entry to VERTICAL_REGISTRY in lib/market/registry.ts
// This is the 20th vertical completing the HHR architecture diagram.
// ──────────────────────────────────────────────────────────────────────────────

import { VerticalConfig } from '@/types/config';

export const WIND_ENERGY_VERTICAL: VerticalConfig = {
  id: 'wind_energy',
  slug: 'wind_energy',
  industryName: 'Wind Energy',
  targetNaicsCodes: ['237130', '221115', '333611', '811310'],
  equipmentKeywords: [
    'nacelle', 'rotor', 'turbine blade', 'tower crane', 'pitch control',
    'yaw drive', 'gearbox', 'anemometer', 'SCADA', 'substation',
  ],
  negativeKeywords: [
    'solar', 'residential', 'landscaping', 'hvac', 'plumbing',
    'concrete', 'slurry', 'asbestos',
  ],
  searchQueries: [
    'wind turbine maintenance contractor',
    'wind energy services',
    'wind farm operations contractor',
    'turbine installation company',
    'wind energy technician services',
  ],
  signals: {
    primary: [
      { term: 'wind turbine',       weight: 25 },
      { term: 'wind energy',        weight: 25 },
      { term: 'wind farm',          weight: 25 },
      { term: 'turbine maintenance', weight: 25 },
      { term: 'wind power',         weight: 20 },
    ],
    secondary: [
      { term: 'renewable energy',   weight: 10 },
      { term: 'nacelle',            weight: 15 },
      { term: 'rotor blade',        weight: 15 },
      { term: 'GWO certified',      weight: 15 },
      { term: 'tower climbing',     weight: 10 },
      { term: 'SCADA',              weight: 10 },
      { term: 'offshore wind',      weight: 15 },
      { term: 'onshore wind',       weight: 10 },
      { term: 'turbine inspection', weight: 10 },
      { term: 'blade repair',       weight: 15 },
    ],
    negative: [
      { term: 'residential',        weight: -30 },
      { term: 'landscaping',        weight: -60 },
      { term: 'concrete',           weight: -40 },
      { term: 'plumbing',           weight: -60 },
      { term: 'asbestos',           weight: -50 },
    ],
  },
  scoringWeights: {
    hasWebsite:          15,
    hasPhone:            20,
    hasContactEmail:     10,
    hasPhysicalAddress:  10,
    distanceFactor:      10,
  },
  baseScoringWeights: {
    distanceWeight:          0.15,
    contactEnrichmentWeight: 0.20,
    assetSignalWeight:       0.65,
  },
  createdAt: new Date().toISOString(),
};

// ─── How to add to registry.ts ───────────────────────────────────────────────
//
// In lib/market/registry.ts, import and add:
//
//   import { WIND_ENERGY_VERTICAL } from './verticals/wind-energy';
//
//   export const VERTICAL_REGISTRY: Record<string, VerticalConfig> = {
//     ...existingVerticals,
//     wind_energy: WIND_ENERGY_VERTICAL,   // ← add this line
//   };
//
// ─────────────────────────────────────────────────────────────────────────────
