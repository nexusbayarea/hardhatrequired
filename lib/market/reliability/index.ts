import { writeAudit } from '@/lib/telemetry/audit'

interface CircuitState {
  failures: number
  lastFailure: number
  open: boolean
  nextAttempt: number
}

const CIRCUIT_CONFIG = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  openTimeoutMs: 60000,
}

const circuits = new Map<string, CircuitState>()

function getCircuit(provider: string): CircuitState {
  if (!circuits.has(provider)) {
    circuits.set(provider, { failures: 0, lastFailure: 0, open: false, nextAttempt: 0 })
  }
  return circuits.get(provider)!
}

function recordFailure(provider: string) {
  const state = getCircuit(provider)
  state.failures++
  state.lastFailure = Date.now()

  if (state.failures >= CIRCUIT_CONFIG.failureThreshold) {
    state.open = true
    state.nextAttempt = Date.now() + CIRCUIT_CONFIG.openTimeoutMs
    console.warn(`[CIRCUIT BREAKER] ${provider} OPENED — cooling down for ${CIRCUIT_CONFIG.openTimeoutMs}ms`)
  }
}

function recordSuccess(provider: string) {
  const state = getCircuit(provider)
  state.failures = 0
  state.open = false
  state.nextAttempt = 0
}

function isCircuitOpen(provider: string): boolean {
  const state = getCircuit(provider)
  if (!state.open) return false

  if (Date.now() >= state.nextAttempt) {
    state.open = false
    console.log(`[CIRCUIT BREAKER] ${provider} HALF-OPEN — probing...`)
    return false
  }
  return true
}

// ============================================================
// E1: Google Rate Limit Protection
// ============================================================

interface RateLimitBucket {
  tokens: number
  lastRefill: number
}

const googleBuckets = new Map<string, RateLimitBucket>()
const GOOGLE_RPS = 50

function getGoogleBucket(key: string): RateLimitBucket {
  if (!googleBuckets.has(key)) {
    googleBuckets.set(key, { tokens: GOOGLE_RPS, lastRefill: Date.now() })
  }
  return googleBuckets.get(key)!
}

export async function withGoogleRateLimit<T>(
  fn: () => Promise<T>,
  orgId: string
): Promise<T> {
  const bucket = getGoogleBucket(orgId)
  const now = Date.now()
  const elapsed = now - bucket.lastRefill

  bucket.tokens = Math.min(GOOGLE_RPS, bucket.tokens + (elapsed / 1000) * GOOGLE_RPS)
  bucket.lastRefill = now

  if (bucket.tokens < 1) {
    const waitMs = Math.ceil((1 - bucket.tokens) * 1000 / GOOGLE_RPS)
    console.warn(`[GOOGLE RATE LIMIT] Org ${orgId} throttled. Waiting ${waitMs}ms`)
    await new Promise(r => setTimeout(r, waitMs))
    return withGoogleRateLimit(fn, orgId)
  }

  bucket.tokens--

  try {
    const result = await withTimeout(fn, 10000, null)
    if (result === null) throw new Error('Google Places timeout')
    recordSuccess('google_places')
    return result
  } catch (e) {
    recordFailure('google_places')
    throw e
  }
}

// ============================================================
// E2: Apollo Credit Controls
// ============================================================

const APOLLO_CREDIT_COST = {
  enrich: 1,
  search: 5,
}

interface CreditLedger {
  used: number
  limit: number
  resetAt: number
}

const apolloLedgers = new Map<string, CreditLedger>()

export async function checkApolloCredits(orgId: string, operation: keyof typeof APOLLO_CREDIT_COST): Promise<boolean> {
  const cost = APOLLO_CREDIT_COST[operation]
  let ledger = apolloLedgers.get(orgId)

  if (!ledger || Date.now() > ledger.resetAt) {
    ledger = { used: 0, limit: 1000, resetAt: Date.now() + 86400000 }
    apolloLedgers.set(orgId, ledger)
  }

  if (ledger.used + cost > ledger.limit) {
    await writeAudit({
      provider: 'apollo',
      action: 'CREDIT_EXHAUSTED',
      orgId,
      details: { operation, cost, used: ledger.used, limit: ledger.limit }
    })
    return false
  }

  ledger.used += cost
  return true
}

export async function withApolloCreditControl<T>(
  fn: () => Promise<T>,
  orgId: string,
  operation: keyof typeof APOLLO_CREDIT_COST
): Promise<T | null> {
  if (isCircuitOpen('apollo')) {
    console.warn('[APOLLO] Circuit breaker open — skipping request')
    return null
  }

  const hasCredits = await checkApolloCredits(orgId, operation)
  if (!hasCredits) {
    return null
  }

  try {
    const result = await withTimeout(fn, 15000, null)
    if (result === null) throw new Error('Apollo timeout')
    recordSuccess('apollo')
    return result
  } catch (e) {
    recordFailure('apollo')
    throw e
  }
}

// ============================================================
// E3: Gemini/DeepSeek Timeout Fallbacks
// ============================================================

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  const timeout = new Promise<T>((_, reject) => 
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  )

  try {
    return await Promise.race([promise, timeout])
  } catch (e) {
    console.warn(`[TIMEOUT FALLBACK] Returning fallback after ${ms}ms`)
    return fallback
  }
}

export async function withGeminiFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  timeoutMs: number = 8000
): Promise<T> {
  if (isCircuitOpen('gemini')) {
    console.warn('[GEMINI] Circuit breaker open — using fallback')
    return fallback()
  }

  try {
    const result = await withTimeout(primary(), timeoutMs, null)
    if (result === null) {
      recordFailure('gemini')
      return fallback()
    }
    recordSuccess('gemini')
    return result
  } catch (e) {
    recordFailure('gemini')
    return fallback()
  }
}

export async function withDeepSeekFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  if (isCircuitOpen('deepseek')) {
    console.warn('[DEEPSEEK] Circuit breaker open — using fallback')
    return fallback()
  }

  try {
    const result = await withTimeout(primary(), timeoutMs, null)
    if (result === null) {
      recordFailure('deepseek')
      return fallback()
    }
    recordSuccess('deepseek')
    return result
  } catch (e) {
    recordFailure('deepseek')
    return fallback()
  }
}

// ============================================================
// E4: Circuit Breakers — Health Check
// ============================================================

export function getCircuitHealth(): Record<string, { status: string; failures: number; open: boolean }> {
  const health: Record<string, { status: string; failures: number; open: boolean }> = {}
  for (const [provider, state] of circuits) {
    health[provider] = {
      status: state.open ? 'OPEN' : state.failures > 0 ? 'DEGRADED' : 'HEALTHY',
      failures: state.failures,
      open: state.open,
    }
  }
  return health
}

export function resetCircuit(provider: string) {
  circuits.delete(provider)
  console.log(`[CIRCUIT BREAKER] ${provider} manually reset`)
}
