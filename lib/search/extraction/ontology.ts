import { FitType } from '@/types/company';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CanonicalEntity {
  id: string;
  confidence: number;
}

export interface ExtractionPayload {
  services: CanonicalEntity[];
  equipment: CanonicalEntity[];
  wasteTypes: string[];
  fitType: FitType | null;
  confidence: number;
}

// ── Global Equipment Ontology (cross-vertical) ──────────────────────────────

export const EQUIPMENT_ONTOLOGY: Record<string, string[]> = {
  vacuum_truck: [
    'vacuum truck', 'vac truck', 'vactor truck', 'hydrovac truck',
    'pumper truck', 'vacuum trailer', 'vac-con',
  ],
  slurry_separator: [
    'slurry separation', 'slurry tank', 'separation system', 'reclaim equipment',
    'filter press', 'slurry dewatering', 'dewatering system', 'dewatering equipment',
    'filter press system', 'slurry filter',
  ],
  hydrovac: [
    'hydrovac', 'hydro excavation', 'hydro excavation unit', 'hydro vac',
    'suction excavator', 'vacuum excavator',
  ],
  roll_off_bin: [
    'roll-off', 'dumpster rental', 'debris box', 'rolloff container',
    'open top bin', 'dump trailer',
  ],
  concrete_saw: [
    'concrete saw', 'wall saw', 'flat saw', 'slab saw', 'core drill',
    'concrete cutter', 'hand saw', 'road saw', 'wire saw',
  ],
  concrete_pump: [
    'concrete pump', 'boom pump', 'line pump', 'concrete pumping',
    'truck-mounted pump', 'trailer pump',
  ],
  concrete_crusher: [
    'concrete crusher', 'rock crusher', 'jaw crusher', 'impact crusher',
    'crushing equipment', 'recycling crusher', 'crusher',
  ],
  generator: [
    'diesel generator', 'backup generator', 'power generator', 'standby generator',
    'generator set', 'genset', 'generator', 'mobile generator',
  ],
  load_bank: [
    'load bank', 'load bank tester', 'resistive load bank',
    'portable load bank', 'load testing equipment',
  ],
  transformer: [
    'transformer', 'padmount transformer', 'pole transformer',
    'substation transformer', 'power transformer',
  ],
  switchgear: [
    'switchgear', 'switch gear', 'medium voltage switchgear',
    'low voltage switchgear', 'electrical switchboard',
  ],
  tower_crane: [
    'tower crane', 'crawler crane', 'mobile crane', 'crane service',
    'all terrain crane', 'rough terrain crane',
  ],
  excavator: [
    'excavator', 'track hoe', 'backhoe', 'mini excavator',
    'hydraulic excavator', 'long reach excavator',
  ],
  dozer: [
    'bulldozer', 'dozer', 'crawler dozer', 'wheel dozer',
  ],
  forklift: [
    'forklift', 'fork lift', 'telehandler', 'boom lift',
    'scissor lift', 'aerial lift', 'man lift',
  ],
  pile_driver: [
    'pile driver', 'pile driving', 'pile driving rig',
    'sheet pile driver', 'vibratory hammer',
  ],
  dredge: [
    'dredge', 'dredging equipment', 'clamshell dredge',
    'cutter suction dredge', 'hydraulic dredge',
  ],
  scaffolding: [
    'scaffolding', 'scaffold', 'swing stage',
    'suspended scaffold', 'tube and clamp scaffold',
  ],
  sandblaster: [
    'sandblaster', 'sandblasting equipment', 'abrasive blaster',
    'shot blast', 'sand blast pot', 'blast nozzle',
  ],
  tank: [
    'storage tank', 'fuel tank', 'oil tank', 'above ground tank',
    'underground tank', 'steel tank', 'fiberglass tank',
    'double wall tank', 'tank',
  ],
  pump: [
    'centrifugal pump', 'submersible pump', 'trash pump',
    'dewatering pump', 'wellpoint pump', 'hydraulic pump',
    'diaphragm pump', 'slurry pump',
  ],
  welder: [
    'welder', 'welding machine', 'welding rig',
    'tig welder', 'mig welder', 'stick welder',
  ],
  compressor: [
    'air compressor', 'diesel compressor', 'portable compressor',
    'screw compressor', 'compressor',
  ],
  hvac_unit: [
    'hvac unit', 'rooftop unit', 'rtu', 'air handler',
    'packaged unit', 'condensing unit', 'chiller',
  ],
  fire_sprinkler: [
    'fire sprinkler', 'sprinkler head', 'fire suppression system',
    'sprinkler system', 'standpipe', 'fire hose',
  ],
  grease_trap: [
    'grease trap', 'grease interceptor', 'grease recovery',
    'hydro mechanical', 'grease removal',
  ],
  elevator: [
    'elevator', 'passenger elevator', 'freight elevator',
    'hydraulic elevator', 'traction elevator',
  ],
  solar_panel: [
    'solar panel', 'photovoltaic', 'solar pv', 'solar module',
    'solar array', 'pv panel',
  ],
  turbine: [
    'wind turbine', 'turbine', 'wind generator',
    'gearbox', 'nacelle', 'blade',
  ],
  disposal_bin: [
    'disposal bin', 'waste bin', 'debris bin',
    'dump bin', 'construction bin',
  ],
};

// ── Per-Vertical Service Ontology ────────────────────────────────────────────
// canonical ID → [lowercase alias strings]

export const VERTICAL_SERVICE_ONTOLOGY: Record<string, Record<string, string[]>> = {
  slurry_processing: {
    slurry_removal: ['slurry removal', 'slurry hauling', 'slurry vacuuming', 'slurry pumping'],
    slurry_management: ['slurry management', 'slurry processing', 'slurry handling'],
    concrete_cutting: ['concrete cutting', 'concrete sawing', 'flat sawing', 'wall sawing', 'slab sawing'],
    core_drilling: ['core drilling', 'concrete coring', 'diamond coring'],
    concrete_grinding: ['concrete grinding', 'surface grinding'],
    concrete_washout: ['concrete washout', 'washout collection', 'ready mix reclaimer'],
    ph_neutralization: ['ph neutralization', 'concrete ph treatment', 'ph adjustment'],
    slurry_recycling: ['slurry recycling', 'slurry dewatering', 'slurry separation', 'filter press'],
    vacuum_truck_service: ['vacuum truck service', 'vac truck service', 'vactor service'],
    demolition: ['demolition', 'concrete demolition', 'selective demolition'],
  },
  asbestos_abatement: {
    asbestos_removal: ['asbestos removal', 'asbestos abatement', 'asbestos remediation'],
    asbestos_inspection: ['asbestos inspection', 'asbestos survey', 'asbestos testing', 'asbestos sampling'],
    lead_abatement: ['lead abatement', 'lead paint removal', 'lead remediation'],
    hazmat_containment: ['hazmat containment', 'hazardous containment', 'containment setup'],
    air_monitoring: ['air monitoring', 'air sampling', 'clearance testing', 'pcm analysis'],
    mold_remediation: ['mold remediation', 'mold removal'],
    asbestos_disposal: ['asbestos disposal', 'regulated waste transport', 'hazmat transport'],
    encapsulation: ['encapsulation', 'asbestos encapsulation'],
  },
  hydro_excavation: {
    hydro_excavation: ['hydro excavation', 'hydro-excavation', 'hydro vac excavation', 'non-destructive digging'],
    potholing: ['potholing', 'utility potholing', 'utility exposure', 'daylighting', 'test hole'],
    vacuum_excavation: ['vacuum excavation', 'suction excavation', 'air excavation'],
    utility_location: ['utility location', 'utility marking', 'underground utility', 'private utility locate'],
    trenching: ['trenching', 'trench excavation'],
    daylighting: ['daylighting', 'utility daylighting'],
    spoils_removal: ['spoils removal', 'spoils disposal', 'excavation spoils'],
  },
  medical_waste: {
    medical_waste_collection: ['medical waste collection', 'medical waste pickup', 'biohazard collection'],
    sharps_disposal: ['sharps disposal', 'needle disposal', 'syringe disposal'],
    biohazard_cleanup: ['biohazard cleanup', 'biohazard removal', 'biological waste disposal'],
    clinical_waste: ['clinical waste', 'regulated medical waste', 'red bag waste'],
    pharmaceutical_disposal: ['pharmaceutical disposal', 'drug disposal', 'controlled substance disposal'],
    chemotherapy_disposal: ['chemotherapy disposal', 'hazardous drug disposal'],
    pathological_waste: ['pathological waste', 'tissue disposal'],
    incineration: ['incineration', 'medical incineration', 'autoclave', 'sterilization'],
    waste_tracking: ['waste tracking', 'manifest', 'chain of custody'],
  },
  marine_construction: {
    pile_driving: ['pile driving', 'pile installation', 'sheet piling', 'steel piling'],
    seawall: ['seawall construction', 'seawall repair', 'bulkhead installation', 'bulkhead repair'],
    dock_construction: ['dock construction', 'dock building', 'dock repair', 'dock installation'],
    dredging: ['dredging', 'dredge removal', 'hydraulic dredging', 'maintenance dredging'],
    marine_demolition: ['marine demolition', 'waterfront demolition'],
    riprap: ['riprap installation', 'armor stone', 'shore protection'],
    boat_launch: ['boat launch construction', 'boat ramp construction', 'marine access'],
    pier_construction: ['pier construction', 'pier repair', 'wharf construction'],
  },
  industrial_demolition: {
    structural_demolition: ['structural demolition', 'building demolition', 'industrial demolition'],
    selective_demolition: ['selective demolition', 'interior demolition', 'partial demolition'],
    concrete_breaking: ['concrete breaking', 'concrete removal', 'concrete demolition'],
    building_implosion: ['implosion', 'building implosion', 'explosive demolition'],
    asbestos_abatement_demo: ['abatement demolition', 'hazmat demolition'],
    scrap_recycling: ['scrap recycling', 'metal recycling', 'material recovery'],
    concrete_crushing: ['concrete crushing', 'rock crushing', 'onsite crushing'],
    decommissioning: ['decommissioning', 'plant decommissioning', 'facility closure'],
    excavation_demo: ['excavation', 'site clearing', 'site preparation'],
  },
  stormwater_compliance: {
    swppp_inspection: ['swppp inspection', 'stormwater inspection', 'swppp compliance'],
    swppp_development: ['swppp development', 'stormwater plan', 'stormwater pollution plan'],
    erosion_control: ['erosion control', 'sediment control', 'silt fence', 'erosion control installation'],
    stormwater_monitoring: ['stormwater monitoring', 'stormwater sampling', 'stormwater testing'],
    basin_cleaning: ['basin cleaning', 'sediment basin', 'stormwater basin', 'catch basin cleaning'],
    dewatering_permitting: ['dewatering permitting', 'dewatering plan', 'npdes permitting'],
    riprap_installation: ['riprap', 'rock slope protection', 'channel protection'],
    hydroseeding: ['hydroseeding', 'hydromulching', 'erosion control seeding'],
  },
  industrial_wastewater: {
    wastewater_treatment: ['industrial wastewater treatment', 'wastewater treatment', 'process water treatment'],
    ph_adjustment: ['ph adjustment', 'ph neutralization', 'acid neutralization'],
    filtration: ['industrial filtration', 'water filtration', 'membrane filtration'],
    sludge_removal: ['sludge removal', 'sludge dewatering', 'sludge hauling'],
    wastewater_hauling: ['wastewater hauling', 'industrial liquid waste hauling'],
    lagoon_cleaning: ['lagoon cleaning', 'lagoon dredging', 'pond cleaning'],
    effluent_management: ['effluent management', 'effluent discharge', 'discharge compliance'],
    chemical_treatment: ['chemical treatment', 'chemical dosing', 'coagulation', 'flocculation'],
  },
  tank_testing: {
    tank_testing: ['tank testing', 'tank tightness testing', 'tank integrity testing'],
    leak_detection: ['leak detection', 'tank leak test', 'line leak detection'],
    ust_testing: ['ust testing', 'underground tank testing', 'underground storage tank'],
    cathodic_protection: ['cathodic protection', 'cathodic testing', 'cathodic protection testing'],
    tank_inspection: ['tank inspection', 'storage tank inspection'],
    tank_removal: ['tank removal', 'tank abandonment', 'tank closure'],
    soil_boring: ['soil boring', 'soil sampling', 'groundwater monitoring'],
    compliance_testing: ['compliance testing', 'regulatory compliance', 'tank compliance'],
  },
  elevator_inspection: {
    elevator_inspection: ['elevator inspection', 'lift inspection', 'elevator safety inspection'],
    elevator_certification: ['elevator certification', 'lift certification', 'asme compliance'],
    load_testing: ['load testing', 'elevator load test', 'capacity testing'],
    elevator_maintenance: ['elevator maintenance', 'lift maintenance', 'elevator service'],
    escalator_inspection: ['escalator inspection', 'escalator maintenance'],
    elevator_modernization: ['elevator modernization', 'elevator upgrade', 'lift replacement'],
    rescue_service: ['elevator rescue', 'entrapment rescue'],
  },
  hvac_industrial: {
    test_and_balance: ['test and balance', 'air balance', 'air balancing', 'tab', 'testing adjusting balancing'],
    hvac_commissioning: ['hvac commissioning', 'system commissioning'],
    duct_cleaning: ['duct cleaning', 'ductwork cleaning', 'air duct cleaning'],
    airflow_measurement: ['airflow measurement', 'cfm measurement', 'air volume measurement'],
    temperature_control: ['temperature control', 'temperature balancing'],
    refrigeration: ['refrigeration service', 'refrigeration maintenance'],
    hvac_maintenance: ['hvac maintenance', 'hvac service', 'commercial hvac'],
  },
  fire_sprinklers: {
    sprinkler_installation: ['sprinkler installation', 'fire sprinkler installation'],
    sprinkler_inspection: ['sprinkler inspection', 'sprinkler testing', 'fire sprinkler test'],
    hydrostatic_testing: ['hydrostatic testing', 'hydrostatic test', 'pressure test'],
    nfpa_compliance: ['nfpa 25 compliance', 'nfpa inspection', 'fire code compliance'],
    sprinkler_repair: ['sprinkler repair', 'sprinkler maintenance'],
    fire_pump_testing: ['fire pump testing', 'fire pump inspection'],
    backflow_testing: ['backflow testing', 'backflow prevention', 'rpz testing'],
    standpipe_testing: ['standpipe testing', 'standpipe inspection'],
  },
  generator_testing: {
    load_bank_testing: ['load bank testing', 'load test', 'load bank rental', 'load bank'],
    generator_maintenance: ['generator maintenance', 'generator service', 'genset service'],
    nfpa_110: ['nfpa 110 compliance', 'emergency power testing'],
    generator_repair: ['generator repair', 'generator troubleshooting'],
    fuel_polishing: ['fuel polishing', 'fuel cleaning', 'fuel filtration'],
    transfer_switch: ['transfer switch testing', 'ats testing', 'automatic transfer switch'],
    battery_testing: ['battery testing', 'battery load test', 'ups battery'],
  },
  high_voltage_electrical: {
    high_voltage_testing: ['high voltage testing', 'hi-pot testing', 'high potential testing'],
    transformer_testing: ['transformer testing', 'transformer maintenance', 'transformer oil testing'],
    switchgear_testing: ['switchgear testing', 'switchgear maintenance'],
    cable_testing: ['cable testing', 'power cable testing', 'vlf testing'],
    infrared_scanning: ['infrared scanning', 'thermographic inspection', 'thermal imaging'],
    protective_relay: ['protective relay testing', 'relay calibration'],
    power_factor: ['power factor testing', 'power factor correction'],
    nfpa_70e: ['nfpa 70e compliance', 'arc flash study', 'arc flash analysis'],
  },
  trench_shoring: {
    trench_shoring: ['trench shoring', 'shoring installation', 'shoring system'],
    slide_rail: ['slide rail', 'slide rail system'],
    trench_box: ['trench box', 'trench shield', 'trench protection'],
    hydraulic_shoring: ['hydraulic shoring', 'hydraulic shores'],
    soldier_pile: ['soldier pile', 'soldier beam', 'lagging'],
    sheet_piling: ['sheet piling', 'sheet pile shoring'],
    excavation_safety: ['excavation safety', 'calosha compliance', 'trench safety'],
    shoring_rental: ['shoring rental', 'shoring equipment rental'],
  },
  sandblasting: {
    sandblasting: ['sandblasting', 'abrasive blasting', 'grit blasting', 'shot blasting'],
    surface_preparation: ['surface preparation', 'industrial coating removal'],
    paint_removal: ['paint removal', 'lead paint removal', 'coating removal'],
    tank_blasting: ['tank blasting', 'tank interior blasting'],
    bridge_blasting: ['bridge blasting', 'structural blasting'],
    dust_collection: ['dust collection', 'containment', 'negative air'],
    sponge_blasting: ['sponge blasting', 'soda blasting', 'dry ice blasting'],
  },
  dewatering: {
    dewatering: ['dewatering', 'construction dewatering', 'site dewatering'],
    wellpoint: ['wellpoint', 'wellpoint system', 'wellpoint dewatering'],
    bypass_pumping: ['bypass pumping', 'sewer bypass', 'temporary bypass'],
    groundwater_control: ['groundwater control', 'groundwater management'],
    pump_rental: ['pump rental', 'dewatering pump rental'],
    temporary_piping: ['temporary piping', 'discharge piping'],
    sediment_control: ['sediment control', 'sediment basin', 'silt removal'],
    trench_drainage: ['trench drainage', 'excavation dewatering'],
  },
  hazardous_soil_remediation: {
    soil_remediation: ['soil remediation', 'contaminated soil remediation', 'environmental remediation'],
    soil_excavation: ['soil excavation', 'contaminated soil removal', 'hazmat soil excavation'],
    brownfield_remediation: ['brownfield remediation', 'brownfield redevelopment'],
    groundwater_remediation: ['groundwater remediation', 'groundwater treatment'],
    bioremediation: ['bioremediation', 'bio-remediation', 'biopile'],
    thermal_treatment: ['thermal treatment', 'thermal desorption'],
    soil_vapor: ['soil vapor extraction', 'sve', 'vapor intrusion'],
    chemical_oxidation: ['chemical oxidation', 'in-situ oxidation'],
  },
  solar_infrastructure: {
    solar_installation: ['solar installation', 'solar pv installation', 'solar panel installation'],
    commercial_solar: ['commercial solar', 'industrial solar', 'large scale solar'],
    solar_design: ['solar design', 'pv system design', 'solar engineering'],
    solar_maintenance: ['solar maintenance', 'solar cleaning', 'solar o&m'],
    inverter_service: ['inverter service', 'inverter replacement', 'inverter maintenance'],
    battery_storage: ['battery storage', 'energy storage', 'bess'],
    ev_charging: ['ev charging', 'electric vehicle charging'],
    solar_mounting: ['solar mounting', 'racking system', 'solar racking'],
  },
  wind_infrastructure: {
    wind_turbine_maintenance: ['wind turbine maintenance', 'turbine service', 'turbine maintenance'],
    blade_inspection: ['blade inspection', 'blade repair', 'blade maintenance'],
    gearbox_service: ['gearbox service', 'gearbox repair', 'gearbox replacement'],
    turbine_testing: ['turbine testing', 'generator testing', 'wind turbine testing'],
    tower_climbing: ['tower climbing', 'turbine climbing', 'rope access'],
    turbine_installation: ['turbine installation', 'turbine commissioning'],
    wind_farm_oandm: ['wind farm operations', 'wind farm maintenance', 'wind o&m'],
  },
  wind_energy: {
    wind_turbine_installation: ['wind turbine installation', 'turbine erection', 'wind turbine commissioning'],
    wind_turbine_maintenance: ['wind turbine maintenance', 'turbine service', 'turbine repair'],
    blade_repair: ['blade repair', 'blade maintenance', 'blade replacement', 'composite repair'],
    wind_operations: ['wind operations', 'wind farm management', 'wind o&m'],
    gwo_training: ['gwo certification', 'gwo training', 'wind safety training'],
    turbine_decommissioning: ['turbine decommissioning', 'wind farm decommissioning'],
  },
  concrete: {
    concrete_contractor: ['concrete contractor', 'concrete work', 'concrete services'],
    concrete_foundation: ['concrete foundation', 'foundation pouring', 'foundation construction'],
    concrete_pumping: ['concrete pumping', 'concrete placement', 'pump service'],
    concrete_finishing: ['concrete finishing', 'concrete flatwork', 'concrete floor'],
    concrete_repair: ['concrete repair', 'concrete restoration'],
    stamped_concrete: ['stamped concrete', 'decorative concrete'],
    rebar_installation: ['rebar installation', 'steel reinforcement'],
  },
  commercial_roofing: {
    roof_installation: ['roof installation', 'roof replacement', 'roofing installation'],
    tpo_roofing: ['tpo roofing', 'epdm roofing', 'pvc roofing', 'single ply'],
    flat_roof: ['flat roof', 'low slope roof', 'built up roof', 'modified bitumen'],
    roof_repair: ['roof repair', 'roof maintenance', 'roof patching'],
    roof_inspection: ['roof inspection', 'roof survey'],
    metal_roofing: ['metal roofing', 'standing seam', 'metal roof'],
    roof_coating: ['roof coating', 'elastomeric coating', 'roof restoration'],
  },
  scrap_metal: {
    scrap_metal_recycling: ['scrap metal recycling', 'metal recycling', 'scrap processing'],
    ferrous_recycling: ['ferrous recycling', 'steel recycling', 'iron recycling'],
    non_ferrous_recycling: ['non-ferrous recycling', 'aluminum recycling', 'copper recycling'],
    demolition_processing: ['demolition processing', 'scrap processing'],
    roll_off_service: ['roll-off service', 'scrap roll-off', 'metal dumpster'],
    auto_recycling: ['auto recycling', 'vehicle recycling', 'scrap car'],
    metal_shredding: ['metal shredding', 'shredding service'],
  },
  backflow_testing: {
    backflow_testing: ['backflow testing', 'backflow inspection', 'rpz testing'],
    backflow_installation: ['backflow installation', 'backflow repair', 'backflow replacement'],
    cross_connection: ['cross connection', 'cross connection survey'],
    backflow_prevention: ['backflow prevention'],
    commercial_plumbing: ['commercial plumbing'],
  },
  grease_trap: {
    grease_trap_cleaning: ['grease trap cleaning', 'grease interceptor cleaning'],
    grease_trap_pumping: ['grease trap pumping', 'grease pumping'],
    grease_recycling: ['grease recycling', 'grease rendering', 'cooking oil recycling'],
    drain_cleaning: ['drain cleaning', 'sewer cleaning', 'drain line cleaning'],
    kitchen_cleaning: ['kitchen cleaning', 'restaurant cleaning'],
  },
  kitchen_exhaust: {
    hood_cleaning: ['hood cleaning', 'exhaust hood cleaning', 'kitchen hood cleaning'],
    exhaust_cleaning: ['exhaust cleaning', 'exhaust system cleaning'],
    duct_degreasing: ['duct degreasing', 'grease duct cleaning', 'kitchen duct cleaning'],
    fire_suppression: ['hood suppression', 'ansul system', 'fire suppression system'],
    fan_cleaning: ['fan cleaning', 'exhaust fan cleaning', 'roof fan cleaning'],
    kitchen_degreasing: ['kitchen degreasing', 'commercial degreasing'],
  },
  fire_extinguisher: {
    fire_extinguisher_service: ['fire extinguisher service', 'fire extinguisher maintenance'],
    fire_extinguisher_inspection: ['fire extinguisher inspection', 'extinguisher inspection'],
    fire_extinguisher_recharge: ['fire extinguisher recharge', 'extinguisher refill', 'extinguisher recharging'],
    extinguisher_installation: ['fire extinguisher installation', 'extinguisher mounting'],
    fire_safety_training: ['fire safety training', 'extinguisher training'],
    emergency_lighting: ['emergency lighting', 'exit sign', 'emergency egress'],
  },
};

// ── Helper: get signals for a vertical ───────────────────────────────────────

export function getServiceSignals(vertical: string): Record<string, string[]> {
  return VERTICAL_SERVICE_ONTOLOGY[vertical] || {};
}

export function hasServiceSignals(vertical: string): boolean {
  return vertical in VERTICAL_SERVICE_ONTOLOGY;
}

// ── Canonical normalization ───────────────────────────────────────────────────

const SERVICE_ALIAS_TO_CANONICAL: Record<string, string> = {};
const EQUIPMENT_ALIAS_TO_CANONICAL: Record<string, string> = {};

function buildAliasMaps() {
  for (const [canonical, aliases] of Object.entries(EQUIPMENT_ONTOLOGY)) {
    for (const alias of aliases) {
      EQUIPMENT_ALIAS_TO_CANONICAL[alias.toLowerCase()] = canonical;
    }
  }
  for (const [vertical, services] of Object.entries(VERTICAL_SERVICE_ONTOLOGY)) {
    for (const [canonical, aliases] of Object.entries(services)) {
      for (const alias of aliases) {
        SERVICE_ALIAS_TO_CANONICAL[alias.toLowerCase()] = canonical;
      }
    }
  }
}

buildAliasMaps();

export function normalizeServiceAlias(alias: string): string | null {
  return SERVICE_ALIAS_TO_CANONICAL[alias.toLowerCase().trim()] || null;
}

export function normalizeEquipmentAlias(alias: string): string | null {
  return EQUIPMENT_ALIAS_TO_CANONICAL[alias.toLowerCase().trim()] || null;
}
