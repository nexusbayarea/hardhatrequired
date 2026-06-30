import { VerticalConfig } from '@/types/config';
import { DiscoveryProvider } from './providers/base';
import { RegulatoryProvider } from './providers/regulatory';
import { GooglePlacesProvider } from './providers/google';
import { WebSearchProvider } from './providers/web';
import { TomTomProvider } from './providers/tomtom';
import { OverpassProvider } from './providers/overpass';

const regulatory = new RegulatoryProvider();
const google = new GooglePlacesProvider();
const web = new WebSearchProvider();
const tomtom = new TomTomProvider();
const overpass = new OverpassProvider();

export interface VerticalConfigWithProviders extends VerticalConfig {
  providers: DiscoveryProvider[];
}

export function createProviders(extra: DiscoveryProvider[] = []): DiscoveryProvider[] {
  return [regulatory, google, web, ...extra];
}

export function createSearchOnlyProviders(extra: DiscoveryProvider[] = []): DiscoveryProvider[] {
  return [google, web, ...extra];
}

const NOW = new Date().toISOString();

const SHARED_SCORING_WEIGHTS = {
  hasWebsite: 15,
  hasPhone: 20,
  hasContactEmail: 10,
  hasPhysicalAddress: 10,
  distanceFactor: 10,
};

export const VERTICAL_REGISTRY: Record<string, VerticalConfigWithProviders> = {
  slurry_concrete: {
    id: 'slurry_concrete',
    slug: 'slurry_concrete',
    industryName: 'Concrete Slurry Recycling & Disposal',
    searchQueries: [
      'concrete washout service',
      'slurry disposal concrete recycling',
      'concrete slurry disposal',
      'slurry',
      'vacuum truck slurry',
      'concrete washout removal',
      'concrete washout recycling',
    ],
    targetNaicsCodes: ['562211', '238110', '562112'],
    equipmentKeywords: [
      'filter press', 'dewatering box', 'centrifuge', 'slurry tanker',
      'vacuum truck', 'concrete recycling plant', 'slurry press'
    ],
    negativeKeywords: [
      'residential', 'driveway', 'handyman', 'home repair',
      'home kitchen', 'landscaping', 'home improvement',
    ],
    signals: {
      primary: [
        { term: 'slurry', weight: 50 },
        { term: 'concrete washout', weight: 45 },
        { term: 'washout', weight: 35 },
        { term: 'vacuum truck', weight: 30 },
        { term: 'wastewater', weight: 30 },
      ],
      secondary: [
        { term: 'concrete', weight: 10 },
        { term: 'hydro excavation', weight: 15 },
        { term: 'recycling', weight: 12 },
        { term: 'filtration', weight: 12 },
        { term: 'environmental', weight: 10 },
      ],
      negative: [
        { term: 'residential', weight: -50 },
        { term: 'driveway', weight: -40 },
        { term: 'handyman', weight: -60 },
        { term: 'demolition', weight: -50 },
        { term: 'construction', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createProviders([tomtom, overpass]),
  },

  grease_trap: {
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
    providers: createProviders([tomtom, overpass]),
  },

  asbestos_abatement: {
    id: 'asbestos_abatement',
    slug: 'asbestos_abatement',
    industryName: 'Hazardous Asbestos & Lead Abatement',
    searchQueries: [
      'asbestos abatement contractor', 'asbestos removal service',
      'lead paint remediation', 'hazardous materials abatement',
      'environmental remediation contractor'
    ],
    targetNaicsCodes: ['562910', '238910'],
    equipmentKeywords: [
      'negative air machine', 'HEPA vacuum', 'containment barrier',
      'decontamination shower', 'personal air monitor', 'asbestos encapsulation'
    ],
    negativeKeywords: [
      'home inspection', 'paint store', 'hardware store', 'residential painter',
      'mold inspection DIY', 'interior design', 'cleaning service',
      'carpet cleaning', 'property management', 'mold removal', 'water damage restoration'
    ],
    signals: {
      primary: [
        { term: 'asbestos', weight: 30 },
        { term: 'abatement', weight: 25 },
        { term: 'environmental', weight: 20 },
        { term: 'lead abatement', weight: 25 },
        { term: 'hazmat remediation', weight: 25 },
        { term: 'environmental remediation', weight: 25 },
      ],
      secondary: [
        { term: 'containment', weight: 10 },
        { term: 'demolition', weight: 10 },
        { term: 'air monitoring', weight: 10 },
        { term: 'encapsulation', weight: 10 },
        { term: 'hazardous', weight: 10 },
        { term: 'remediation', weight: 10 },
        { term: 'OSHA', weight: 10 },
        { term: 'HAZWOPER', weight: 10 },
        { term: 'EPA', weight: 10 },
      ],
      negative: [
        { term: 'diy kit', weight: -30 },
        { term: 'home mold cleaning', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createProviders([tomtom, overpass]),
  },

  hydro_excavation: {
    id: 'hydro_excavation',
    slug: 'hydro_excavation',
    industryName: 'Hydro-Excavation & Non-Destructive Digging',
    searchQueries: [
      'excavation contractor', 'utility contractor',
      'underground construction', 'trenching services',
      'vacuum truck service', 'hydro excavation service'
    ],
    targetNaicsCodes: ['562998', '238910', '562119'],
    equipmentKeywords: [
      'hydrovac truck', 'slurry tanker', 'utility daylighting',
      'high-pressure water jet', 'vacuum excavation rig'
    ],
    negativeKeywords: [
      'landscaping design', 'backyard trenching', 'sprinkler installation',
      'hand digging', 'plumbing repair DIY', 'pool excavation',
      'residential', 'gardening', 'backhoe', 'general contractor',
      'foundation repair', 'septic installation'
    ],
    signals: {
      primary: [
        { term: 'hydro excavation', weight: 30 },
        { term: 'hydrovac', weight: 30 },
        { term: 'vacuum excavation', weight: 30 },
        { term: 'excavation', weight: 25 },
        { term: 'non-destructive digging', weight: 25 },
      ],
      secondary: [
        { term: 'utility potholing', weight: 10 },
        { term: 'daylighting', weight: 10 },
        { term: 'slurry excavation', weight: 10 },
        { term: 'vactor', weight: 10 },
        { term: 'hydrovac truck', weight: 10 },
        { term: 'vacuum truck', weight: 10 },
        { term: 'OSHA', weight: 10 },
        { term: 'EPA', weight: 10 },
      ],
      negative: [
        { term: 'landscaping', weight: -30 },
        { term: 'backyard trenching', weight: -30 },
        { term: 'sprinkler installation', weight: -30 },
        { term: 'foundation repair', weight: -30 },
        { term: 'septic', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
  },

  commercial_roofing: {
    id: 'commercial_roofing',
    slug: 'commercial_roofing',
    industryName: 'Industrial & Commercial Flat Roofing',
    searchQueries: [
      'commercial roofing contractor', 'flat roof installation',
      'industrial roofing services', 'TPO roofing contractor',
      'roof membrane replacement'
    ],
    targetNaicsCodes: ['238160'],
    equipmentKeywords: [
      'TPO membrane', 'EPDM roofing', 'single-ply system',
      'thermal roof inspection', 'built-up roofing', 'cool roof coating'
    ],
    negativeKeywords: [
      'residential shingle repair', 'gutter cleaning', 'handyman services',
      'chimney sweep', 'DIY shingle replacement', 'skylight installation home',
      'home inspector', 'real estate', 'siding', 'window replacement',
      'deck building', 'fence installation'
    ],
    signals: {
      primary: [
        { term: 'commercial roofing', weight: 30 },
        { term: 'flat roof', weight: 30 },
        { term: 'TPO roofing', weight: 30 },
        { term: 'industrial roofing', weight: 30 },
      ],
      secondary: [
        { term: 'roof membrane', weight: 10 },
        { term: 'built-up roofing', weight: 10 },
        { term: 'EPDM roofing', weight: 10 },
        { term: 'cool roof', weight: 10 },
        { term: 'single-ply', weight: 10 },
        { term: 'roof replacement', weight: 10 },
      ],
      negative: [
        { term: 'residential shingle', weight: -30 },
        { term: 'gutter cleaning', weight: -30 },
        { term: 'handyman', weight: -30 },
        { term: 'siding', weight: -30 },
        { term: 'window replacement', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
  },

  medical_waste: {
    id: 'medical_waste',
    slug: 'medical_waste',
    industryName: 'Biomedical & Infectious Waste Treatment',
    searchQueries: [
      'medical waste disposal service', 'sharps disposal service',
      'biohazard waste collection', 'clinical waste management',
      'regulated medical waste'
    ],
    targetNaicsCodes: ['562211', '562112'],
    equipmentKeywords: [
      'autoclave sterilization', 'biohazard containment boxes',
      'sharps container service', 'pathological waste incinerator',
      'infectious waste transport'
    ],
    negativeKeywords: [
      'pharmacy retail', 'dental clinic general', 'home health aid',
      'veterinarian hospital general', 'local doctor office',
      'medical supply store', 'hospital', 'janitorial', 'general waste',
      'trash pickup', 'dumpster rental', 'junk removal'
    ],
    signals: {
      primary: [
        { term: 'medical waste', weight: 30 },
        { term: 'biohazard disposal', weight: 30 },
        { term: 'sharps disposal', weight: 30 },
        { term: 'regulated medical waste', weight: 25 },
      ],
      secondary: [
        { term: 'clinical waste', weight: 10 },
        { term: 'infectious waste', weight: 10 },
        { term: 'pathological waste', weight: 10 },
        { term: 'autoclave', weight: 10 },
        { term: 'biohazard', weight: 10 },
        { term: 'sharps container', weight: 10 },
      ],
      negative: [
        { term: 'pharmacy', weight: -30 },
        { term: 'dental clinic', weight: -30 },
        { term: 'home health aid', weight: -30 },
        { term: 'janitorial', weight: -30 },
        { term: 'dumpster', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
  },

  scrap_metal: {
    id: 'scrap_metal',
    slug: 'scrap_metal',
    industryName: 'Industrial Scrap Metal Processing',
    searchQueries: [
      'scrap metal recycling facility', 'ferrous metal recycling',
      'non-ferrous scrap processing', 'industrial metal recycling',
      'scrap yard processing'
    ],
    targetNaicsCodes: ['423930', '562920'],
    equipmentKeywords: [
      'alligator shear', 'metal shredder', 'scrap baler',
      'non-ferrous separator', 'scrap crane magnet', 'roll-off scrap containers'
    ],
    negativeKeywords: [
      'used car dealership', 'auto salvage retail', 'mechanic shop',
      'pawn shop', 'residential junk collection', 'antique store',
      'appliance repair', 'electronics repair', 'plastic recycling',
      'paper recycling', 'e-waste', 'bottle recycling', 'cardboard'
    ],
    signals: {
      primary: [
        { term: 'scrap metal', weight: 30 },
        { term: 'metal recycling', weight: 30 },
        { term: 'ferrous scrap', weight: 30 },
        { term: 'non-ferrous scrap', weight: 25 },
        { term: 'recycling', weight: 20 },
      ],
      secondary: [
        { term: 'metal', weight: 10 },
        { term: 'scrap', weight: 10 },
        { term: 'metal processing', weight: 10 },
        { term: 'scrap yard', weight: 10 },
        { term: 'metal shredding', weight: 10 },
        { term: 'metal baler', weight: 10 },
      ],
      negative: [
        { term: 'used car', weight: -30 },
        { term: 'auto salvage', weight: -30 },
        { term: 'mechanic shop', weight: -30 },
        { term: 'plastic', weight: -30 },
        { term: 'paper recycling', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
  },

  marine_construction: {
    id: 'marine_construction',
    slug: 'marine_construction',
    industryName: 'Heavy Marine & Dock Infrastructure',
    searchQueries: [
      'marine construction contractor', 'seawall repair construction',
      'industrial dock building', 'commercial dredging service',
      'bulkhead construction'
    ],
    targetNaicsCodes: ['237990', '238910'],
    equipmentKeywords: [
      'pile driving rig', 'crane barge', 'bulkhead construction',
      'dredge boat', 'sheet piling', 'marine salvage vessel'
    ],
    negativeKeywords: [
      'boat rental', 'jet ski rental', 'residential dock repair',
      'yacht club sales', 'scuba diving school', 'marina slips',
      'fishing charter', 'boat storage', 'boat repair', 'fishing guide',
      'marine engine', 'boat dealer'
    ],
    signals: {
      primary: [
        { term: 'marine construction', weight: 30 },
        { term: 'seawall', weight: 30 },
        { term: 'bulkhead', weight: 30 },
        { term: 'dock building', weight: 30 },
        { term: 'marine', weight: 20 },
      ],
      secondary: [
        { term: 'commercial dredging', weight: 10 },
        { term: 'pile driving', weight: 10 },
        { term: 'marine infrastructure', weight: 10 },
        { term: 'dock', weight: 10 },
        { term: 'dredge', weight: 10 },
        { term: 'sheet piling', weight: 10 },
        { term: 'marine salvage', weight: 10 },
      ],
      negative: [
        { term: 'boat rental', weight: -30 },
        { term: 'jet ski rental', weight: -30 },
        { term: 'residential dock', weight: -30 },
        { term: 'boat repair', weight: -30 },
        { term: 'fishing', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 20, contactEnrichmentWeight: 10, assetSignalWeight: 15 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
  },

  concrete: {
    id: 'concrete',
    slug: 'concrete',
    industryName: 'Concrete Services',
    searchQueries: [
      'concrete contractor commercial', 'concrete pumping service',
      'ready mix concrete delivery', 'industrial concrete work',
      'concrete foundation contractor', 'concrete recycling',
      'concrete crushing service'
    ],
    targetNaicsCodes: ['238110', '327320', '423320'],
    equipmentKeywords: [
      'concrete pump', 'concrete mixer', 'concrete batch plant',
      'concrete saw', 'power trowel', 'concrete form', 'concrete crusher'
    ],
    negativeKeywords: [
      'residential driveway', 'home repair', 'handyman',
      'concrete bags retail', 'decorative concrete', 'stamped concrete patio',
      'general contractor', 'framing', 'drywall', 'painting', 'siding'
    ],
    signals: {
      primary: [
        { term: 'concrete contractor', weight: 30 },
        { term: 'concrete pumping', weight: 30 },
        { term: 'ready mix', weight: 30 },
        { term: 'concrete foundation', weight: 30 },
        { term: 'concrete recycling', weight: 30 },
        { term: 'concrete crushing', weight: 30 },
        { term: 'commercial concrete', weight: 25 },
      ],
      secondary: [
        { term: 'concrete pump', weight: 10 },
        { term: 'concrete mixer', weight: 10 },
        { term: 'concrete batch plant', weight: 10 },
        { term: 'recycling', weight: 10 },
        { term: 'crushed concrete', weight: 10 },
        { term: 'concrete saw', weight: 10 },
        { term: 'power trowel', weight: 10 },
      ],
      negative: [
        { term: 'residential driveway', weight: -30 },
        { term: 'decorative concrete', weight: -30 },
        { term: 'stamped concrete patio', weight: -30 },
        { term: 'municipal recycling', weight: -30 },
        { term: 'bottle recycling', weight: -30 },
        { term: 'general contractor', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createProviders([tomtom, overpass]),
  },

  stormwater_compliance: {
    id: 'stormwater_compliance',
    slug: 'stormwater_compliance',
    industryName: 'Stormwater Compliance / SWPPP',
    searchQueries: [
      'stormwater compliance', 'SWPPP inspection',
      'environmental consulting', 'construction site inspection',
      'erosion control service'
    ],
    targetNaicsCodes: ['541620', '562910'],
    equipmentKeywords: [
      'sampling kit', 'turbidity meter', 'pH meter',
      'erosion control blanket', 'silt fence'
    ],
    negativeKeywords: [
      'rain gutter cleaning', 'residential drainage', 'home waterproofing',
      'irrigation', 'plumbing', 'landscaping', 'lawn care', 'sprinkler'
    ],
    signals: {
      primary: [
        { term: 'SWPPP', weight: 30 },
        { term: 'stormwater', weight: 30 },
        { term: 'erosion control', weight: 30 },
        { term: 'compliance', weight: 20 },
      ],
      secondary: [
        { term: 'BMP', weight: 10 },
        { term: 'NPDES', weight: 10 },
        { term: 'runoff', weight: 10 },
        { term: 'environmental', weight: 10 },
        { term: 'EPA', weight: 10 },
        { term: 'OSHA', weight: 10 },
        { term: 'stormwater pollution', weight: 10 },
      ],
      negative: [
        { term: 'gutter cleaning', weight: -30 },
        { term: 'irrigation', weight: -30 },
        { term: 'lawn care', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 20, contactEnrichmentWeight: 10, assetSignalWeight: 15 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
  },

  industrial_wastewater: {
    id: 'industrial_wastewater',
    slug: 'industrial_wastewater',
    industryName: 'Industrial Wastewater Treatment',
    searchQueries: [
      'industrial wastewater treatment', 'water treatment service',
      'industrial water filtration', 'wastewater disposal',
      'environmental remediation'
    ],
    targetNaicsCodes: ['221320', '562219'],
    equipmentKeywords: [
      'filter press', 'clarifier', 'chemical treatment system',
      'wastewater pump', 'pH neutralization system'
    ],
    negativeKeywords: [
      'residential septic repair', 'pool cleaning', 'home plumbing',
      'laboratory testing', 'water delivery', 'bottled water',
      'water softener', 'reverse osmosis home'
    ],
    signals: {
      primary: [
        { term: 'industrial wastewater', weight: 30 },
        { term: 'wastewater treatment', weight: 30 },
        { term: 'wastewater', weight: 25 },
        { term: 'pretreatment', weight: 30 },
      ],
      secondary: [
        { term: 'filtration', weight: 10 },
        { term: 'clarifier', weight: 10 },
        { term: 'discharge permit', weight: 10 },
        { term: 'filter press', weight: 10 },
        { term: 'chemical treatment', weight: 10 },
        { term: 'pH neutralization', weight: 10 },
        { term: 'EPA', weight: 10 },
        { term: 'OSHA', weight: 10 },
        { term: 'NPDES', weight: 10 },
      ],
      negative: [
        { term: 'home septic', weight: -30 },
        { term: 'pool cleaning', weight: -30 },
        { term: 'water delivery', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 15, contactEnrichmentWeight: 10, assetSignalWeight: 20 },
    createdAt: NOW,
    providers: createProviders([tomtom, overpass]),
  },

  tank_testing: {
    id: 'tank_testing',
    slug: 'tank_testing',
    industryName: 'Underground Tank Testing',
    searchQueries: [
      'environmental testing', 'fuel tank service',
      'oil tank testing', 'storage tank services',
      'compliance testing', 'tank leak detection'
    ],
    targetNaicsCodes: ['541380', '562910'],
    equipmentKeywords: [
      'leak detector', 'precision test gauge', 'tank tightness tester',
      'soil vapor probe', 'groundwater monitor'
    ],
    negativeKeywords: [
      'propane grill tank refill', 'home fuel tank', 'tank toys',
      'plumber', 'plumbing', 'auto repair', 'garage', 'storage',
      'home inspection', 'landscape'
    ],
    signals: {
      primary: [
        { term: 'tank testing', weight: 30 },
        { term: 'leak detection', weight: 30 },
        { term: 'UST', weight: 30 },
        { term: 'tank', weight: 25 },
      ],
      secondary: [
        { term: 'fuel tank', weight: 10 },
        { term: 'tank monitoring', weight: 10 },
        { term: 'compliance', weight: 10 },
        { term: 'leak detector', weight: 10 },
        { term: 'tightness test', weight: 10 },
        { term: 'groundwater monitor', weight: 10 },
        { term: 'OSHA', weight: 10 },
        { term: 'EPA', weight: 10 },
      ],
      negative: [
        { term: 'plumber', weight: -60 },
        { term: 'plumbing', weight: -60 },
        { term: 'auto repair', weight: -60 },
        { term: 'auto parts', weight: -60 },
        { term: 'automotive', weight: -60 },
        { term: 'garage', weight: -60 },
        { term: 'brake', weight: -60 },
        { term: 'tune up', weight: -60 },
        { term: 'storage', weight: -60 },
        { term: 'mini storage', weight: -60 },
        { term: 'recycling', weight: -60 },
        { term: 'concrete', weight: -60 },
        { term: 'landscape', weight: -60 },
        { term: 'home inspection', weight: -60 },
        { term: 'mold', weight: -60 },
        { term: 'ready mix', weight: -60 },
        { term: 'transfer', weight: -50 },
        { term: 'environmental services', weight: -40 },
        { term: 'grill propane', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 20, contactEnrichmentWeight: 10, assetSignalWeight: 15 },
    createdAt: NOW,
    providers: createProviders([tomtom, overpass]),
  },

  elevator_inspection: {
    id: 'elevator_inspection',
    slug: 'elevator_inspection',
    industryName: 'Elevator Inspection & Certification',
    searchQueries: [
      'elevator inspection', 'elevator certification', 'lift safety testing'
    ],
    targetNaicsCodes: ['238290', '541350'],
    equipmentKeywords: [
      'load test weights', 'safety gear tester', 'door force gauge',
      'elevator leveling tool', 'car top inspection station'
    ],
    negativeKeywords: [
      'home stair lift', 'wheelchair lift', 'DIY repair',
      'escalator repair', 'conveyor', 'elevator sales', 'elevator installation'
    ],
    signals: {
      primary: [
        { term: 'elevator inspection', weight: 30 },
        { term: 'elevator testing', weight: 30 },
        { term: 'lift certification', weight: 30 },
        { term: 'elevator', weight: 25 },
      ],
      secondary: [
        { term: 'ASME', weight: 10 },
        { term: 'safety inspection', weight: 10 },
        { term: 'building compliance', weight: 10 },
        { term: 'load test', weight: 10 },
        { term: 'elevator certification', weight: 10 },
      ],
      negative: [
        { term: 'home stair lift', weight: -30 },
        { term: 'escalator', weight: -30 },
        { term: 'elevator sales', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 20, contactEnrichmentWeight: 10, assetSignalWeight: 15 },
    createdAt: NOW,
    providers: createProviders([tomtom, overpass]),
  },

  hvac_balance: {
    id: 'hvac_balance',
    slug: 'hvac_balance',
    industryName: 'HVAC Test & Balance',
    searchQueries: [
      'HVAC test and balance', 'air balance contractor',
      'commercial air balancing'
    ],
    targetNaicsCodes: ['238220'],
    equipmentKeywords: [
      'anemometer', 'manometer', 'flow hood',
      'balancing damper', 'air velocity meter'
    ],
    negativeKeywords: [
      'home AC repair', 'window unit', 'portable AC',
      'furnace repair', 'refrigeration', 'appliance repair',
      'thermostat replacement', 'mini split installation'
    ],
    signals: {
      primary: [
        { term: 'air balance', weight: 30 },
        { term: 'air balancing', weight: 30 },
        { term: 'HVAC balancing', weight: 30 },
        { term: 'test and balance', weight: 30 },
        { term: 'commercial HVAC', weight: 25 },
        { term: 'HVAC', weight: 20 },
      ],
      secondary: [
        { term: 'heating', weight: 10 },
        { term: 'air conditioning', weight: 10 },
        { term: 'CFM', weight: 10 },
        { term: 'airflow testing', weight: 10 },
        { term: 'TAB contractor', weight: 10 },
        { term: 'flow hood', weight: 10 },
        { term: 'anemometer', weight: 10 },
        { term: 'manometer', weight: 10 },
      ],
      negative: [
        { term: 'window AC', weight: -30 },
        { term: 'residential', weight: -40 },
        { term: 'furnace repair', weight: -30 },
        { term: 'refrigeration', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 20, contactEnrichmentWeight: 10, assetSignalWeight: 15 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
  },

  fire_sprinkler: {
    id: 'fire_sprinkler',
    slug: 'fire_sprinkler',
    industryName: 'Fire Sprinkler Pressure Testing',
    searchQueries: [
      'fire sprinkler testing', 'hydrostatic pressure test sprinkler',
      'commercial fire sprinkler inspection'
    ],
    targetNaicsCodes: ['238220', '561621'],
    equipmentKeywords: [
      'hydrostatic test pump', 'sprinkler head gauge', 'backflow preventer tester',
      'flow test kit', 'fire alarm panel'
    ],
    negativeKeywords: [
      'garden irrigation repair', 'residential lawn sprinkler system', 'plumbing drain unclogging',
      'sprinkler system installation', 'landscape irrigation', 'fire alarm',
      'fire extinguisher', 'security system'
    ],
    signals: {
      primary: [
        { term: 'fire sprinkler', weight: 30 },
        { term: 'sprinkler inspection', weight: 30 },
        { term: 'hydrostatic test', weight: 30 },
      ],
      secondary: [
        { term: 'NFPA 25', weight: 10 },
        { term: 'fire protection', weight: 10 },
        { term: 'alarm testing', weight: 10 },
        { term: 'flow test', weight: 10 },
        { term: 'backflow preventer', weight: 10 },
        { term: 'hydrostatic pump', weight: 10 },
      ],
      negative: [
        { term: 'lawn sprinkler', weight: -30 },
        { term: 'irrigation', weight: -30 },
        { term: 'fire alarm', weight: -30 },
        { term: 'landscape', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
  },

  fire_extinguisher: {
    id: 'fire_extinguisher',
    slug: 'fire_extinguisher',
    industryName: 'Fire Extinguisher Inspection & Filling',
    searchQueries: [
      'fire extinguisher service', 'fire extinguisher inspection',
      'fire extinguisher recharge', 'commercial fire protection',
      'fire safety equipment'
    ],
    targetNaicsCodes: ['423990', '561621', '811490'],
    equipmentKeywords: [
      'hydrostatic test unit', 'extinguisher fill station', 'dry chemical refill',
      'CO2 fill manifold', 'pressure gauge'
    ],
    negativeKeywords: [
      'buy smoke detector home', 'extinguisher mount bracket amazon', 'fire protection engineering degree',
      'fireplace', 'firewood', 'fire pit', 'fire alarm installation',
      'fire sprinkler', 'smoke detector', 'security system'
    ],
    signals: {
      primary: [
        { term: 'fire extinguisher', weight: 30 },
        { term: 'recharge', weight: 30 },
        { term: 'hydrotesting', weight: 30 },
        { term: 'fire', weight: 15 },
      ],
      secondary: [
        { term: 'NFPA 10', weight: 10 },
        { term: 'inspection tag', weight: 10 },
        { term: 'safety inspection', weight: 10 },
        { term: 'dry chemical', weight: 10 },
        { term: 'CO2 refill', weight: 10 },
        { term: 'extinguisher service', weight: 10 },
      ],
      negative: [
        { term: 'home extinguisher', weight: -30 },
        { term: 'fireplace', weight: -30 },
        { term: 'firewood', weight: -30 },
        { term: 'smoke detector', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 15, contactEnrichmentWeight: 10, assetSignalWeight: 20 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
  },

  kitchen_exhaust: {
    id: 'kitchen_exhaust',
    slug: 'kitchen_exhaust',
    industryName: 'Commercial Kitchen Hood Degreasing',
    searchQueries: [
      'restaurant hood cleaning', 'commercial kitchen cleaning',
      'hood exhaust cleaning', 'kitchen degreasing service',
      'hood suppression system'
    ],
    targetNaicsCodes: ['561790', '926150'],
    equipmentKeywords: [
      'pressure washer', 'hood filter cart', 'exhaust fan cleaning tool',
      'grease removal system', 'duct cleaning kit'
    ],
    negativeKeywords: [
      'residential kitchen hood filter replacement', 'home cleaning service', 'maid service',
      'chef', 'vegan', 'meal prep', 'food delivery', 'catering', 'private chef'
    ],
    signals: {
      primary: [
        { term: 'hood', weight: 30 },
        { term: 'kitchen', weight: 30 },
        { term: 'kitchen exhaust', weight: 30 },
        { term: 'hood cleaning', weight: 35 },
        { term: 'grease removal', weight: 25 },
      ],
      secondary: [
        { term: 'NFPA 96', weight: 10 },
        { term: 'restaurant', weight: 10 },
        { term: 'duct cleaning', weight: 10 },
        { term: 'pressure washer', weight: 10 },
        { term: 'exhaust cleaning', weight: 10 },
      ],
      negative: [
        { term: 'residential cleaning', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 20, contactEnrichmentWeight: 10, assetSignalWeight: 15 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
  },

  backflow_testing: {
    id: 'backflow_testing',
    slug: 'backflow_testing',
    industryName: 'Backflow Prevention Testing',
    searchQueries: [
      'commercial plumbing backflow', 'backflow testing service',
      'certified backflow tester', 'RPZ testing',
      'commercial backflow assembly inspector'
    ],
    targetNaicsCodes: ['238220', '541380'],
    equipmentKeywords: [
      'backflow test kit', 'pressure gauge', 'differential pressure meter',
      'RPZ tester', 'double check valve tester'
    ],
    negativeKeywords: [
      'residential water filtration pitcher', 'swimming pool backwash valve', 'sewer line replacement',
      'water heater repair', 'water softener installation', 'plumbing',
      'drain cleaning', 'sewer line', 'faucet repair', 'toilet repair'
    ],
    signals: {
      primary: [
        { term: 'backflow', weight: 30 },
        { term: 'RPZ', weight: 30 },
        { term: 'cross connection', weight: 30 },
      ],
      secondary: [
        { term: 'water testing', weight: 10 },
        { term: 'certified tester', weight: 10 },
        { term: 'assembly testing', weight: 10 },
        { term: 'backflow preventer', weight: 10 },
        { term: 'double check valve', weight: 10 },
        { term: 'pressure gauge', weight: 10 },
      ],
      negative: [
        { term: 'pool', weight: -30 },
        { term: 'home filter', weight: -30 },
        { term: 'water heater', weight: -30 },
        { term: 'plumbing', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 20, contactEnrichmentWeight: 10, assetSignalWeight: 15 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
  },

  generator_testing: {
    id: 'generator_testing',
    slug: 'generator_testing',
    industryName: 'Emergency Generator Load Bank Testing',
    searchQueries: [
      'generator load bank testing', 'emergency generator service',
      'commercial generator maintenance', 'backup power systems',
      'diesel generator service'
    ],
    targetNaicsCodes: ['811310', '238210'],
    equipmentKeywords: [
      'load bank', 'generator analyzer', 'transfer switch tester',
      'fuel polishing system', 'battery load tester'
    ],
    negativeKeywords: [
      'portable generator camping sales', 'rv generator repair', 'home solar backup installation',
      'solar installation', 'battery backup', 'inverter', 'UPS system',
      'home standby generator', 'generator sales'
    ],
    signals: {
      primary: [
        { term: 'generator testing', weight: 30 },
        { term: 'load bank', weight: 30 },
        { term: 'emergency generator', weight: 30 },
        { term: 'generator', weight: 20 },
      ],
      secondary: [
        { term: 'NFPA 110', weight: 10 },
        { term: 'backup power', weight: 10 },
        { term: 'diesel generator', weight: 10 },
        { term: 'transfer switch', weight: 10 },
        { term: 'fuel polishing', weight: 10 },
        { term: 'load bank test', weight: 10 },
        { term: 'OSHA', weight: 10 },
      ],
      negative: [
        { term: 'camping generator', weight: -30 },
        { term: 'portable generator', weight: -30 },
        { term: 'solar', weight: -30 },
        { term: 'battery backup', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createProviders([tomtom, overpass]),
  }
};

export async function getVerticalConfigByDomain(contextHeaderValue: string): Promise<VerticalConfigWithProviders | null> {
  const cleanKey = contextHeaderValue.trim().toLowerCase();
  return VERTICAL_REGISTRY[cleanKey] || null;
}

export function isIrrelevant(company: Partial<{ companyName?: string; address?: string }>, negativeKeywords: string[]): boolean {
  const nameText = (company.companyName || '').toLowerCase();
  return negativeKeywords.some(neg => {
    const regex = new RegExp(`\\b${neg.toLowerCase()}\\b`);
    return regex.test(nameText);
  });
}
