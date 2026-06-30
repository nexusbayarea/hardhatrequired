import { VerticalConfig } from '@/types/config';
import { DiscoveryProvider } from './providers/base';
import { RegulatoryProvider } from './providers/regulatory';
import { GooglePlacesProvider } from './providers/google';
import { TomTomProvider } from './providers/tomtom';
import { OverpassProvider } from './providers/overpass';

const regulatory = new RegulatoryProvider();
const google = new GooglePlacesProvider();
const tomtom = new TomTomProvider();
const overpass = new OverpassProvider();

export interface VerticalConfigWithProviders extends VerticalConfig {
  providers: DiscoveryProvider[];
}

export function createProviders(extra: DiscoveryProvider[] = []): DiscoveryProvider[] {
  return [regulatory, google, ...extra];
}

export function createSearchOnlyProviders(extra: DiscoveryProvider[] = []): DiscoveryProvider[] {
  return [google, ...extra];
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
      'concrete recycling',
      'concrete disposal',
      'construction waste removal',
      'demolition contractor',
      'waste management service'
    ],
    targetNaicsCodes: ['562211', '238110', '562112'],
    equipmentKeywords: [
      'filter press', 'dewatering box', 'centrifuge', 'slurry tanker',
      'vacuum truck', 'concrete recycling plant', 'slurry press'
    ],
    negativeKeywords: [
      'landscaping', 'gardening', 'lawn', 'tree service', 'florist',
      'residential', 'cleaning', 'municipal dump', 'residential landfill',
      'household waste', 'DIY concrete mix', 'city recycle station',
      'garbage collection', 'junk removal', 'paving'
    ],
    signals: {
      primary: [
        { term: 'slurry', weight: 25 },
        { term: 'concrete', weight: 25 },
        { term: 'concrete washout', weight: 25 },
        { term: 'concrete slurry', weight: 25 },
        { term: 'wash water', weight: 25 },
        { term: 'slurry recycling', weight: 25 },
      ],
      secondary: [
        { term: 'dewatering', weight: 10 },
        { term: 'filter press', weight: 10 },
        { term: 'roll off', weight: 10 },
        { term: 'vacuum truck', weight: 10 },
        { term: 'pump', weight: 10 },
        { term: 'OSHA', weight: 10 },
        { term: 'EPA', weight: 10 },
      ],
      negative: [
        { term: 'driveway', weight: -30 },
        { term: 'residential', weight: -30 },
        { term: 'home repair', weight: -30 },
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
      'residential', 'cleaning service', 'handyman'
    ],
    signals: {
      primary: [
        { term: 'grease', weight: 25 },
        { term: 'grease trap', weight: 25 },
        { term: 'grease interceptor', weight: 25 },
        { term: 'FOG', weight: 25 },
      ],
      secondary: [
        { term: 'pumping', weight: 10 },
        { term: 'wastewater', weight: 10 },
        { term: 'hydro jetting', weight: 10 },
        { term: 'vacuum truck', weight: 10 },
        { term: 'restaurant service', weight: 10 },
        { term: 'OSHA', weight: 10 },
      ],
      negative: [
        { term: 'concrete', weight: -60 },
        { term: 'recycling', weight: -60 },
        { term: 'landscape', weight: -50 },
        { term: 'restoration', weight: -50 },
        { term: 'home kitchen', weight: -30 },
        { term: 'cooking oil', weight: -30 },
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
      'carpet cleaning', 'property management'
    ],
    signals: {
      primary: [
        { term: 'asbestos', weight: 25 },
        { term: 'lead abatement', weight: 25 },
        { term: 'hazmat remediation', weight: 25 },
        { term: 'environmental remediation', weight: 25 },
      ],
      secondary: [
        { term: 'containment', weight: 10 },
        { term: 'demolition', weight: 10 },
        { term: 'air monitoring', weight: 10 },
        { term: 'encapsulation', weight: 10 },
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
    providers: createSearchOnlyProviders([tomtom, overpass]),
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
      'residential', 'gardening'
    ],
    signals: {
      primary: [
        { term: 'excavation', weight: 25 },
        { term: 'hydro excavation', weight: 25 },
        { term: 'vacuum excavation', weight: 25 },
        { term: 'hydrovac', weight: 25 },
        { term: 'non-destructive digging', weight: 25 },
      ],
      secondary: [
        { term: 'utility potholing', weight: 10 },
        { term: 'daylighting', weight: 10 },
        { term: 'slurry excavation', weight: 10 },
        { term: 'vactor', weight: 10 },
        { term: 'OSHA', weight: 10 },
        { term: 'EPA', weight: 10 },
      ],
      negative: [
        { term: 'landscaping', weight: -30 },
        { term: 'backyard trenching', weight: -30 },
        { term: 'sprinkler installation', weight: -30 },
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
      'home inspector', 'real estate'
    ],
    signals: {
      primary: [
        { term: 'commercial roofing', weight: 25 },
        { term: 'flat roof', weight: 25 },
        { term: 'TPO roofing', weight: 25 },
        { term: 'industrial roofing', weight: 25 },
      ],
      secondary: [
        { term: 'roof membrane', weight: 10 },
        { term: 'built-up roofing', weight: 10 },
        { term: 'EPDM roofing', weight: 10 },
      ],
      negative: [
        { term: 'residential shingle', weight: -30 },
        { term: 'gutter cleaning', weight: -30 },
        { term: 'handyman', weight: -30 },
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
      'medical supply store', 'hospital'
    ],
    signals: {
      primary: [
        { term: 'medical waste', weight: 25 },
        { term: 'biohazard disposal', weight: 25 },
        { term: 'sharps disposal', weight: 25 },
        { term: 'regulated medical waste', weight: 25 },
      ],
      secondary: [
        { term: 'clinical waste', weight: 10 },
        { term: 'infectious waste', weight: 10 },
        { term: 'pathological waste', weight: 10 },
      ],
      negative: [
        { term: 'pharmacy', weight: -30 },
        { term: 'dental clinic', weight: -30 },
        { term: 'home health aid', weight: -30 },
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
      'appliance repair', 'electronics repair'
    ],
    signals: {
      primary: [
        { term: 'scrap metal', weight: 25 },
        { term: 'metal recycling', weight: 25 },
        { term: 'ferrous scrap', weight: 25 },
        { term: 'non-ferrous scrap', weight: 25 },
      ],
      secondary: [
        { term: 'metal processing', weight: 10 },
        { term: 'scrap yard', weight: 10 },
        { term: 'metal shredding', weight: 10 },
      ],
      negative: [
        { term: 'used car', weight: -30 },
        { term: 'auto salvage', weight: -30 },
        { term: 'mechanic shop', weight: -30 },
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
      'fishing charter', 'boat storage'
    ],
    signals: {
      primary: [
        { term: 'marine construction', weight: 25 },
        { term: 'seawall', weight: 25 },
        { term: 'bulkhead', weight: 25 },
        { term: 'dock building', weight: 25 },
      ],
      secondary: [
        { term: 'commercial dredging', weight: 10 },
        { term: 'pile driving', weight: 10 },
        { term: 'marine infrastructure', weight: 10 },
      ],
      negative: [
        { term: 'boat rental', weight: -30 },
        { term: 'jet ski rental', weight: -30 },
        { term: 'residential dock', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
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
      'concrete foundation contractor'
    ],
    targetNaicsCodes: ['238110', '327320'],
    equipmentKeywords: [
      'concrete pump', 'concrete mixer', 'concrete batch plant',
      'concrete saw', 'power trowel', 'concrete form'
    ],
    negativeKeywords: [
      'residential driveway', 'home repair', 'handyman',
      'concrete bags retail', 'decorative concrete', 'stamped concrete patio'
    ],
    signals: {
      primary: [
        { term: 'concrete contractor', weight: 25 },
        { term: 'concrete pumping', weight: 25 },
        { term: 'ready mix', weight: 25 },
        { term: 'concrete foundation', weight: 25 },
        { term: 'commercial concrete', weight: 25 },
      ],
      secondary: [
        { term: 'concrete pump', weight: 10 },
        { term: 'concrete mixer', weight: 10 },
        { term: 'concrete batch plant', weight: 10 },
      ],
      negative: [
        { term: 'residential driveway', weight: -30 },
        { term: 'decorative concrete', weight: -30 },
        { term: 'stamped concrete patio', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
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
      'rain gutter cleaning', 'residential drainage', 'home waterproofing'
    ],
    signals: {
      primary: [
        { term: 'SWPPP', weight: 25 },
        { term: 'stormwater', weight: 25 },
        { term: 'compliance', weight: 25 },
        { term: 'erosion control', weight: 25 },
      ],
      secondary: [
        { term: 'BMP', weight: 10 },
        { term: 'NPDES', weight: 10 },
        { term: 'runoff', weight: 10 },
        { term: 'environmental', weight: 10 },
        { term: 'EPA', weight: 10 },
        { term: 'OSHA', weight: 10 },
      ],
      negative: [
        { term: 'gutter cleaning', weight: -30 },
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
      'residential septic repair', 'pool cleaning', 'home plumbing'
    ],
    signals: {
      primary: [
        { term: 'wastewater', weight: 25 },
        { term: 'industrial wastewater', weight: 25 },
        { term: 'wastewater treatment', weight: 25 },
        { term: 'pretreatment', weight: 25 },
      ],
      secondary: [
        { term: 'filtration', weight: 10 },
        { term: 'clarifier', weight: 10 },
        { term: 'discharge permit', weight: 10 },
        { term: 'EPA', weight: 10 },
        { term: 'OSHA', weight: 10 },
        { term: 'NPDES', weight: 10 },
      ],
      negative: [
        { term: 'home septic', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 15, contactEnrichmentWeight: 10, assetSignalWeight: 20 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
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
      'propane grill tank refill', 'home fuel tank', 'tank toys'
    ],
    signals: {
      primary: [
        { term: 'tank', weight: 25 },
        { term: 'UST', weight: 25 },
        { term: 'tank testing', weight: 25 },
        { term: 'leak detection', weight: 25 },
      ],
      secondary: [
        { term: 'compliance', weight: 10 },
        { term: 'fuel tank', weight: 10 },
        { term: 'tank monitoring', weight: 10 },
        { term: 'EPA', weight: 10 },
        { term: 'OSHA', weight: 10 },
      ],
      negative: [
        { term: 'recycling', weight: -60 },
        { term: 'concrete', weight: -60 },
        { term: 'landscape', weight: -60 },
        { term: 'ready mix', weight: -60 },
        { term: 'transfer', weight: -50 },
        { term: 'environmental services', weight: -40 },
        { term: 'grill propane', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 20, contactEnrichmentWeight: 10, assetSignalWeight: 15 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
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
      'home stair lift', 'wheelchair lift', 'DIY repair'
    ],
    signals: {
      primary: [
        { term: 'elevator', weight: 25 },
        { term: 'elevator inspection', weight: 25 },
        { term: 'lift certification', weight: 25 },
        { term: 'elevator testing', weight: 25 },
      ],
      secondary: [
        { term: 'ASME', weight: 10 },
        { term: 'safety inspection', weight: 10 },
        { term: 'building compliance', weight: 10 },
      ],
      negative: [
        { term: 'home stair lift', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 20, contactEnrichmentWeight: 10, assetSignalWeight: 15 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
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
      'home AC repair', 'window unit', 'portable AC'
    ],
    signals: {
      primary: [
        { term: 'test and balance', weight: 25 },
        { term: 'air balancing', weight: 25 },
        { term: 'HVAC balancing', weight: 25 },
      ],
      secondary: [
        { term: 'CFM', weight: 10 },
        { term: 'airflow testing', weight: 10 },
        { term: 'TAB contractor', weight: 10 },
      ],
      negative: [
        { term: 'window AC', weight: -30 },
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
      'garden irrigation repair', 'residential lawn sprinkler system', 'plumbing drain unclogging'
    ],
    signals: {
      primary: [
        { term: 'fire sprinkler', weight: 25 },
        { term: 'hydrostatic test', weight: 25 },
        { term: 'sprinkler inspection', weight: 25 },
      ],
      secondary: [
        { term: 'NFPA 25', weight: 10 },
        { term: 'fire protection', weight: 10 },
        { term: 'alarm testing', weight: 10 },
      ],
      negative: [
        { term: 'lawn sprinkler', weight: -30 },
        { term: 'irrigation', weight: -30 },
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
      'buy smoke detector home', 'extinguisher mount bracket amazon', 'fire protection engineering degree'
    ],
    signals: {
      primary: [
        { term: 'fire', weight: 25 },
        { term: 'fire extinguisher', weight: 25 },
        { term: 'recharge', weight: 25 },
        { term: 'hydrotesting', weight: 25 },
      ],
      secondary: [
        { term: 'NFPA 10', weight: 10 },
        { term: 'inspection tag', weight: 10 },
        { term: 'safety inspection', weight: 10 },
      ],
      negative: [
        { term: 'home extinguisher', weight: -30 },
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
      'residential kitchen hood filter replacement', 'home cleaning service', 'maid service'
    ],
    signals: {
      primary: [
        { term: 'hood', weight: 25 },
        { term: 'kitchen', weight: 25 },
        { term: 'kitchen exhaust', weight: 25 },
        { term: 'hood cleaning', weight: 25 },
        { term: 'grease removal', weight: 25 },
      ],
      secondary: [
        { term: 'NFPA 96', weight: 10 },
        { term: 'restaurant', weight: 10 },
        { term: 'duct cleaning', weight: 10 },
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
      'residential water filtration pitcher', 'swimming pool backwash valve', 'sewer line replacement'
    ],
    signals: {
      primary: [
        { term: 'backflow', weight: 25 },
        { term: 'RPZ', weight: 25 },
        { term: 'cross connection', weight: 25 },
      ],
      secondary: [
        { term: 'water testing', weight: 10 },
        { term: 'certified tester', weight: 10 },
        { term: 'assembly testing', weight: 10 },
      ],
      negative: [
        { term: 'pool', weight: -30 },
        { term: 'home filter', weight: -30 },
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
      'portable generator camping sales', 'rv generator repair', 'home solar backup installation'
    ],
    signals: {
      primary: [
        { term: 'generator', weight: 25 },
        { term: 'generator testing', weight: 25 },
        { term: 'load bank', weight: 25 },
        { term: 'emergency generator', weight: 25 },
      ],
      secondary: [
        { term: 'NFPA 110', weight: 10 },
        { term: 'backup power', weight: 10 },
        { term: 'diesel generator', weight: 10 },
        { term: 'OSHA', weight: 10 },
      ],
      negative: [
        { term: 'camping generator', weight: -30 },
        { term: 'portable generator', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
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
