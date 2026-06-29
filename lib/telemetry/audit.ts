import { logger } from '@/lib/logger';
import { supabaseFetch } from '@/lib/db';

export type ProviderName = 'google_places' | 'apollo' | 'gemini_grounding' | 'system_adapter';

export interface AuditEntry {
  organizationId: string;
  verticalId: string;
  providerName: ProviderName;
  actionPerformed: string;
  latencyMs: number;
  tokensConsumed?: number;
  estimatedCost?: number;
  isSuccess: boolean;
  errorMessage?: string;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await supabaseFetch('/rest/v1/provider_audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: entry.organizationId,
        vertical_id: entry.verticalId,
        provider_name: entry.providerName,
        action_performed: entry.actionPerformed,
        latency_ms: entry.latencyMs,
        tokens_consumed: entry.tokensConsumed || 0,
        estimated_cost: entry.estimatedCost || 0,
        is_success: entry.isSuccess,
        error_message: entry.errorMessage || null
      })
    });
  } catch {
    logger.debug('Audit skipped: Supabase credentials not configured', {
      route: 'telemetry/audit',
      data: { provider: entry.providerName, action: entry.actionPerformed }
    });
  }
}

export async function audit<T>(
  providerName: ProviderName,
  actionPerformed: string,
  ctx: { organizationId: string; verticalId: string },
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  let isSuccess = true;
  let errorMessage: string | undefined;

  try {
    return await fn();
  } catch (err) {
    isSuccess = false;
    errorMessage = String(err);
    throw err;
  } finally {
    const latencyMs = Date.now() - start;
    writeAudit({
      organizationId: ctx.organizationId,
      verticalId: ctx.verticalId,
      providerName,
      actionPerformed,
      latencyMs,
      isSuccess,
      errorMessage
    });
  }
}
