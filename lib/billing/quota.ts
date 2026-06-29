import { logger } from '@/lib/logger';
import { supabaseFetch, supabaseRpc } from '@/lib/db';

export interface QuotaResult {
  allowed: boolean;
  current: number;
  limit: number;
}

export async function checkQuota(organizationId: string, eventType: string): Promise<QuotaResult> {
  try {
    const [usageRes, limitsRes] = await Promise.all([
      supabaseRpc('get_tenant_metrics_by_org', { p_org_id: organizationId }),
      supabaseFetch('/rest/v1/billing_limits')
    ]);

    if (!usageRes.ok || !limitsRes.ok) {
      return { allowed: true, current: 0, limit: 999999 };
    }

    const usage = await usageRes.json();
    const limits = await limitsRes.json();

    const plan = usage[0]?.plan_tier || 'starter';
    const tierLimits = limits.find((l: any) => l.plan_tier === plan);
    if (!tierLimits) return { allowed: true, current: 0, limit: 999999 };

    const eventCount = usage[0]?.[`${eventType}_count`] || 0;
    const maxField = eventType === 'search' ? 'max_searches'
      : eventType === 'enrichment' ? 'max_enrichments'
      : eventType === 'export' ? 'max_exports'
      : eventType === 'campaign' ? 'max_campaigns'
      : null;

    if (!maxField) return { allowed: true, current: 0, limit: 999999 };

    const limit = tierLimits[maxField] || 999999;

    return {
      allowed: eventCount < limit,
      current: eventCount,
      limit
    };
  } catch (err) {
    logger.error('Quota check failed', { route: 'billing/quota', error: String(err) });
    return { allowed: true, current: 0, limit: 999999 };
  }
}

export async function incrementUsage(organizationId: string, eventType: string, units = 1): Promise<void> {
  try {
    await supabaseFetch('/rest/v1/usage_events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: organizationId,
        event_type: eventType,
        units
      })
    });
  } catch (err) {
    logger.error('Usage increment failed', { route: 'billing/quota', error: String(err) });
  }
}
