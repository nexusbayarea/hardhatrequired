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
  slurry_processing: {
    id: 'slurry_processing',
    slug: 'slurry_processing',
    industryName: 'Environmental Drilling Service',
    searchQueries: [
      'concrete washout management contractor',
      'slurry recycling service',
      'concrete pH neutralization service',
      'SWPPP concrete washout compliance',
      'ready mix reclaimer contractor',
      'concrete washout service',
      'slurry disposal',
      'concrete recycling',
      'vacuum truck service',
      'core drilling',
    ],
    targetNaicsCodes: ['562211', '238110', '562112', '238910', '238990', '562119'],
    disposalQueries: ['slurry liquid waste disposal', 'concrete washout disposal facility', 'slurry recycling plant', 'concrete pH neutralization dump', 'washout collection yard'],
    equipmentKeywords: [
      'filter press', 'dewatering box', 'centrifuge', 'slurry tanker',
      'vacuum truck', 'concrete recycling plant', 'slurry press',
      'concrete saw', 'core drill', 'wall saw', 'slab saw',
      'hydro vac', 'concrete grinder', 'reclaimer'
    ],
    negativeKeywords: [
      'residential', 'driveway', 'handyman', 'home repair',
      'home kitchen', 'landscaping', 'home improvement',
      'tire', 'truck parking', 'auto repair', 'truck stop',
      'parking lot', 'storage unit', 'car wash', 'trucking',
      'logistics', 'warehouse',
    ],
    signals: {
      primary: [
        { term: 'slurry', weight: 50 },
        { term: 'concrete washout', weight: 45 },
        { term: 'pH neutralization', weight: 40 },
        { term: 'ready mix reclaimer', weight: 40 },
        { term: 'washout', weight: 35 },
        { term: 'SWPPP', weight: 35 },
        { term: 'concrete recycling', weight: 30 },
        { term: 'vacuum truck', weight: 30 },
        { term: 'core drilling', weight: 30 },
        { term: 'wastewater', weight: 25 },
      ],
      secondary: [
        { term: 'concrete', weight: 15 },
        { term: 'environmental drilling', weight: 15 },
        { term: 'recycling', weight: 12 },
        { term: 'filtration', weight: 12 },
        { term: 'reclaimer', weight: 10 },
        { term: 'compliance', weight: 10 },
        { term: 'pH', weight: 8 },
        { term: 'environmental', weight: 10 },
      ],
      negative: [
        { term: 'residential', weight: -50 },
        { term: 'driveway', weight: -40 },
        { term: 'handyman', weight: -60 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createProviders([tomtom, overpass]),
    matrixNode: { labor: 'Concrete cutting, core drilling, saw cutting, concrete grinding, demolition', disposal: 'Slurry dewatering/recycling, washout collection, filtration, filter press operations' },
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
    disposalQueries: ['asbestos waste disposal', 'hazmat waste transport', 'regulated asbestos disposal facility', 'hazardous waste landfill'],
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
    matrixNode: { labor: 'Asbestos remediation, lead paint abatement, hazmat containment, air monitoring', disposal: 'Regulated asbestos waste transport, permitted hazmat landfill disposal' },
  },

  hydro_excavation: {
    id: 'hydro_excavation',
    slug: 'hydro_excavation',
    industryName: 'Hydro-Excavation & Non-Destructive Digging',
    searchQueries: [
      'excavation contractor', 'utility contractor',
      'hydro excavation service', 'vacuum truck service',
      'trenching services', 'underground construction',
      'site preparation contractor'
    ],
    targetNaicsCodes: ['562998', '238910', '562119'],
    disposalQueries: ['slurry disposal facility', 'hydro excavation spoils disposal', 'vacuum truck waste disposal', 'construction site dewatering disposal'],
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
    matrixNode: { labor: 'Hydro excavation, potholing, daylighting, utility exposure, non-destructive digging', disposal: 'Spoils disposal, slurry containment, water management' },
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
    disposalQueries: ['regulated medical waste disposal', 'biohazard incineration', 'medical waste treatment facility', 'sharps disposal facility'],
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
    matrixNode: { labor: 'Medical waste collection, biohazard cleanup, sharps disposal, clinical waste pickup', disposal: 'Autoclave sterilization, regulated medical waste incineration, treatment' },
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
    disposalQueries: ['dredge spoils disposal facility', 'marine debris disposal', 'hazardous waste marine', 'construction debris disposal waterfront'],
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
    matrixNode: { labor: 'Pile driving, seawall construction, bulkhead installation, dredging, dock building', disposal: 'Dredge spoils disposal, marine debris management, sheet piling removal' },
  },

  industrial_demolition: {
    id: 'industrial_demolition',
    slug: 'industrial_demolition',
    industryName: 'Heavy Demolition & Structural Crews',
    searchQueries: [
      'concrete contractor commercial', 'concrete pumping service',
      'ready mix concrete delivery', 'industrial concrete work',
      'concrete foundation contractor', 'concrete recycling',
      'concrete crushing service'
    ],
    targetNaicsCodes: ['238110', '327320', '423320'],
    disposalQueries: ['concrete recycling facility', 'concrete crushing disposal', 'demolition debris disposal', 'concrete dump site'],
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
    matrixNode: { labor: 'Industrial demolition, concrete breaking, selective demolition, building implosion', disposal: 'Demolition debris processing, concrete crushing, landfill disposal' },
  },

  stormwater_compliance: {
    id: 'stormwater_compliance',
    slug: 'stormwater_compliance',
    industryName: 'Stormwater Compliance / SWPPP',
    searchQueries: [
      'stormwater compliance', 'SWPPP inspection',
      'environmental consulting', 'erosion control service',
      'stormwater management', 'environmental engineer',
      'civil engineering'
    ],
    targetNaicsCodes: ['541620', '562910'],
    disposalQueries: ['stormwater treatment facility', 'sediment disposal', 'erosion control waste disposal', 'stormwater basin cleaning'],
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
    matrixNode: { labor: 'SWPPP development, stormwater inspections, compliance monitoring, erosion control', disposal: 'Stormwater treatment, sediment basin cleaning, silt removal, erosion control installation' },
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
    disposalQueries: ['industrial wastewater disposal', 'sludge disposal facility', 'wastewater treatment disposal', 'effluent discharge'],
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
    matrixNode: { labor: 'Industrial wastewater treatment, process water management, pH adjustment, filtration', disposal: 'Treated effluent discharge, sludge dewatering, wastewater hauling' },
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
    disposalQueries: ['UST removal disposal', 'tank recycling', 'fuel tank disposal facility', 'underground tank removal'],
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
    matrixNode: { labor: 'UST testing, tank tightness testing, leak detection, cathodic protection testing', disposal: 'Tank removal, disposal, soil remediation, groundwater monitoring' },
  },

  elevator_inspection: {
    id: 'elevator_inspection',
    slug: 'elevator_inspection',
    industryName: 'Elevator Inspection & Certification',
    searchQueries: [
      'elevator inspection', 'elevator certification', 'lift safety testing'
    ],
    targetNaicsCodes: ['238290', '541350'],
    disposalQueries: ['elevator disposal', 'elevator removal service', 'obsolete elevator recycling'],
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
    matrixNode: { labor: 'Elevator safety inspection, certification, load testing, ASME compliance', disposal: 'Elevator modernization, obsolete equipment removal' },
  },

  hvac_industrial: {
    id: 'hvac_industrial',
    slug: 'hvac_industrial',
    industryName: 'Industrial HVAC/R Field Technicians',
    searchQueries: [
      'HVAC test and balance', 'air balance contractor',
      'commercial air balancing'
    ],
    targetNaicsCodes: ['238220'],
    disposalQueries: ['HVAC equipment disposal', 'refrigerant recovery', 'commercial HVAC recycling'],
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
    matrixNode: { labor: 'HVAC test and balance, air balancing, TAB services, airflow measurement', disposal: 'HVAC equipment disposal, refrigerant recovery, ductwork removal' },
  },

  fire_sprinklers: {
    id: 'fire_sprinklers',
    slug: 'fire_sprinklers',
    industryName: 'Fire Sprinkler Fitters & Installers',
    searchQueries: [
      'fire sprinkler testing', 'hydrostatic pressure test sprinkler',
      'commercial fire sprinkler inspection'
    ],
    targetNaicsCodes: ['238220', '561621'],
    disposalQueries: ['fire sprinkler disposal', 'sprinkler system decommissioning', 'fire protection recycling'],
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
    matrixNode: { labor: 'Fire sprinkler hydrostatic testing, flow testing, NFPA 25 inspection', disposal: 'Sprinkler system decommissioning, obsolete component recycling' },
  },

  generator_testing: {
    id: 'generator_testing',
    slug: 'generator_testing',
    industryName: 'Emergency Generator Load Bank Testing',
    searchQueries: [
      'emergency generator service', 'commercial generator maintenance',
      'diesel generator service', 'backup power systems',
      'generator technician', 'generator repair commercial'
    ],
    targetNaicsCodes: ['811310', '238210'],
    disposalQueries: ['generator disposal facility', 'battery recycling center', 'fuel tank removal service', 'hazardous waste disposal generator'],
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
    matrixNode: { labor: 'Generator load bank testing, NFPA 110 compliance, emergency power testing', disposal: 'Generator decommissioning, fuel polishing waste disposal, battery recycling' },
  },

  high_voltage_electrical: {
    id: 'high_voltage_electrical',
    slug: 'high_voltage_electrical',
    industryName: 'High-Voltage Electrical Testing & Maintenance',
    searchQueries: ['high voltage testing service', 'electrical maintenance contractor', 'transformer testing service', 'switchgear testing', 'power distribution testing'],
    disposalQueries: ['transformer disposal facility', 'PCB disposal facility', 'electrical equipment recycling', 'hazardous waste electrical', 'scrap metal recycling electrical'],
    targetNaicsCodes: ['238210', '238990', '541350'],
    equipmentKeywords: ['megohmmeter', 'power factor test set', 'DC hi-pot tester', 'circuit breaker analyzer', 'relay test set', 'thermographic camera'],
    negativeKeywords: ['home electrical repair', 'residential electrician', 'lighting installation', 'ceiling fan', 'outlet repair', 'home automation', 'low voltage', 'alarm system', 'security camera'],
    signals: {
      primary: [
        { term: 'high voltage', weight: 30 },
        { term: 'transformer testing', weight: 30 },
        { term: 'switchgear testing', weight: 30 },
        { term: 'electrical testing', weight: 25 },
      ],
      secondary: [
        { term: 'NFPA 70E', weight: 10 },
        { term: 'power factor', weight: 10 },
        { term: 'circuit breaker', weight: 10 },
        { term: 'protective relay', weight: 10 },
        { term: 'cable testing', weight: 10 },
        { term: 'partial discharge', weight: 10 },
        { term: 'OSHA', weight: 10 },
      ],
      negative: [
        { term: 'home electrical', weight: -30 },
        { term: 'residential', weight: -40 },
        { term: 'low voltage', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
    matrixNode: { labor: 'High voltage testing, transformer maintenance, switchgear testing, cable testing, NFPA 70E compliance', disposal: 'PCB transformer disposal, SF6 recycling, decommissioned equipment recycling' },
  },

  trench_shoring: {
    id: 'trench_shoring',
    slug: 'trench_shoring',
    industryName: 'Trench Shoring & Excavation Safety',
    searchQueries: ['trench shoring rental', 'shoring contractor', 'excavation safety', 'slide rail system', 'trench box rental'],
    disposalQueries: ['shoring equipment disposal', 'steel shoring recycling', 'construction equipment disposal'],
    targetNaicsCodes: ['532490', '238910', '238990'],
    equipmentKeywords: ['hydraulic shore', 'slide rail', 'trench box', 'aluminum hydraulic shore', 'manhole shield', 'municipal shore'],
    negativeKeywords: ['residential landscaping', 'hand digging', 'pool installation', 'foundation repair', 'backfill', 'sprinkler installation'],
    signals: {
      primary: [
        { term: 'trench shoring', weight: 30 },
        { term: 'shoring', weight: 25 },
        { term: 'slide rail', weight: 30 },
        { term: 'trench box', weight: 30 },
      ],
      secondary: [
        { term: 'excavation safety', weight: 10 },
        { term: 'hydraulic shore', weight: 10 },
        { term: 'manhole shield', weight: 10 },
        { term: 'aluminum shore', weight: 10 },
        { term: 'OSHA', weight: 15 },
        { term: 'CalOSHA', weight: 15 },
        { term: 'competent person', weight: 10 },
      ],
      negative: [
        { term: 'landscaping', weight: -30 },
        { term: 'foundation', weight: -30 },
        { term: 'pool', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 20, contactEnrichmentWeight: 10, assetSignalWeight: 15 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
    matrixNode: { labor: 'Trench shoring, slide rail systems, hydraulic shores, trench boxes, excavation safety, CalOSHA compliance', disposal: 'Shoring equipment decontamination, steel recycling, HDPE shoring disposal' },
  },

  sandblasting: {
    id: 'sandblasting',
    slug: 'sandblasting',
    industryName: 'Blasting & Industrial Coating Painters',
    searchQueries: ['industrial sandblasting', 'abrasive blasting contractor', 'surface preparation contractor', 'sandblasting service', 'industrial coating removal'],
    disposalQueries: ['spent abrasive disposal', 'blasting media disposal', 'hazardous abrasive waste disposal', 'sandblasting waste disposal', 'industrial waste disposal sandblasting'],
    targetNaicsCodes: ['238320', '238990', '562910'],
    equipmentKeywords: ['abrasive blaster', 'dustless blasting', 'vacuum blasting', 'silica sand', 'steel shot', 'soda blaster', 'hydro blaster'],
    negativeKeywords: ['home painting', 'furniture refinishing', 'brick cleaning', 'art restoration', 'car restoration', 'DIY blasting', 'sandblasting cabinet'],
    signals: {
      primary: [
        { term: 'sandblasting', weight: 30 },
        { term: 'abrasive blasting', weight: 30 },
        { term: 'surface preparation', weight: 25 },
        { term: 'industrial blasting', weight: 30 },
      ],
      secondary: [
        { term: 'dustless blasting', weight: 10 },
        { term: 'vacuum blasting', weight: 10 },
        { term: 'steel shot', weight: 10 },
        { term: 'coating removal', weight: 10 },
        { term: 'lead abatement', weight: 15 },
        { term: 'hydro blasting', weight: 10 },
        { term: 'OSHA', weight: 10 },
      ],
      negative: [
        { term: 'home', weight: -30 },
        { term: 'furniture', weight: -30 },
        { term: 'art', weight: -30 },
        { term: 'cabinet', weight: -30 },
        { term: 'car detail', weight: -30 },
        { term: 'concrete polishing', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
    matrixNode: { labor: 'Abrasive blasting, sandblasting, surface preparation, industrial coating removal, lead paint abatement', disposal: 'Spent abrasive disposal, hazardous media transport, EPA TCLP compliant disposal' },
  },

  dewatering: {
    id: 'dewatering',
    slug: 'dewatering',
    industryName: 'Wellpoint & High-Volume Pump Techs',
    searchQueries: ['construction dewatering', 'bypass pumping service', 'wellpoint dewatering', 'groundwater control', 'pump rental dewatering'],
    disposalQueries: ['sediment disposal', 'dewatering discharge', 'filtered water disposal', 'construction site dewatering disposal'],
    targetNaicsCodes: ['238910', '532490', '237110'],
    equipmentKeywords: ['submersible pump', 'wellpoint system', 'dewatering pump', 'bypass pump', 'centrifugal pump', 'diesel pump', 'hydraulic submersible'],
    negativeKeywords: ['septic pumping', 'pool pump', 'water feature', 'irrigation pump', 'residential sump pump', 'pond aerator', 'sewage ejector'],
    signals: {
      primary: [
        { term: 'dewatering', weight: 30 },
        { term: 'bypass pumping', weight: 30 },
        { term: 'wellpoint', weight: 30 },
        { term: 'groundwater control', weight: 25 },
      ],
      secondary: [
        { term: 'construction dewatering', weight: 15 },
        { term: 'pump rental', weight: 10 },
        { term: 'submersible pump', weight: 10 },
        { term: 'centrifugal pump', weight: 10 },
        { term: 'diesel pump', weight: 10 },
        { term: 'NPDES', weight: 10 },
        { term: 'OSHA', weight: 10 },
      ],
      negative: [
        { term: 'septic', weight: -50 },
        { term: 'pool', weight: -30 },
        { term: 'irrigation', weight: -30 },
        { term: 'residential sump', weight: -30 },
        { term: 'sewer', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 15, contactEnrichmentWeight: 10, assetSignalWeight: 20 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
    matrixNode: { labor: 'Construction dewatering, wellpoint systems, bypass pumping, groundwater control, trench dewatering', disposal: 'Sediment basin discharge, filtration treatment, NPDEs permitted outfall discharge' },
  },

  hazardous_soil_remediation: {
    id: 'hazardous_soil_remediation',
    slug: 'hazardous_soil_remediation',
    industryName: 'Hazmat Soil Remediation Operators',
    searchQueries: ['contaminated soil removal', 'hazardous soil remediation', 'environmental remediation contractor', 'soil excavation', 'brownfield remediation'],
    disposalQueries: ['contaminated soil disposal facility', 'hazardous waste landfill', 'soil treatment facility', 'RCRA disposal facility', 'environmental remediation disposal'],
    targetNaicsCodes: ['562910', '562211', '562219'],
    equipmentKeywords: ['excavator', 'soil vapor extraction', 'bio-remediation', 'thermal desorption', 'soil washing plant', 'air sparge', 'vacuum truck'],
    negativeKeywords: ['landscaping', 'topsoil delivery', 'compost', 'mulch', 'garden soil', 'lawn care', 'organic farming', 'landfill general'],
    signals: {
      primary: [
        { term: 'contaminated soil', weight: 30 },
        { term: 'soil remediation', weight: 30 },
        { term: 'hazardous soil', weight: 30 },
        { term: 'environmental remediation', weight: 25 },
      ],
      secondary: [
        { term: 'soil excavation', weight: 10 },
        { term: 'brownfield', weight: 10 },
        { term: 'soil vapor', weight: 10 },
        { term: 'bio-remediation', weight: 10 },
        { term: 'thermal desorption', weight: 10 },
        { term: 'soil washing', weight: 10 },
        { term: 'EPA', weight: 10 },
        { term: 'DTSC', weight: 10 },
        { term: 'RCRA', weight: 10 },
      ],
      negative: [
        { term: 'landscape', weight: -40 },
        { term: 'topsoil', weight: -30 },
        { term: 'compost', weight: -30 },
        { term: 'lawn', weight: -30 },
        { term: 'garden', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createProviders([tomtom, overpass]),
    matrixNode: { labor: 'Soil excavation, contaminated soil removal, site remediation, bio-remediation', disposal: 'Hazmat soil transport, TSCA/RCRA permitted landfill disposal, thermal treatment' },
  },

  solar_infrastructure: {
    id: 'solar_infrastructure',
    slug: 'solar_infrastructure',
    industryName: 'Utility-Scale Solar PV Electricians',
    searchQueries: ['commercial solar installation', 'industrial solar contractor', 'solar PV system design', 'large scale solar', 'commercial solar panel installation'],
    disposalQueries: ['solar panel recycling facility', 'PV module disposal', 'electronic waste recycling', 'solar equipment disposal', 'hazardous waste solar'],
    targetNaicsCodes: ['238210', '221114', '423690'],
    equipmentKeywords: ['PV panel', 'inverter', 'solar tracker', 'transformer', 'breaker panel', 'solar racking', 'power optimizer'],
    negativeKeywords: ['residential solar', 'home solar panel', 'solar attic fan', 'solar water heater', 'diy solar', 'solar garden light', 'rv solar'],
    signals: {
      primary: [
        { term: 'commercial solar', weight: 30 },
        { term: 'solar installation', weight: 30 },
        { term: 'solar PV', weight: 30 },
        { term: 'industrial solar', weight: 30 },
      ],
      secondary: [
        { term: 'PV panel', weight: 10 },
        { term: 'inverter', weight: 10 },
        { term: 'solar tracker', weight: 10 },
        { term: 'solar racking', weight: 10 },
        { term: 'breaker panel', weight: 10 },
        { term: 'transformer', weight: 10 },
        { term: 'electrical contractor', weight: 10 },
        { term: 'OSHA', weight: 10 },
      ],
      negative: [
        { term: 'residential', weight: -40 },
        { term: 'home solar', weight: -30 },
        { term: 'diy', weight: -30 },
        { term: 'solar water heater', weight: -30 },
        { term: 'garden', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
    matrixNode: { labor: 'Solar PV installation, commercial solar mounting, electrical integration, inverter commissioning', disposal: 'Decommissioned panel recycling, inverter disposal, racking scrap metal recovery' },
  },

  wind_infrastructure: {
    id: 'wind_infrastructure',
    slug: 'wind_infrastructure',
    industryName: 'Wind Turbine Field Technicians',
    searchQueries: ['wind turbine maintenance', 'wind farm service', 'turbine generator testing', 'wind energy contractor', 'commercial wind service'],
    disposalQueries: ['wind turbine disposal', 'blade recycling facility', 'turbine decommissioning disposal', 'composite blade recycling', 'industrial recycling wind energy'],
    targetNaicsCodes: ['238210', '541350', '221115'],
    equipmentKeywords: ['megger tester', 'gearbox analyzer', 'vibration analysis', 'thermal imaging', 'oil analysis kit', 'turbine control system'],
    negativeKeywords: ['residential wind turbine', 'home wind generator', 'small wind', 'DIY wind turbine', 'wind chime', 'weather station'],
    signals: {
      primary: [
        { term: 'wind turbine', weight: 30 },
        { term: 'turbine testing', weight: 30 },
        { term: 'wind farm', weight: 25 },
        { term: 'wind energy', weight: 25 },
      ],
      secondary: [
        { term: 'gearbox', weight: 10 },
        { term: 'generator testing', weight: 10 },
        { term: 'vibration analysis', weight: 10 },
        { term: 'oil analysis', weight: 10 },
        { term: 'turbine maintenance', weight: 10 },
        { term: 'thermal imaging', weight: 10 },
        { term: 'OSHA', weight: 10 },
        { term: 'NFPA 70E', weight: 10 },
      ],
      negative: [
        { term: 'home wind', weight: -30 },
        { term: 'residential', weight: -40 },
        { term: 'small wind', weight: -30 },
        { term: 'diy', weight: -30 },
      ],
    },
    scoringWeights: SHARED_SCORING_WEIGHTS,
    baseScoringWeights: { distanceWeight: 10, contactEnrichmentWeight: 10, assetSignalWeight: 25 },
    createdAt: NOW,
    providers: createSearchOnlyProviders([tomtom, overpass]),
    matrixNode: { labor: 'Wind turbine maintenance, gearbox testing, blade inspection, generator testing, electrical testing', disposal: 'Turbine decommissioning, blade recycling, gearbox disposal, transformer recycling' },
  },
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
