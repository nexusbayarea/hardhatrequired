import { LOGISTICS_BASE_DEFAULTS, VERTICAL_LOGISTICS_OVERRIDES, EstimatorConfig } from './vertical-configs';

export function getVerticalEstimatorConfig(vertical: string): EstimatorConfig {
  const overrides = VERTICAL_LOGISTICS_OVERRIDES[vertical];

  if (!overrides) {
    return LOGISTICS_BASE_DEFAULTS;
  }

  return { ...LOGISTICS_BASE_DEFAULTS, ...overrides };
}
