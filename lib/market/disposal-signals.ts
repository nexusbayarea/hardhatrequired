// ─── HHR Disposal Signal Library ─────────────────────────────────────────────
//
// Replaces the broken buildDisposalSignals() in adapter.ts.
//
// THE BUG IT FIXES:
//   The old function tokenized disposalQueries strings into single words:
//   "concrete slurry disposal dump site" → ["slurry","disposal","dump","site"]
//   These fragments never match real facility names like "Apex Waste Solutions"
//   or "Recology East Bay" — so disposal results always scored near zero.
//
// THE FIX:
//   Each vertical now has a curated disposal signal set with:
//     - Multi-word PRIMARY signals (the facility type itself)
//     - Named OPERATOR signals (known brands that ARE the disposal destination)
//     - Google Business CATEGORY signals (type-based match for opaque names)
//     - NAICS/SIC code descriptors (what Apollo returns for these facilities)
//
//   This means a company named "Recology" with Apollo industry="Solid Waste
//   Collection" will now match DISPOSAL_OPERATOR_SIGNALS and score correctly
//   even with zero keyword overlap in its name.
// ─────────────────────────────────────────────────────────────────────────────

import { SignalLayers, WeightedSignal } from '@/types/config';

// ── Known disposal operators (names that ARE the signal) ─────────────────────
// Apollo, Google Places, and OSM all return these company names.
// Matching on the company name directly bypasses the opaque-name problem.
const NATIONAL_DISPOSAL_OPERATORS: WeightedSignal[] = [
  // Solid waste / landfill majors
  { term: 'clean harbors',       weight: 35 },
  { term: 'republic services',   weight: 35 },
  { term: 'waste management',    weight: 35 },
  { term: 'casella',             weight: 30 },
  { term: 'covanta',             weight: 30 },
  { term: 'veolia',              weight: 30 },
  { term: 'stericycle',          weight: 35 },
  { term: 'us ecology',          weight: 30 },
  { term: 'us ecology',          weight: 30 },
  { term: 'heritage crystal',    weight: 25 },
  { term: 'envirostar',          weight: 25 },
  // Regional operators commonly returned by Google/Overpass
  { term: 'recology',            weight: 35 },
  { term: 'norcal waste',        weight: 30 },
  { term: 'greenwaste',          weight: 30 },
  { term: 'bay area recycling',  weight: 30 },
  { term: 'bay waste',           weight: 25 },
  { term: 'golden gate disposal',weight: 30 },
  { term: 'santek',              weight: 25 },
  { term: 'advanced disposal',   weight: 25 },
  { term: 'arrow disposal',      weight: 25 },
  { term: 'lauber waste',        weight: 25 },
  { term: 'aptus',               weight: 25 },
];

// ── Google Business Category → disposal signal mapping ────────────────────────
// Google Places types[] for disposal facilities. These are what Google actually
// returns — we match on these even when the company name is opaque.
export const DISPOSAL_GOOGLE_TYPE_SIGNALS: Record<string, string[]> = {
  waste_management_service:      ['waste management service', 'waste disposal'],
  recycling_center:              ['recycling center', 'material recovery'],
  hazardous_waste_disposal:      ['hazardous waste disposal', 'hazmat facility'],
  environmental_consultant:      ['environmental services'],
  sewage_disposal_service:       ['wastewater disposal', 'sewage treatment'],
  junk_removal_service:          ['waste removal', 'debris disposal'],
  sanitation_service:            ['sanitation', 'solid waste collection'],
  garbage_collection:            ['garbage collection', 'solid waste'],
  landfill:                      ['landfill', 'solid waste disposal'],
  transfer_station:              ['transfer station', 'waste transfer'],
};

// ── Apollo description keywords that identify disposal facilities ──────────────
// Apollo's short_description, keywords, and industry fields for disposal
// companies use these terms. We treat these as strong secondary signals.
export const DISPOSAL_APOLLO_SIGNALS: WeightedSignal[] = [
  { term: 'solid waste collection',   weight: 30 },
  { term: 'waste collection',         weight: 25 },
  { term: 'refuse collection',        weight: 25 },
  { term: 'hazardous waste',          weight: 30 },
  { term: 'waste treatment',          weight: 25 },
  { term: 'waste disposal',           weight: 25 },
  { term: 'environmental services',   weight: 20 },
  { term: 'waste management',         weight: 25 },
  { term: 'material recovery',        weight: 20 },
  { term: 'recycling services',       weight: 20 },
  { term: 'transfer station',         weight: 30 },
  { term: 'landfill operations',      weight: 30 },
  { term: 'industrial waste',         weight: 25 },
  { term: 'biohazard',                weight: 30 },
  { term: 'wastewater treatment',     weight: 30 },
];

// ── Per-vertical disposal signal sets ─────────────────────────────────────────
// Each vertical defines what a DISPOSAL facility looks like for its specific
// waste stream. Signals are multi-word phrases, not single tokens.

const VERTICAL_DISPOSAL_SIGNALS: Record<string, {
  primary: WeightedSignal[];
  secondary: WeightedSignal[];
  facilityTypes: string[];   // for Overpass tag matching
}> = {

  slurry_processing: {
    primary: [
      { term: 'concrete washout',          weight: 35 },
      { term: 'slurry disposal',           weight: 35 },
      { term: 'concrete recycling',        weight: 30 },
      { term: 'ready mix reclaimer',       weight: 30 },
      { term: 'washout facility',          weight: 30 },
      { term: 'slurry pond',               weight: 30 },
      { term: 'concrete waste disposal',   weight: 30 },
      { term: 'pH neutralization',         weight: 25 },
      { term: 'concrete slurry',           weight: 25 },
      { term: 'reclaimer station',         weight: 25 },
      { term: 'concrete aggregate',        weight: 20 },
    ],
    secondary: [
      { term: 'construction waste',        weight: 15 },
      { term: 'inert debris',              weight: 15 },
      { term: 'C&D disposal',              weight: 15 },
      { term: 'transfer station',          weight: 10 },
      { term: 'recycling center',          weight: 10 },
      { term: 'concrete crushing',         weight: 20 },
      { term: 'aggregate recycling',       weight: 20 },
    ],
    facilityTypes: ['recycling', 'concrete_recycler', 'construction_debris'],
  },

  hydro_excavation: {
    primary: [
      { term: 'hydrovac disposal',          weight: 35 },
      { term: 'vac truck disposal',         weight: 35 },
      { term: 'excavation spoils',          weight: 30 },
      { term: 'soil disposal',              weight: 30 },
      { term: 'liquid waste disposal',      weight: 30 },
      { term: 'non-hazardous liquid',       weight: 25 },
      { term: 'industrial liquid waste',    weight: 30 },
      { term: 'wastewater disposal',        weight: 25 },
    ],
    secondary: [
      { term: 'transfer station',           weight: 15 },
      { term: 'liquid waste facility',      weight: 20 },
      { term: 'waste processor',            weight: 15 },
      { term: 'tank cleaning',              weight: 15 },
    ],
    facilityTypes: ['wastewater_plant', 'transfer_station'],
  },

  asbestos_abatement: {
    primary: [
      { term: 'asbestos disposal',          weight: 40 },
      { term: 'hazardous waste landfill',   weight: 35 },
      { term: 'Class I landfill',           weight: 35 },
      { term: 'RCRA disposal',              weight: 35 },
      { term: 'asbestos landfill',          weight: 40 },
      { term: 'regulated asbestos',         weight: 35 },
      { term: 'friable asbestos',           weight: 30 },
      { term: 'hazmat disposal',            weight: 25 },
    ],
    secondary: [
      { term: 'hazardous waste',            weight: 20 },
      { term: 'Class II landfill',          weight: 20 },
      { term: 'manifest required',          weight: 15 },
      { term: 'TSDF',                       weight: 25 },
    ],
    facilityTypes: ['hazardous_waste', 'landfill'],
  },

  hazardous_soil_remediation: {
    primary: [
      { term: 'contaminated soil',          weight: 40 },
      { term: 'hazardous soil disposal',    weight: 40 },
      { term: 'impacted soil',              weight: 35 },
      { term: 'petroleum contaminated',     weight: 35 },
      { term: 'Class I landfill',           weight: 35 },
      { term: 'hazardous waste landfill',   weight: 35 },
      { term: 'RCRA Treatment',             weight: 30 },
      { term: 'TSDF',                       weight: 30 },
      { term: 'soil bioremediation',        weight: 25 },
    ],
    secondary: [
      { term: 'bioremediation',             weight: 20 },
      { term: 'thermal desorption',         weight: 25 },
      { term: 'soil washing',               weight: 20 },
      { term: 'excavated soil',             weight: 15 },
    ],
    facilityTypes: ['hazardous_waste', 'landfill', 'treatment_facility'],
  },

  industrial_wastewater: {
    primary: [
      { term: 'wastewater treatment',       weight: 35 },
      { term: 'industrial pretreatment',    weight: 35 },
      { term: 'POTW',                       weight: 35 },
      { term: 'liquid waste treatment',     weight: 30 },
      { term: 'effluent treatment',         weight: 30 },
      { term: 'wastewater disposal',        weight: 30 },
      { term: 'industrial discharge',       weight: 25 },
      { term: 'leachate disposal',          weight: 30 },
      { term: 'non-hazardous liquid waste', weight: 25 },
    ],
    secondary: [
      { term: 'treatment plant',            weight: 20 },
      { term: 'waste treatment facility',   weight: 20 },
      { term: 'lagoon disposal',            weight: 15 },
    ],
    facilityTypes: ['wastewater_plant', 'treatment_facility'],
  },

  medical_waste: {
    primary: [
      { term: 'medical waste disposal',     weight: 40 },
      { term: 'biohazard waste',            weight: 40 },
      { term: 'regulated medical waste',    weight: 40 },
      { term: 'RMW disposal',               weight: 35 },
      { term: 'autoclave facility',         weight: 35 },
      { term: 'medical waste treatment',    weight: 35 },
      { term: 'sharps disposal',            weight: 30 },
      { term: 'pathological waste',         weight: 30 },
      { term: 'pharmaceutical disposal',    weight: 30 },
    ],
    secondary: [
      { term: 'infectious waste',           weight: 25 },
      { term: 'biohazard collection',       weight: 20 },
      { term: 'medical autoclave',          weight: 25 },
      { term: 'healthcare waste',           weight: 20 },
    ],
    facilityTypes: ['medical_waste', 'hazardous_waste'],
  },

  industrial_demolition: {
    primary: [
      { term: 'C&D disposal',               weight: 35 },
      { term: 'construction debris',        weight: 30 },
      { term: 'inert debris landfill',      weight: 35 },
      { term: 'concrete disposal',          weight: 30 },
      { term: 'demolition debris',          weight: 35 },
      { term: 'concrete crushing',          weight: 30 },
      { term: 'aggregate recycling',        weight: 25 },
      { term: 'scrap metal recycling',      weight: 25 },
      { term: 'concrete recycling yard',    weight: 30 },
    ],
    secondary: [
      { term: 'recycling center',           weight: 15 },
      { term: 'transfer station',           weight: 15 },
      { term: 'scrap yard',                 weight: 20 },
      { term: 'metal recycler',             weight: 15 },
    ],
    facilityTypes: ['recycling', 'landfill', 'scrap_yard'],
  },

  industrial_sandblasting: {
    primary: [
      { term: 'spent abrasive',             weight: 40 },
      { term: 'blast media disposal',       weight: 40 },
      { term: 'abrasive waste',             weight: 35 },
      { term: 'spent media',                weight: 35 },
      { term: 'sandblast waste',            weight: 35 },
      { term: 'hazardous waste disposal',   weight: 25 },
      { term: 'lead paint waste',           weight: 30 },
    ],
    secondary: [
      { term: 'industrial waste disposal',  weight: 20 },
      { term: 'contaminated media',         weight: 20 },
    ],
    facilityTypes: ['hazardous_waste', 'landfill'],
  },

  tank_testing: {
    primary: [
      { term: 'UST removal',                weight: 35 },
      { term: 'tank disposal',              weight: 35 },
      { term: 'petroleum contaminated',     weight: 30 },
      { term: 'contaminated soil',          weight: 30 },
      { term: 'petroleum waste',            weight: 30 },
      { term: 'UST closure',                weight: 35 },
      { term: 'underground tank disposal',  weight: 30 },
      { term: 'free product removal',       weight: 25 },
    ],
    secondary: [
      { term: 'environmental disposal',     weight: 20 },
      { term: 'petroleum cleanup',          weight: 20 },
    ],
    facilityTypes: ['hazardous_waste', 'treatment_facility'],
  },

  stormwater_swppp: {
    primary: [
      { term: 'sediment disposal',          weight: 35 },
      { term: 'stormwater basin cleaning',  weight: 35 },
      { term: 'catch basin disposal',       weight: 30 },
      { term: 'sediment basin',             weight: 30 },
      { term: 'stormwater treatment',       weight: 30 },
      { term: 'BMP disposal',               weight: 25 },
    ],
    secondary: [
      { term: 'liquid waste',               weight: 15 },
      { term: 'non-hazardous waste',        weight: 15 },
      { term: 'transfer station',           weight: 10 },
    ],
    facilityTypes: ['wastewater_plant', 'treatment_facility'],
  },

  dewatering: {
    primary: [
      { term: 'construction dewatering disposal', weight: 35 },
      { term: 'groundwater disposal',       weight: 35 },
      { term: 'pump discharge',             weight: 25 },
      { term: 'dewatering treatment',       weight: 30 },
      { term: 'bypass pumping discharge',   weight: 25 },
      { term: 'water discharge permit',     weight: 25 },
    ],
    secondary: [
      { term: 'wastewater disposal',        weight: 20 },
      { term: 'liquid waste',               weight: 15 },
    ],
    facilityTypes: ['wastewater_plant', 'treatment_facility'],
  },

  // Default fallback for any vertical not explicitly mapped
  _default: {
    primary: [
      { term: 'waste disposal',             weight: 25 },
      { term: 'waste facility',             weight: 25 },
      { term: 'disposal site',              weight: 25 },
      { term: 'waste treatment',            weight: 25 },
      { term: 'recycling facility',         weight: 20 },
      { term: 'transfer station',           weight: 20 },
      { term: 'landfill',                   weight: 20 },
    ],
    secondary: [
      { term: 'waste collection',           weight: 15 },
      { term: 'recycling center',           weight: 15 },
      { term: 'industrial waste',           weight: 15 },
    ],
    facilityTypes: ['landfill', 'recycling', 'waste_processor'],
  },
};

// ── Main export: replaces buildDisposalSignals() in adapter.ts ────────────────

export function buildDisposalSignals(config: { id: string; signals?: { negative?: WeightedSignal[] } }): SignalLayers {
  const verticalSignals = VERTICAL_DISPOSAL_SIGNALS[config.id] ?? VERTICAL_DISPOSAL_SIGNALS['_default'];

  // Merge national operator signals as primary (they are categorical matches)
  const allPrimary: WeightedSignal[] = [
    ...verticalSignals.primary,
    ...NATIONAL_DISPOSAL_OPERATORS,
    ...DISPOSAL_APOLLO_SIGNALS,
  ];

  // Deduplicate by term
  const seen = new Set<string>();
  const dedupedPrimary = allPrimary.filter(s => {
    if (seen.has(s.term)) return false;
    seen.add(s.term);
    return true;
  });

  return {
    primary: dedupedPrimary,
    secondary: verticalSignals.secondary,
    // Keep the vertical's existing negative signals
    negative: config.signals?.negative ?? [],
  };
}

export function getDisposalFacilityTypes(verticalId: string): string[] {
  return (VERTICAL_DISPOSAL_SIGNALS[verticalId] ?? VERTICAL_DISPOSAL_SIGNALS['_default']).facilityTypes;
}

export function getCategorySignalsForDisposal(googleTypes: string[]): string[] {
  const signals: string[] = [];
  for (const type of googleTypes) {
    const mapped = DISPOSAL_GOOGLE_TYPE_SIGNALS[type];
    if (mapped) signals.push(...mapped);
  }
  return [...new Set(signals)];
}
