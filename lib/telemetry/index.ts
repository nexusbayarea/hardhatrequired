import { supabaseFetch, supabaseRpc } from '@/lib/db'

// ============================================================
// F1: Provider Audit Logging
// ============================================================

export interface AuditEntry {
  provider: string
  action: string
  orgId?: string
  userId?: string
  route?: string
  durationMs?: number
  status?: 'success' | 'failure' | 'timeout' | 'throttled'
  details?: Record<string, unknown>
  errorMessage?: string
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await supabaseFetch('/rest/v1/provider_audits', {
      method: 'POST',
      body: JSON.stringify({
        provider_name: entry.provider,
        action: entry.action,
        org_id: entry.orgId,
        user_id: entry.userId,
        route: entry.route,
        duration_ms: entry.durationMs,
        status: entry.status,
        details: entry.details,
        error_message: entry.errorMessage,
      }),
    })
  } catch (e) {
    console.error('[AUDIT] Failed to write audit:', e)
  }
}

export function audit(provider: string, action: string) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value
    descriptor.value = async function(...args: any[]) {
      const start = Date.now()
      try {
        const result = await original.apply(this, args)
        await writeAudit({
          provider,
          action,
          durationMs: Date.now() - start,
          status: 'success',
        })
        return result
      } catch (e: any) {
        await writeAudit({
          provider,
          action,
          durationMs: Date.now() - start,
          status: 'failure',
          errorMessage: e.message,
        })
        throw e
      }
    }
    return descriptor
  }
}

// ============================================================
// F2: Cost Telemetry
// ============================================================

interface CostEvent {
  provider: string
  orgId: string
  operation: string
  costUsd: number
  tokensIn?: number
  tokensOut?: number
  timestamp: number
}

const costBuffer: CostEvent[] = []
const COST_FLUSH_INTERVAL = 30000
const COST_FLUSH_SIZE = 50

const COST_RATES: Record<string, { per1kTokens?: number; perRequest?: number }> = {
  'deepseek-chat': { per1kTokens: 0.0014 },
  'gemini-2.0-flash': { per1kTokens: 0.00035 },
  'google_places': { perRequest: 0.017 },
  'apollo': { perRequest: 0.05 },
}

export function recordCost(
  provider: string,
  orgId: string,
  operation: string,
  tokensIn?: number,
  tokensOut?: number
): void {
  const rate = COST_RATES[provider]
  if (!rate) return

  let costUsd = 0
  if (rate.per1kTokens && (tokensIn || tokensOut)) {
    costUsd = ((tokensIn || 0) + (tokensOut || 0)) * rate.per1kTokens / 1000
  } else if (rate.perRequest) {
    costUsd = rate.perRequest
  }

  costBuffer.push({
    provider,
    orgId,
    operation,
    costUsd,
    tokensIn,
    tokensOut,
    timestamp: Date.now(),
  })

  if (costBuffer.length >= COST_FLUSH_SIZE) {
    flushCosts()
  }
}

async function flushCosts(): Promise<void> {
  if (costBuffer.length === 0) return

  const batch = costBuffer.splice(0, costBuffer.length)

  try {
    await supabaseFetch('/rest/v1/usage_events', {
      method: 'POST',
      body: JSON.stringify(batch.map(e => ({
        org_id: e.orgId,
        event_type: 'provider_cost',
        provider: e.provider,
        operation: e.operation,
        cost_usd: e.costUsd,
        metadata: { tokens_in: e.tokensIn, tokens_out: e.tokensOut },
      }))),
    })
  } catch (e) {
    console.error('[COST] Failed to flush cost telemetry:', e)
  }
}

setInterval(flushCosts, COST_FLUSH_INTERVAL)

// ============================================================
// F3: Error Monitoring
// ============================================================

interface ErrorEvent {
  message: string
  stack?: string
  route?: string
  orgId?: string
  userId?: string
  severity: 'warning' | 'error' | 'critical'
  context?: Record<string, unknown>
}

const errorBuffer: ErrorEvent[] = []

export function captureError(event: ErrorEvent): void {
  errorBuffer.push(event)

  if (event.severity === 'critical') {
    flushErrors()
  }

  const prefix = `[${event.severity.toUpperCase()}]`
  if (event.severity === 'critical') {
    console.error(prefix, event.message, event.stack)
  } else {
    console.warn(prefix, event.message)
  }
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  captureError({
    message: error.message,
    stack: error.stack,
    severity: 'error',
    context,
  })
}

async function flushErrors(): Promise<void> {
  if (errorBuffer.length === 0) return

  const batch = errorBuffer.splice(0, errorBuffer.length)

  try {
    await supabaseFetch('/rest/v1/usage_events', {
      method: 'POST',
      body: JSON.stringify(batch.map(e => ({
        org_id: e.orgId,
        event_type: 'error',
        severity: e.severity,
        message: e.message,
        stack: e.stack,
        route: e.route,
        metadata: e.context,
      }))),
    })
  } catch (e) {
    console.error('[ERROR MONITOR] Failed to flush errors:', e)
  }
}

setInterval(flushErrors, 60000)

// ============================================================
// F4: Admin Metrics Dashboard
// ============================================================

export interface SystemMetrics {
  totalOrgs: number
  totalSearches: number
  totalCompanies: number
  totalOutreach: number
  providerHealth: Record<string, { status: string; failures: number }>
  costToday: number
  errorsLastHour: number
  avgResponseTime: number
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
  try {
    const orgs = await supabaseRpc('get_system_observability_dashboard', {}).then(r => r.json())
    const { getCircuitHealth } = await import('@/lib/market/reliability')

    return {
      totalOrgs: orgs?.total_organizations || 0,
      totalSearches: orgs?.total_searches || 0,
      totalCompanies: orgs?.total_companies || 0,
      totalOutreach: orgs?.total_outreach_logs || 0,
      providerHealth: getCircuitHealth(),
      costToday: 0,
      errorsLastHour: 0,
      avgResponseTime: orgs?.avg_response_time_ms || 0,
    }
  } catch (e) {
    captureException(e as Error, { route: 'getSystemMetrics' })
    return {
      totalOrgs: 0, totalSearches: 0, totalCompanies: 0, totalOutreach: 0,
      providerHealth: {}, costToday: 0, errorsLastHour: 0, avgResponseTime: 0,
    }
  }
}

export async function getOrgMetrics(orgId: string) {
  try {
    const result = await supabaseRpc('get_tenant_metrics_by_org', { p_org_id: orgId })
    return result
  } catch (e) {
    captureException(e as Error, { route: 'getOrgMetrics', orgId })
    return null
  }
}
