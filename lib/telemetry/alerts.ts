import { logger } from '@/lib/logger';

export interface AlertRule {
  provider: string;
  metric: 'latency' | 'failure_rate' | 'cost';
  threshold: number;
  operator: 'gt' | 'lt' | 'gte' | 'lte';
}

export interface AlertEvent {
  rule: AlertRule;
  currentValue: number;
  message: string;
  timestamp: string;
}

const DEFAULT_RULES: AlertRule[] = [
  { provider: 'gemini_grounding', metric: 'latency', threshold: 10000, operator: 'gt' },
  { provider: 'google_places', metric: 'latency', threshold: 5000, operator: 'gt' },
  { provider: 'apollo', metric: 'latency', threshold: 7000, operator: 'gt' },
  { provider: 'gemini_grounding', metric: 'failure_rate', threshold: 20, operator: 'gt' },
  { provider: 'google_places', metric: 'failure_rate', threshold: 10, operator: 'gt' }
];

function evaluateRule(rule: AlertRule, value: number): boolean {
  switch (rule.operator) {
    case 'gt': return value > rule.threshold;
    case 'lt': return value < rule.threshold;
    case 'gte': return value >= rule.threshold;
    case 'lte': return value <= rule.threshold;
  }
}

export function evaluateAlerts(
  metrics: Record<string, { avgLatencyMs?: number; failureRate?: number; totalCost?: number }>,
  rules: AlertRule[] = DEFAULT_RULES
): AlertEvent[] {
  const events: AlertEvent[] = [];

  for (const rule of rules) {
    const providerMetric = metrics[rule.provider];
    if (!providerMetric) continue;

    let value: number | undefined;
    if (rule.metric === 'latency') value = providerMetric.avgLatencyMs;
    else if (rule.metric === 'failure_rate') value = providerMetric.failureRate;
    else if (rule.metric === 'cost') value = providerMetric.totalCost;

    if (value === undefined) continue;

    if (evaluateRule(rule, value)) {
      events.push({
        rule,
        currentValue: value,
        message: `[${rule.provider}] ${rule.metric} ${value} exceeds threshold ${rule.threshold}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  if (events.length > 0) {
    logger.warn(`Alerts triggered: ${events.length}`, {
      route: 'telemetry/alerts',
      data: { alerts: events.map(e => e.message) }
    });
  }

  return events;
}
