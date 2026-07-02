// ─── HHR Construction Knowledge Graph ────────────────────────────────────────
//
// The Knowledge Graph is the semantic core of HardHatRequired. It models the
// relationships between verticals, labor types, disposal methods, equipment,
// bids, and compliance requirements — enabling the Recommendation Engine to
// answer "for a company doing X, what labor/disposal/equipment/bids do they need?"
//
// Structure:
//   KnowledgeGraph
//     ├── VerticalNodes     — 20 construction verticals with related concepts
//     ├── LaborNodes        — labor categories and typical credentials
//     ├── DisposalNodes     — waste streams and accepted disposal methods
//     ├── EquipmentNodes    — equipment types and typical specifications
//     ├── BidNodes          — bid source types per vertical
//     └── ComplianceNodes   — OSHA/EPA/state compliance per vertical
//
// The graph is static at startup (loaded from this module) and extended at
// runtime via feedback signals (FeedbackLearningEngine writes edge weight updates).
// ──────────────────────────────────────────────────────────────────────────────

export interface KGNode {
  id: string;
  label: string;
  type: KGNodeType;
  tags: string[];
  weight: number;       // 0–1, starts at 1.0, adjusted by feedback
}

export interface KGEdge {
  from: string;         // node id
  to: string;           // node id
  relation: KGRelation;
  weight: number;       // 0–1, confidence of this relation
}

export type KGNodeType =
  | 'vertical'
  | 'labor'
  | 'disposal'
  | 'equipment'
  | 'bid'
  | 'compliance';

export type KGRelation =
  | 'requires_labor'
  | 'generates_waste'
  | 'uses_equipment'
  | 'appears_in_bids'
  | 'governed_by'
  | 'child_of'          // slurry is child_of concrete
  | 'related_to';

export interface KGGraph {
  nodes: Map<string, KGNode>;
  edges: KGEdge[];
}

// ── Vertical Node Definitions ─────────────────────────────────────────────────

const VERTICAL_NODES: KGNode[] = [
  { id: 'v:asbestos_abatement',     label: 'Asbestos Abatement',       type: 'vertical', tags: ['hazmat', 'remediation', 'certification'], weight: 1 },
  { id: 'v:elevator_inspection',    label: 'Elevator Inspection',       type: 'vertical', tags: ['inspection', 'certification', 'vertical_transport'], weight: 1 },
  { id: 'v:generator_load_bank',    label: 'Generator Load Bank',       type: 'vertical', tags: ['electrical', 'testing', 'power'], weight: 1 },
  { id: 'v:marine_construction',    label: 'Marine Construction',       type: 'vertical', tags: ['marine', 'dock', 'seawall', 'underwater'], weight: 1 },
  { id: 'v:hydro_excavation',       label: 'Hydro Excavation',          type: 'vertical', tags: ['excavation', 'vacuum', 'non-destructive'], weight: 1 },
  { id: 'v:industrial_demolition',  label: 'Industrial Demolition',     type: 'vertical', tags: ['demolition', 'salvage', 'structural'], weight: 1 },
  { id: 'v:industrial_wastewater',  label: 'Industrial Wastewater',     type: 'vertical', tags: ['wastewater', 'treatment', 'discharge'], weight: 1 },
  { id: 'v:medical_waste',          label: 'Medical Waste',             type: 'vertical', tags: ['biohazard', 'regulated', 'healthcare'], weight: 1 },
  { id: 'v:slurry_concrete',        label: 'Slurry Processing',         type: 'vertical', tags: ['concrete', 'slurry', 'washout', 'ph'], weight: 1 },
  { id: 'v:stormwater_swppp',       label: 'Stormwater SWPPP',          type: 'vertical', tags: ['stormwater', 'swppp', 'bmp', 'erosion'], weight: 1 },
  { id: 'v:tank_testing',           label: 'Tank Testing UST',          type: 'vertical', tags: ['ust', 'fuel', 'underground', 'leak'], weight: 1 },
  { id: 'v:high_voltage',           label: 'High Voltage Electrical',   type: 'vertical', tags: ['electrical', 'high_voltage', 'utility'], weight: 1 },
  { id: 'v:trench_shoring',         label: 'Trench Shoring',            type: 'vertical', tags: ['shoring', 'trench', 'excavation', 'osha'], weight: 1 },
  { id: 'v:industrial_sandblasting',label: 'Industrial Sandblasting',   type: 'vertical', tags: ['abrasive', 'surface_prep', 'coating'], weight: 1 },
  { id: 'v:dewatering',             label: 'Dewatering',                type: 'vertical', tags: ['dewatering', 'pump', 'groundwater'], weight: 1 },
  { id: 'v:hazardous_soil',         label: 'Hazardous Soil',            type: 'vertical', tags: ['soil', 'remediation', 'contamination', 'hazmat'], weight: 1 },
  { id: 'v:fire_sprinklers',        label: 'Fire Sprinklers',           type: 'vertical', tags: ['fire', 'sprinkler', 'suppression', 'nfpa'], weight: 1 },
  { id: 'v:hvac',                   label: 'HVAC',                      type: 'vertical', tags: ['hvac', 'air', 'mechanical'], weight: 1 },
  { id: 'v:solar_bess',             label: 'Solar + BESS',              type: 'vertical', tags: ['solar', 'battery', 'renewable', 'energy'], weight: 1 },
  { id: 'v:wind_energy',            label: 'Wind Energy',               type: 'vertical', tags: ['wind', 'turbine', 'renewable', 'energy'], weight: 1 },
];

// ── Labor Node Definitions ────────────────────────────────────────────────────

const LABOR_NODES: KGNode[] = [
  { id: 'l:hazmat_tech',           label: 'Hazmat Technician',         type: 'labor', tags: ['40hr_osha', 'hazmat', 'confined_space'], weight: 1 },
  { id: 'l:elevator_mechanic',     label: 'Elevator Mechanic',         type: 'labor', tags: ['neiep', 'iuec', 'certified'], weight: 1 },
  { id: 'l:generator_tech',        label: 'Generator Technician',      type: 'labor', tags: ['electrical', 'load_bank', 'neta'], weight: 1 },
  { id: 'l:marine_diver',          label: 'Commercial Diver',          type: 'labor', tags: ['adci', 'underwater_welding', 'marine'], weight: 1 },
  { id: 'l:hydrovac_operator',     label: 'Hydrovac Operator',         type: 'labor', tags: ['cdl', 'vac_truck', 'excavation'], weight: 1 },
  { id: 'l:demolition_crew',       label: 'Demolition Crew',           type: 'labor', tags: ['osha30', 'explosive', 'structural'], weight: 1 },
  { id: 'l:wastewater_operator',   label: 'Wastewater Operator',       type: 'labor', tags: ['grade_cert', 'epa', 'treatment'], weight: 1 },
  { id: 'l:medical_waste_handler', label: 'Medical Waste Handler',     type: 'labor', tags: ['biohazard', 'dot', 'regulated'], weight: 1 },
  { id: 'l:slurry_driver',         label: 'Slurry Truck Driver',       type: 'labor', tags: ['cdl', 'vacuum', 'reclaimer'], weight: 1 },
  { id: 'l:swppp_inspector',       label: 'SWPPP Inspector',           type: 'labor', tags: ['qsd', 'qsp', 'certified', 'erosion'], weight: 1 },
  { id: 'l:ust_inspector',         label: 'UST Inspector',             type: 'labor', tags: ['certified', 'petroleum', 'epa'], weight: 1 },
  { id: 'l:hv_electrician',        label: 'High Voltage Electrician',  type: 'labor', tags: ['journeyman', '575v', 'substation'], weight: 1 },
  { id: 'l:competent_person',      label: 'Competent Person',          type: 'labor', tags: ['osha', 'trench', 'shoring'], weight: 1 },
  { id: 'l:sandblast_tech',        label: 'Sandblast Technician',      type: 'labor', tags: ['nace', 'sspc', 'confined_space'], weight: 1 },
  { id: 'l:pump_operator',         label: 'Dewatering Pump Operator',  type: 'labor', tags: ['wellpoint', 'submersible', 'construction'], weight: 1 },
  { id: 'l:environmental_tech',    label: 'Environmental Technician',  type: 'labor', tags: ['sampling', 'remediation', 'hazmat'], weight: 1 },
  { id: 'l:fire_fitter',           label: 'Fire Sprinkler Fitter',     type: 'labor', tags: ['pipefitter', 'nfpa13', 'afsa'], weight: 1 },
  { id: 'l:hvac_tech',             label: 'HVAC Technician',           type: 'labor', tags: ['epa608', 'nate', 'mechanical'], weight: 1 },
  { id: 'l:solar_installer',       label: 'Solar Installer',           type: 'labor', tags: ['nabcep', 'electrical', 'pv'], weight: 1 },
  { id: 'l:wind_tech',             label: 'Wind Turbine Technician',   type: 'labor', tags: ['gwo', 'climb', 'turbine'], weight: 1 },
];

// ── Disposal Node Definitions ─────────────────────────────────────────────────

const DISPOSAL_NODES: KGNode[] = [
  { id: 'd:hazmat_disposal',       label: 'Hazmat Disposal Facility',  type: 'disposal', tags: ['rcra', 'manifest', 'licensed'], weight: 1 },
  { id: 'd:concrete_recycler',     label: 'Concrete Recycler',         type: 'disposal', tags: ['crushing', 'aggregate', 'rca'], weight: 1 },
  { id: 'd:medical_waste_incin',   label: 'Medical Waste Incinerator', type: 'disposal', tags: ['regulated', 'biohazard', 'epa'], weight: 1 },
  { id: 'd:wastewater_plant',      label: 'Wastewater Treatment Plant',type: 'disposal', tags: ['npdes', 'discharge', 'municipal'], weight: 1 },
  { id: 'd:solid_waste_landfill',  label: 'Solid Waste Landfill',      type: 'disposal', tags: ['subtitle_d', 'tipping_fee', 'municipal'], weight: 1 },
  { id: 'd:scrap_yard',            label: 'Scrap Metal Yard',          type: 'disposal', tags: ['ferrous', 'scrap', 'metal'], weight: 1 },
  { id: 'd:transfer_station',      label: 'Transfer Station',          type: 'disposal', tags: ['intermediate', 'sorting', 'municipal'], weight: 1 },
  { id: 'd:contaminated_soil',     label: 'Contaminated Soil Facility',type: 'disposal', tags: ['bioremediation', 'thermal', 'soil'], weight: 1 },
  { id: 'd:electronic_recycler',   label: 'Electronics Recycler',      type: 'disposal', tags: ['ewaste', 'batteries', 'panels'], weight: 1 },
];

// ── Equipment Node Definitions ────────────────────────────────────────────────

const EQUIPMENT_NODES: KGNode[] = [
  { id: 'e:vac_truck',         label: 'Vacuum Truck',             type: 'equipment', tags: ['industrial_vacuum', 'liquid', 'non_hazardous'], weight: 1 },
  { id: 'e:hydrovac_truck',    label: 'Hydrovac Truck',           type: 'equipment', tags: ['water_jetting', 'vacuum', 'non_destructive'], weight: 1 },
  { id: 'e:generator_set',     label: 'Generator Set',            type: 'equipment', tags: ['diesel', 'standby', 'load_bank'], weight: 1 },
  { id: 'e:shoring_system',    label: 'Shoring System',           type: 'equipment', tags: ['trench_box', 'hydraulic', 'osha'], weight: 1 },
  { id: 'e:aerial_lift',       label: 'Aerial Lift / Boom',       type: 'equipment', tags: ['jlg', 'genie', 'manlift', 'reach'], weight: 1 },
  { id: 'e:excavator',         label: 'Excavator',                type: 'equipment', tags: ['cat', 'komatsu', 'digging'], weight: 1 },
  { id: 'e:submersible_pump',  label: 'Submersible Pump',         type: 'equipment', tags: ['dewatering', 'bypass', 'electric'], weight: 1 },
  { id: 'e:blasting_pot',      label: 'Blast Pot / Compressor',   type: 'equipment', tags: ['abrasive', 'pressure', 'sandblast'], weight: 1 },
  { id: 'e:marine_crane',      label: 'Marine Crane / Barge',     type: 'equipment', tags: ['water', 'heavy_lift', 'crane'], weight: 1 },
  { id: 'e:thermal_imager',    label: 'Thermal Imager',           type: 'equipment', tags: ['flir', 'inspection', 'diagnostic'], weight: 1 },
];

// ── Bid Node Definitions ──────────────────────────────────────────────────────

const BID_NODES: KGNode[] = [
  { id: 'b:city_public_works',  label: 'City Public Works',       type: 'bid', tags: ['ige', 'municipal', 'infrastructure'], weight: 1 },
  { id: 'b:county_contract',    label: 'County Contract',         type: 'bid', tags: ['county', 'roads', 'facilities'], weight: 1 },
  { id: 'b:state_dot',          label: 'State DOT',               type: 'bid', tags: ['highway', 'transportation', 'dot'], weight: 1 },
  { id: 'b:utility_rfp',        label: 'Utility Company RFP',     type: 'bid', tags: ['pge', 'sce', 'ercot', 'utility'], weight: 1 },
  { id: 'b:private_gc',         label: 'Private GC Subcontract',  type: 'bid', tags: ['subcontract', 'private', 'invitation'], weight: 1 },
  { id: 'b:federal_sam',        label: 'Federal SAM.gov',         type: 'bid', tags: ['federal', 'sam', 'unanet'], weight: 1 },
];

// ── Compliance Node Definitions ───────────────────────────────────────────────

const COMPLIANCE_NODES: KGNode[] = [
  { id: 'c:osha_1926',     label: 'OSHA 29 CFR 1926',         type: 'compliance', tags: ['construction', 'federal', 'safety'], weight: 1 },
  { id: 'c:osha_1910',     label: 'OSHA 29 CFR 1910',         type: 'compliance', tags: ['general_industry', 'federal', 'safety'], weight: 1 },
  { id: 'c:rcra',          label: 'RCRA Hazardous Waste',     type: 'compliance', tags: ['epa', 'manifest', 'hazmat'], weight: 1 },
  { id: 'c:npdes',         label: 'NPDES Stormwater Permit',  type: 'compliance', tags: ['epa', 'discharge', 'stormwater'], weight: 1 },
  { id: 'c:nfpa_13',       label: 'NFPA 13 Sprinkler',        type: 'compliance', tags: ['nfpa', 'fire', 'sprinkler'], weight: 1 },
  { id: 'c:nec',           label: 'NEC Electrical Code',      type: 'compliance', tags: ['nfpa70', 'electrical', 'local'], weight: 1 },
  { id: 'c:ahera',         label: 'AHERA Asbestos',           type: 'compliance', tags: ['epa', 'asbestos', 'school'], weight: 1 },
  { id: 'c:dot_hazmat',    label: 'DOT Hazmat Transport',     type: 'compliance', tags: ['dot', '49cfr', 'transport'], weight: 1 },
  { id: 'c:swppp',         label: 'SWPPP Requirements',       type: 'compliance', tags: ['stormwater', 'construction', 'bmp'], weight: 1 },
  { id: 'c:ust_reg',       label: 'UST Regulations 40 CFR',   type: 'compliance', tags: ['epa', 'underground', 'fuel'], weight: 1 },
];

// ── Edge Definitions (vertical → everything it connects to) ──────────────────

const EDGES: KGEdge[] = [
  // ── Asbestos Abatement ──────────────────────────────────────────────────
  { from: 'v:asbestos_abatement', to: 'l:hazmat_tech',          relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:asbestos_abatement', to: 'd:hazmat_disposal',      relation: 'generates_waste', weight: 1.0 },
  { from: 'v:asbestos_abatement', to: 'e:aerial_lift',          relation: 'uses_equipment',  weight: 0.7 },
  { from: 'v:asbestos_abatement', to: 'b:city_public_works',    relation: 'appears_in_bids', weight: 0.8 },
  { from: 'v:asbestos_abatement', to: 'c:ahera',                relation: 'governed_by',     weight: 1.0 },
  { from: 'v:asbestos_abatement', to: 'c:rcra',                 relation: 'governed_by',     weight: 0.9 },
  { from: 'v:asbestos_abatement', to: 'c:dot_hazmat',           relation: 'governed_by',     weight: 0.8 },

  // ── Hydro Excavation ───────────────────────────────────────────────────
  { from: 'v:hydro_excavation',   to: 'l:hydrovac_operator',    relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:hydro_excavation',   to: 'e:hydrovac_truck',       relation: 'uses_equipment',  weight: 1.0 },
  { from: 'v:hydro_excavation',   to: 'e:vac_truck',            relation: 'uses_equipment',  weight: 0.6 },
  { from: 'v:hydro_excavation',   to: 'd:wastewater_plant',     relation: 'generates_waste', weight: 0.8 },
  { from: 'v:hydro_excavation',   to: 'b:county_contract',      relation: 'appears_in_bids', weight: 0.7 },
  { from: 'v:hydro_excavation',   to: 'b:utility_rfp',          relation: 'appears_in_bids', weight: 0.9 },
  { from: 'v:hydro_excavation',   to: 'c:osha_1926',            relation: 'governed_by',     weight: 1.0 },

  // ── Slurry Concrete ────────────────────────────────────────────────────
  { from: 'v:slurry_concrete',    to: 'l:slurry_driver',        relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:slurry_concrete',    to: 'e:vac_truck',            relation: 'uses_equipment',  weight: 1.0 },
  { from: 'v:slurry_concrete',    to: 'd:concrete_recycler',    relation: 'generates_waste', weight: 1.0 },
  { from: 'v:slurry_concrete',    to: 'c:npdes',                relation: 'governed_by',     weight: 0.9 },
  { from: 'v:slurry_concrete',    to: 'c:swppp',                relation: 'governed_by',     weight: 0.9 },
  { from: 'v:slurry_concrete',    to: 'v:stormwater_swppp',     relation: 'related_to',      weight: 0.8 },
  { from: 'v:slurry_concrete',    to: 'b:city_public_works',    relation: 'appears_in_bids', weight: 0.6 },

  // ── Industrial Wastewater ──────────────────────────────────────────────
  { from: 'v:industrial_wastewater', to: 'l:wastewater_operator', relation: 'requires_labor', weight: 1.0 },
  { from: 'v:industrial_wastewater', to: 'd:wastewater_plant',   relation: 'generates_waste', weight: 1.0 },
  { from: 'v:industrial_wastewater', to: 'e:submersible_pump',   relation: 'uses_equipment',  weight: 0.8 },
  { from: 'v:industrial_wastewater', to: 'c:npdes',              relation: 'governed_by',     weight: 1.0 },
  { from: 'v:industrial_wastewater', to: 'b:utility_rfp',        relation: 'appears_in_bids', weight: 0.6 },

  // ── Medical Waste ──────────────────────────────────────────────────────
  { from: 'v:medical_waste',      to: 'l:medical_waste_handler', relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:medical_waste',      to: 'd:medical_waste_incin',   relation: 'generates_waste', weight: 1.0 },
  { from: 'v:medical_waste',      to: 'c:rcra',                  relation: 'governed_by',     weight: 0.9 },
  { from: 'v:medical_waste',      to: 'c:dot_hazmat',            relation: 'governed_by',     weight: 1.0 },

  // ── Stormwater SWPPP ──────────────────────────────────────────────────
  { from: 'v:stormwater_swppp',   to: 'l:swppp_inspector',      relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:stormwater_swppp',   to: 'c:npdes',                relation: 'governed_by',     weight: 1.0 },
  { from: 'v:stormwater_swppp',   to: 'c:swppp',                relation: 'governed_by',     weight: 1.0 },
  { from: 'v:stormwater_swppp',   to: 'b:state_dot',            relation: 'appears_in_bids', weight: 0.7 },

  // ── Tank Testing UST ──────────────────────────────────────────────────
  { from: 'v:tank_testing',       to: 'l:ust_inspector',        relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:tank_testing',       to: 'd:hazmat_disposal',      relation: 'generates_waste', weight: 0.6 },
  { from: 'v:tank_testing',       to: 'c:ust_reg',              relation: 'governed_by',     weight: 1.0 },
  { from: 'v:tank_testing',       to: 'b:city_public_works',    relation: 'appears_in_bids', weight: 0.4 },

  // ── Trench Shoring ────────────────────────────────────────────────────
  { from: 'v:trench_shoring',     to: 'l:competent_person',     relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:trench_shoring',     to: 'e:shoring_system',       relation: 'uses_equipment',  weight: 1.0 },
  { from: 'v:trench_shoring',     to: 'c:osha_1926',            relation: 'governed_by',     weight: 1.0 },
  { from: 'v:trench_shoring',     to: 'b:county_contract',      relation: 'appears_in_bids', weight: 0.8 },
  { from: 'v:trench_shoring',     to: 'v:hydro_excavation',     relation: 'related_to',      weight: 0.7 },

  // ── Industrial Sandblasting ───────────────────────────────────────────
  { from: 'v:industrial_sandblasting', to: 'l:sandblast_tech',  relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:industrial_sandblasting', to: 'e:blasting_pot',    relation: 'uses_equipment',  weight: 1.0 },
  { from: 'v:industrial_sandblasting', to: 'd:hazmat_disposal', relation: 'generates_waste', weight: 0.7 },
  { from: 'v:industrial_sandblasting', to: 'c:osha_1910',       relation: 'governed_by',     weight: 0.9 },

  // ── Dewatering ────────────────────────────────────────────────────────
  { from: 'v:dewatering',         to: 'l:pump_operator',        relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:dewatering',         to: 'e:submersible_pump',     relation: 'uses_equipment',  weight: 1.0 },
  { from: 'v:dewatering',         to: 'd:wastewater_plant',     relation: 'generates_waste', weight: 0.6 },
  { from: 'v:dewatering',         to: 'b:state_dot',            relation: 'appears_in_bids', weight: 0.6 },
  { from: 'v:dewatering',         to: 'v:trench_shoring',       relation: 'related_to',      weight: 0.6 },

  // ── Hazardous Soil ────────────────────────────────────────────────────
  { from: 'v:hazardous_soil',     to: 'l:environmental_tech',   relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:hazardous_soil',     to: 'l:hazmat_tech',          relation: 'requires_labor',  weight: 0.8 },
  { from: 'v:hazardous_soil',     to: 'd:contaminated_soil',    relation: 'generates_waste', weight: 1.0 },
  { from: 'v:hazardous_soil',     to: 'e:excavator',            relation: 'uses_equipment',  weight: 0.9 },
  { from: 'v:hazardous_soil',     to: 'c:rcra',                 relation: 'governed_by',     weight: 0.9 },
  { from: 'v:hazardous_soil',     to: 'b:federal_sam',          relation: 'appears_in_bids', weight: 0.8 },

  // ── Fire Sprinklers ───────────────────────────────────────────────────
  { from: 'v:fire_sprinklers',    to: 'l:fire_fitter',          relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:fire_sprinklers',    to: 'c:nfpa_13',              relation: 'governed_by',     weight: 1.0 },
  { from: 'v:fire_sprinklers',    to: 'b:city_public_works',    relation: 'appears_in_bids', weight: 0.8 },
  { from: 'v:fire_sprinklers',    to: 'b:private_gc',           relation: 'appears_in_bids', weight: 0.9 },

  // ── HVAC ──────────────────────────────────────────────────────────────
  { from: 'v:hvac',               to: 'l:hvac_tech',            relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:hvac',               to: 'c:nec',                  relation: 'governed_by',     weight: 0.7 },
  { from: 'v:hvac',               to: 'b:private_gc',           relation: 'appears_in_bids', weight: 0.9 },
  { from: 'v:hvac',               to: 'b:city_public_works',    relation: 'appears_in_bids', weight: 0.7 },

  // ── Solar + BESS ──────────────────────────────────────────────────────
  { from: 'v:solar_bess',         to: 'l:solar_installer',      relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:solar_bess',         to: 'e:aerial_lift',          relation: 'uses_equipment',  weight: 0.8 },
  { from: 'v:solar_bess',         to: 'd:electronic_recycler',  relation: 'generates_waste', weight: 0.5 },
  { from: 'v:solar_bess',         to: 'c:nec',                  relation: 'governed_by',     weight: 1.0 },
  { from: 'v:solar_bess',         to: 'b:utility_rfp',          relation: 'appears_in_bids', weight: 1.0 },
  { from: 'v:solar_bess',         to: 'b:federal_sam',          relation: 'appears_in_bids', weight: 0.7 },

  // ── Wind Energy ───────────────────────────────────────────────────────
  { from: 'v:wind_energy',        to: 'l:wind_tech',            relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:wind_energy',        to: 'e:marine_crane',         relation: 'uses_equipment',  weight: 0.7 },
  { from: 'v:wind_energy',        to: 'b:utility_rfp',          relation: 'appears_in_bids', weight: 1.0 },
  { from: 'v:wind_energy',        to: 'b:federal_sam',          relation: 'appears_in_bids', weight: 0.8 },
  { from: 'v:wind_energy',        to: 'c:nec',                  relation: 'governed_by',     weight: 0.8 },
  { from: 'v:wind_energy',        to: 'v:solar_bess',           relation: 'related_to',      weight: 0.7 },

  // ── Marine Construction ───────────────────────────────────────────────
  { from: 'v:marine_construction',to: 'l:marine_diver',         relation: 'requires_labor',  weight: 0.8 },
  { from: 'v:marine_construction',to: 'e:marine_crane',         relation: 'uses_equipment',  weight: 1.0 },
  { from: 'v:marine_construction',to: 'c:osha_1926',            relation: 'governed_by',     weight: 0.9 },
  { from: 'v:marine_construction',to: 'b:federal_sam',          relation: 'appears_in_bids', weight: 0.7 },
  { from: 'v:marine_construction',to: 'b:county_contract',      relation: 'appears_in_bids', weight: 0.8 },

  // ── High Voltage ──────────────────────────────────────────────────────
  { from: 'v:high_voltage',       to: 'l:hv_electrician',       relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:high_voltage',       to: 'e:aerial_lift',          relation: 'uses_equipment',  weight: 0.8 },
  { from: 'v:high_voltage',       to: 'c:nec',                  relation: 'governed_by',     weight: 1.0 },
  { from: 'v:high_voltage',       to: 'b:utility_rfp',          relation: 'appears_in_bids', weight: 1.0 },

  // ── Elevator Inspection ───────────────────────────────────────────────
  { from: 'v:elevator_inspection',to: 'l:elevator_mechanic',    relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:elevator_inspection',to: 'b:city_public_works',    relation: 'appears_in_bids', weight: 0.6 },

  // ── Generator Load Bank ───────────────────────────────────────────────
  { from: 'v:generator_load_bank',to: 'l:generator_tech',       relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:generator_load_bank',to: 'e:generator_set',        relation: 'uses_equipment',  weight: 0.9 },
  { from: 'v:generator_load_bank',to: 'b:utility_rfp',          relation: 'appears_in_bids', weight: 0.6 },

  // ── Industrial Demolition ─────────────────────────────────────────────
  { from: 'v:industrial_demolition',to: 'l:demolition_crew',    relation: 'requires_labor',  weight: 1.0 },
  { from: 'v:industrial_demolition',to: 'e:excavator',          relation: 'uses_equipment',  weight: 0.9 },
  { from: 'v:industrial_demolition',to: 'd:solid_waste_landfill',relation: 'generates_waste',weight: 0.8 },
  { from: 'v:industrial_demolition',to: 'd:scrap_yard',         relation: 'generates_waste', weight: 0.7 },
  { from: 'v:industrial_demolition',to: 'c:osha_1926',          relation: 'governed_by',     weight: 1.0 },
  { from: 'v:industrial_demolition',to: 'b:city_public_works',  relation: 'appears_in_bids', weight: 0.8 },
  { from: 'v:industrial_demolition',to: 'v:hazardous_soil',     relation: 'related_to',      weight: 0.6 },
];

// ── Graph singleton ───────────────────────────────────────────────────────────

let _graph: KGGraph | null = null;

export function getKnowledgeGraph(): KGGraph {
  if (_graph) return _graph;

  const nodes = new Map<string, KGNode>();
  const allNodes = [
    ...VERTICAL_NODES,
    ...LABOR_NODES,
    ...DISPOSAL_NODES,
    ...EQUIPMENT_NODES,
    ...BID_NODES,
    ...COMPLIANCE_NODES,
  ];

  for (const node of allNodes) {
    nodes.set(node.id, node);
  }

  _graph = { nodes, edges: EDGES };
  return _graph;
}

// ── Graph query helpers ───────────────────────────────────────────────────────

/**
 * Get all nodes connected from a given node by relation type.
 * Used by the Recommendation Engine.
 */
export function getRelated(
  graph: KGGraph,
  nodeId: string,
  relation: KGRelation,
  minWeight = 0.5
): KGNode[] {
  const connectedIds = graph.edges
    .filter((e) => e.from === nodeId && e.relation === relation && e.weight >= minWeight)
    .sort((a, b) => b.weight - a.weight)
    .map((e) => e.to);

  return connectedIds
    .map((id) => graph.nodes.get(id))
    .filter((n): n is KGNode => n !== undefined);
}

/**
 * Update edge weight based on feedback signal.
 * Called by FeedbackLearningEngine.
 */
export function updateEdgeWeight(
  graph: KGGraph,
  from: string,
  to: string,
  relation: KGRelation,
  delta: number  // positive = reinforce, negative = weaken
): void {
  const edge = graph.edges.find(
    (e) => e.from === from && e.to === to && e.relation === relation
  );
  if (edge) {
    edge.weight = Math.max(0, Math.min(1, edge.weight + delta));
  }
}

/**
 * Returns all verticals related to a given vertical (child_of or related_to).
 */
export function getRelatedVerticals(graph: KGGraph, verticalId: string): KGNode[] {
  const nodeId = `v:${verticalId}`;
  return graph.edges
    .filter(
      (e) =>
        (e.from === nodeId || e.to === nodeId) &&
        (e.relation === 'related_to' || e.relation === 'child_of')
    )
    .map((e) => (e.from === nodeId ? e.to : e.from))
    .map((id) => graph.nodes.get(id))
    .filter((n): n is KGNode => n !== undefined && n.type === 'vertical');
}
