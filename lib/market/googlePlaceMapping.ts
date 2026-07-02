export interface GooglePlaceMapping {
  googlePrimaryType: string;
  googleSecondaryTypes?: string[];
  searchModifier: string;
  disposalSearchModifier?: string;
}

export const GOOGLE_VERTICAL_MAPPING: Record<string, GooglePlaceMapping> = {
  asbestos_abatement: {
    googlePrimaryType: 'waste_management_service',
    googleSecondaryTypes: ['home_improvement_contractor'],
    searchModifier: 'asbestos abatement hazardous removal commercial',
    disposalSearchModifier: 'asbestos disposal landfill waste facility',
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
    disposalSearchModifier: 'concrete recycling disposal demolition debris dump',
  },
  industrial_wastewater: {
    googlePrimaryType: 'waste_management_service',
    googleSecondaryTypes: ['utility_contractor'],
    searchModifier: 'industrial wastewater plant treatment service',
    disposalSearchModifier: 'industrial wastewater treatment facility disposal',
  },
  medical_waste: {
    googlePrimaryType: 'waste_management_service',
    searchModifier: 'medical biohazard waste disposal autoclave facility',
    disposalSearchModifier: 'medical waste disposal treatment autoclave facility',
  },
  slurry_processing: {
    googlePrimaryType: 'excavating_contractor',
    googleSecondaryTypes: ['waste_management_service'],
    searchModifier: 'drilling mud bentonite slurry processing dump site',
    disposalSearchModifier: 'drilling mud slurry disposal dump processing facility',
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
    disposalSearchModifier: 'underground storage tank removal disposal facility',
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
    disposalSearchModifier: 'steel lumber recycling construction debris disposal yard',
  },
  sandblasting: {
    googlePrimaryType: 'home_improvement_contractor',
    searchModifier: 'commercial sandblasting industrial coating painter',
  },
  dewatering: {
    googlePrimaryType: 'utility_contractor',
    googleSecondaryTypes: ['excavating_contractor'],
    searchModifier: 'dewatering high volume pump wellpoint filtration',
    disposalSearchModifier: 'construction dewatering sediment disposal filtration treatment',
  },
  hazardous_soil_remediation: {
    googlePrimaryType: 'waste_management_service',
    googleSecondaryTypes: ['excavating_contractor'],
    searchModifier: 'hazmat soil remediation contaminated dirt landfill',
    disposalSearchModifier: 'hazardous waste landfill soil disposal facility',
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
    disposalSearchModifier: 'wind turbine blade recycling disposal decommissioning facility',
  },
  concrete: {
    googlePrimaryType: 'concrete_contractor',
    searchModifier: 'commercial concrete contractor structural industrial',
    disposalSearchModifier: 'concrete recycling yard disposal dump site',
  },
  commercial_roofing: {
    googlePrimaryType: 'roofing_contractor',
    searchModifier: 'commercial industrial roofing contractor waterproofing',
    disposalSearchModifier: 'roofing tear off disposal dump construction debris',
  },
  scrap_metal: {
    googlePrimaryType: 'steel_fabricator',
    searchModifier: 'steel fabrication metal processing industrial scrap yard',
    disposalSearchModifier: 'scrap metal recycling yard processing facility',
  },
  backflow_testing: {
    googlePrimaryType: 'plumber',
    searchModifier: 'backflow prevention testing cross connection commercial',
  },
  grease_trap: {
    googlePrimaryType: 'plumber',
    searchModifier: 'grease trap cleaning interceptor service commercial kitchen',
    disposalSearchModifier: 'grease trap waste disposal rendering facility',
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
