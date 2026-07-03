export interface EstimatorConfig {
  truckCapacityGallons: number;
  disposalFeePerGallon: number;
  truckHourlyRate: number;
  loadTimeMinutes: number;
  dumpTimeMinutes: number;
  averageTruckSpeedMph: number;
}

export const LOGISTICS_BASE_DEFAULTS: EstimatorConfig = {
  truckCapacityGallons: 3000,
  disposalFeePerGallon: 0.18,
  truckHourlyRate: 185,
  loadTimeMinutes: 30,
  dumpTimeMinutes: 45,
  averageTruckSpeedMph: 45,
};

export const VERTICAL_LOGISTICS_OVERRIDES: Record<string, Partial<EstimatorConfig>> = {
  slurry_processing: {
    truckCapacityGallons: 2000,
    disposalFeePerGallon: 0.25,
    dumpTimeMinutes: 60,
  },
  concrete: {
    truckCapacityGallons: 2000,
    disposalFeePerGallon: 0.25,
    dumpTimeMinutes: 60,
  },
  industrial_wastewater: {
    truckCapacityGallons: 4000,
    disposalFeePerGallon: 0.12,
    loadTimeMinutes: 45,
  },
  medical_waste: {
    truckCapacityGallons: 1000,
    disposalFeePerGallon: 0.85,
    truckHourlyRate: 225,
    dumpTimeMinutes: 60,
  },
  asbestos_abatement: {
    truckCapacityGallons: 1500,
    disposalFeePerGallon: 0.75,
    truckHourlyRate: 225,
    dumpTimeMinutes: 75,
  },
  grease_trap: {
    truckCapacityGallons: 2500,
    disposalFeePerGallon: 0.30,
    dumpTimeMinutes: 60,
  },
  scrap_metal: {
    truckCapacityGallons: 4000,
    disposalFeePerGallon: 0.05,
    dumpTimeMinutes: 20,
  },
  hazardous_soil_remediation: {
    truckCapacityGallons: 2000,
    disposalFeePerGallon: 0.35,
    truckHourlyRate: 210,
    dumpTimeMinutes: 60,
  },
  dewatering: {
    truckCapacityGallons: 5000,
    disposalFeePerGallon: 0.08,
    loadTimeMinutes: 45,
    dumpTimeMinutes: 60,
  },
  hydro_excavation: {
    truckCapacityGallons: 2500,
    disposalFeePerGallon: 0.20,
    dumpTimeMinutes: 50,
  },
  tank_testing: {
    truckCapacityGallons: 2500,
    disposalFeePerGallon: 0.15,
    loadTimeMinutes: 60,
    dumpTimeMinutes: 50,
  },
  marine_construction: {
    truckCapacityGallons: 2000,
    disposalFeePerGallon: 0.28,
    dumpTimeMinutes: 60,
  },
  stormwater_compliance: {
    truckCapacityGallons: 3500,
    disposalFeePerGallon: 0.12,
    dumpTimeMinutes: 50,
  },
  fire_sprinkler: {
    truckCapacityGallons: 1500,
    disposalFeePerGallon: 0.22,
    truckHourlyRate: 165,
    loadTimeMinutes: 20,
    dumpTimeMinutes: 30,
  },
  fire_extinguisher: {
    truckCapacityGallons: 1000,
    disposalFeePerGallon: 0.35,
    truckHourlyRate: 165,
    loadTimeMinutes: 15,
    dumpTimeMinutes: 30,
  },
};
