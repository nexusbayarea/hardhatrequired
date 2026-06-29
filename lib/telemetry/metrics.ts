import { logger } from '@/lib/logger';
import { supabaseRpc } from '@/lib/db';

export interface ProviderMetrics {
  totalCalls: number;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  totalCost: number;
}

export async function getProviderMetrics(organizationId: string): Promise<Record<string, ProviderMetrics>> {
  try {
    const res = await supabaseRpc('get_system_observability_dashboard_by_org', { p_org_id: organizationId });

    if (!res.ok) return {};

    const data = await res.json();
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return {};

    const byProvider = row.latency_by_provider || {};
    const result: Record<string, ProviderMetrics> = {};

    for (const [provider, info] of Object.entries(byProvider)) {
      const i = info as any;
      result[provider] = {
        totalCalls: 0,
        successCount: 0,
        failureCount: 0,
        avgLatencyMs: i.avg_latency || 0,
        totalCost: i.total_cost || 0
      };
    }

    return result;
  } catch (err) {
    logger.error('Failed to fetch provider metrics', {
      route: 'telemetry/metrics',
      error: String(err)
    });
    return {};
  }
}
