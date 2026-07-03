import { EstimatorConfig, LOGISTICS_BASE_DEFAULTS } from './vertical-configs';

export interface LogisticsCostMatrix {
  transitTimeMinutes: number;
  cycleTimeMinutes: number;
  estimatedHaulingCost: number;
  estimatedDisposalFee: number;
  totalEstimatedCost: number;
  costPerGallon: number;
}

export function calculateHaulingCost(
  oneWayDistanceMiles: number,
  config: EstimatorConfig = LOGISTICS_BASE_DEFAULTS,
): LogisticsCostMatrix {
  const totalTransitMiles = oneWayDistanceMiles * 2;
  const transitTimeHours = totalTransitMiles / config.averageTruckSpeedMph;
  const transitTimeMinutes = Math.round(transitTimeHours * 60);

  const totalCycleTimeMinutes = transitTimeMinutes + config.loadTimeMinutes + config.dumpTimeMinutes;
  const totalCycleTimeHours = totalCycleTimeMinutes / 60;

  const estimatedHaulingCost = Math.round(totalCycleTimeHours * config.truckHourlyRate);
  const estimatedDisposalFee = Math.round(config.truckCapacityGallons * config.disposalFeePerGallon);

  const totalEstimatedCost = estimatedHaulingCost + estimatedDisposalFee;
  const costPerGallon = parseFloat((totalEstimatedCost / config.truckCapacityGallons).toFixed(3));

  return {
    transitTimeMinutes,
    cycleTimeMinutes: totalCycleTimeMinutes,
    estimatedHaulingCost,
    estimatedDisposalFee,
    totalEstimatedCost,
    costPerGallon,
  };
}
