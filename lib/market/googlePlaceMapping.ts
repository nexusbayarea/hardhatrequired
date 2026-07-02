export interface GooglePlaceMapping {
  googlePrimaryType: string;
  googleSecondaryTypes?: string[];
  searchModifier: string;
}

export const GOOGLE_VERTICAL_MAPPING: Record<string, GooglePlaceMapping> = {
  asbestos_abatement: {
    googlePrimaryType: 'waste_management_service',
    googleSecondaryTypes: ['home_improvement_contractor'],
    searchModifier: 'asbestos abatement hazardous removal commercial',
  },
  elevator_inspection: {
    googlePrimaryType: 'engineering_consultant',
    googleSecondaryTypes: ['general_contractor'],
    searchModifier: 'elevator service mechanic inspection commercial',
  },
  generator_testing: {
    googlePrimaryType: 'electrical_installation_service',
    googleSecondaryTypes: ['electrician'],
    searchModifier: 'emergency generator load bank testing commercial',
  },
  marine_construction: {
    googlePrimaryType: 'general_contractor',
    googleSecondaryTypes: ['excavating_contractor'],
    searchModifier: 'marine contractor pile driving dredging port',
  },
  hydro_excavation: {
    googlePrimaryType: 'excavating_contractor',
    googleSecondaryTypes: ['utility_contractor'],
    searchModifier: 'hydro excavation vac operator industrial',
  },
  industrial_demolition: {
    googlePrimaryType: 'demolition_contractor',
    googleSecondaryTypes: ['excavating_contractor'],
    searchModifier: 'heavy structural demolition concrete crushing yard',
  },
  industrial_wastewater: {
    googlePrimaryType: 'waste_management_service',
    googleSecondaryTypes: ['utility_contractor'],
    searchModifier: 'industrial wastewater plant treatment service',
  },
  medical_waste: {
    googlePrimaryType: 'waste_management_service',
    searchModifier: 'medical biohazard waste disposal autoclave facility',
  },
  slurry_processing: {
    googlePrimaryType: 'excavating_contractor',
    googleSecondaryTypes: ['waste_management_service'],
    searchModifier: 'drilling mud bentonite slurry processing dump site',
  },
  stormwater_compliance: {
    googlePrimaryType: 'engineering_consultant',
    googleSecondaryTypes: ['landscaper'],
    searchModifier: 'SWPPP erosion control stormwater compliance crew',
  },
  tank_testing: {
    googlePrimaryType: 'engineering_consultant',
    googleSecondaryTypes: ['waste_management_service'],
    searchModifier: 'UST underground storage tank testing service',
  },
  high_voltage_electrical: {
    googlePrimaryType: 'electrician',
    googleSecondaryTypes: ['electrical_installation_service'],
    searchModifier: 'high voltage substation grid linemen utility',
  },
  trench_shoring: {
    googlePrimaryType: 'excavating_contractor',
    googleSecondaryTypes: ['general_contractor'],
    searchModifier: 'trench shoring structural sheet piling support',
  },
  sandblasting: {
    googlePrimaryType: 'home_improvement_contractor',
    searchModifier: 'commercial sandblasting industrial coating painter',
  },
  dewatering: {
    googlePrimaryType: 'utility_contractor',
    googleSecondaryTypes: ['excavating_contractor'],
    searchModifier: 'dewatering high volume pump wellpoint filtration',
  },
  hazardous_soil_remediation: {
    googlePrimaryType: 'waste_management_service',
    googleSecondaryTypes: ['excavating_contractor'],
    searchModifier: 'hazmat soil remediation contaminated dirt landfill',
  },
  fire_sprinklers: {
    googlePrimaryType: 'fire_protection_service',
    googleSecondaryTypes: ['plumber'],
    searchModifier: 'fire sprinkler fitter installation commercial',
  },
  hvac_industrial: {
    googlePrimaryType: 'hvac_contractor',
    searchModifier: 'commercial hvac industrial chiller refrigeration',
  },
  solar_infrastructure: {
    googlePrimaryType: 'solar_energy_contractor',
    googleSecondaryTypes: ['electrician'],
    searchModifier: 'utility scale solar PV infrastructure electrician',
  },
  wind_infrastructure: {
    googlePrimaryType: 'general_contractor',
    googleSecondaryTypes: ['engineering_consultant'],
    searchModifier: 'wind turbine field technician infrastructure energy',
  },
  concrete: {
    googlePrimaryType: 'concrete_contractor',
    searchModifier: 'commercial concrete contractor structural industrial',
  },
  commercial_roofing: {
    googlePrimaryType: 'roofing_contractor',
    searchModifier: 'commercial industrial roofing contractor waterproofing',
  },
  scrap_metal: {
    googlePrimaryType: 'steel_fabricator',
    searchModifier: 'steel fabrication metal processing industrial scrap yard',
  },
  backflow_testing: {
    googlePrimaryType: 'plumber',
    searchModifier: 'backflow prevention testing cross connection commercial',
  },
  grease_trap: {
    googlePrimaryType: 'plumber',
    searchModifier: 'grease trap cleaning interceptor service commercial kitchen',
  },
  kitchen_exhaust: {
    googlePrimaryType: 'hvac_contractor',
    searchModifier: 'kitchen exhaust hood cleaning commercial restaurant ventilation',
  },
  fire_extinguisher: {
    googlePrimaryType: 'fire_protection_service',
    searchModifier: 'fire extinguisher inspection recharge commercial facility',
  },
};
