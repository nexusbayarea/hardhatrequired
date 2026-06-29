import { supabaseFetch } from '@/lib/db'
import { captureError } from '@/lib/telemetry'

// ============================================================
// G4: Plan Limits Configuration
// ============================================================

export interface PlanConfig {
  id: string
  name: string
  monthlyPrice: number
  limits: {
    searchesPerMonth: number
    companiesPerMonth: number
    contactsPerMonth: number
    outreachPerMonth: number
    apiCallsPerMinute: number
    seats: number
    verticals: number
  }
  features: string[]
}

export const PLAN_TIERS: Record<string, PlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 49,
    limits: {
      searchesPerMonth: 50,
      companiesPerMonth: 500,
      contactsPerMonth: 1000,
      outreachPerMonth: 500,
      apiCallsPerMinute: 60,
      seats: 2,
      verticals: 2,
    },
    features: ['Basic search', 'CSV export', 'Email support'],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 149,
    limits: {
      searchesPerMonth: 200,
      companiesPerMonth: 2500,
      contactsPerMonth: 5000,
      outreachPerMonth: 2500,
      apiCallsPerMinute: 120,
      seats: 5,
      verticals: 5,
    },
    features: ['Advanced scoring', 'Campaign orchestration', 'Priority support', 'API access'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 499,
    limits: {
      searchesPerMonth: -1,
      companiesPerMonth: -1,
      contactsPerMonth: -1,
      outreachPerMonth: -1,
      apiCallsPerMinute: 300,
      seats: 20,
      verticals: -1,
    },
    features: ['Custom verticals', 'SSO', 'Dedicated support', 'SLA guarantee', 'On-prem option'],
  },
}

// ============================================================
// G1: Usage Metering
// ============================================================

export type UsageEventType = 
  | 'search_executed'
  | 'company_enriched'
  | 'contact_exported'
  | 'outreach_sent'
  | 'api_call'
  | 'provider_cost'

interface UsageRecord {
  orgId: string
  eventType: UsageEventType
  units: number
  metadata?: Record<string, unknown>
}

export async function recordUsage(record: UsageRecord): Promise<void> {
  try {
    await supabaseFetch('/rest/v1/usage_events', {
      method: 'POST',
      body: JSON.stringify({
        org_id: record.orgId,
        event_type: record.eventType,
        units: record.units,
        metadata: record.metadata,
      }),
    })
  } catch (e) {
    captureError({
      message: 'Failed to record usage',
      severity: 'warning',
      context: { record },
    })
  }
}

// ============================================================
// G2: Quota Enforcement
// ============================================================

export interface QuotaStatus {
  allowed: boolean
  currentUsage: Record<string, number>
  limits: Record<string, number>
  remaining: Record<string, number>
  resetDate: string
}

export async function checkQuota(
  orgId: string,
  eventType: UsageEventType,
  requestedUnits: number = 1
): Promise<{ allowed: boolean; status?: QuotaStatus }> {
  try {
    const { data: sub } = await supabaseFetch(
      `/rest/v1/subscriptions?org_id=eq.${orgId}&status=eq.active&select=*&limit=1`,
      { method: 'GET' }
    ).then(r => r.json())

    if (!sub || sub.length === 0) {
      return { allowed: false }
    }

    const plan = PLAN_TIERS[sub[0].plan_tier] || PLAN_TIERS.starter

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data: usage } = await supabaseFetch(
      `/rest/v1/usage_events?org_id=eq.${orgId}&event_type=eq.${eventType}&created_at=gte.${monthStart.toISOString()}&select=units`,
      { method: 'GET' }
    ).then(r => r.json())

    const currentUnits = usage?.reduce((sum: number, u: any) => sum + (u.units || 0), 0) || 0

    const limitMap: Record<UsageEventType, keyof PlanConfig['limits']> = {
      search_executed: 'searchesPerMonth',
      company_enriched: 'companiesPerMonth',
      contact_exported: 'contactsPerMonth',
      outreach_sent: 'outreachPerMonth',
      api_call: 'apiCallsPerMinute',
      provider_cost: 'searchesPerMonth',
    }

    const limitKey = limitMap[eventType]
    const limit = plan.limits[limitKey]

    if (limit === -1) {
      return { allowed: true }
    }

    const allowed = currentUnits + requestedUnits <= limit

    if (!allowed) {
      await recordUsage({
        orgId,
        eventType: 'api_call',
        units: 1,
        metadata: { action: 'quota_exceeded', event_type: eventType, requested: requestedUnits },
      })
    }

    return {
      allowed,
      status: {
        allowed,
        currentUsage: { [limitKey]: currentUnits },
        limits: { [limitKey]: limit },
        remaining: { [limitKey]: Math.max(0, limit - currentUnits) },
        resetDate: new Date(monthStart.getTime() + 86400000 * 30).toISOString(),
      },
    }
  } catch (e) {
    captureError({
      message: 'Quota check failed',
      severity: 'error',
      context: { orgId, eventType },
    })
    return { allowed: true }
  }
}

export async function enforceQuota(
  orgId: string,
  eventType: UsageEventType,
  units: number = 1
): Promise<void> {
  const { allowed, status } = await checkQuota(orgId, eventType, units)

  if (!allowed) {
    const limitKey = Object.keys(status?.limits || {})[0]
    throw new BillingError(
      `Quota exceeded: ${limitKey}. Current: ${status?.currentUsage[limitKey]}, Limit: ${status?.limits[limitKey]}`,
      429,
      status
    )
  }

  await recordUsage({ orgId, eventType, units })
}

export class BillingError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public quotaStatus?: QuotaStatus
  ) {
    super(message)
    this.name = 'BillingError'
  }
}

// ============================================================
// G3: Stripe Integration
// ============================================================

interface StripeCustomer {
  id: string
  orgId: string
  stripeCustomerId: string
  subscriptionId?: string
}

export async function createStripeCustomer(
  orgId: string,
  email: string
): Promise<StripeCustomer | null> {
  try {
    const stripe = await getStripeClient()
    if (!stripe) return null

    const customer = await stripe.customers.create({
      email,
      metadata: { org_id: orgId },
    })

    await supabaseFetch('/rest/v1/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        org_id: orgId,
        stripe_customer_id: customer.id,
        status: 'trialing',
        plan_tier: 'starter',
      }),
    })

    return {
      id: `${orgId}_stripe`,
      orgId,
      stripeCustomerId: customer.id,
    }
  } catch (e) {
    captureError({
      message: 'Stripe customer creation failed',
      severity: 'error',
      context: { orgId, email },
    })
    return null
  }
}

export async function createCheckoutSession(
  orgId: string,
  planTier: keyof typeof PLAN_TIERS,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string } | null> {
  try {
    const stripe = await getStripeClient()
    if (!stripe) return null

    const plan = PLAN_TIERS[planTier]

    const { data: sub } = await supabaseFetch(
      `/rest/v1/subscriptions?org_id=eq.${orgId}&select=stripe_customer_id&limit=1`,
      { method: 'GET' }
    ).then(r => r.json())

    let customerId = sub?.[0]?.stripe_customer_id

    if (!customerId) {
      const { data: org } = await supabaseFetch(
        `/rest/v1/organizations?id=eq.${orgId}&select=contact_email&limit=1`,
        { method: 'GET' }
      ).then(r => r.json())

      const newCustomer = await createStripeCustomer(orgId, org?.[0]?.contact_email || 'unknown@iie.dev')
      customerId = newCustomer?.stripeCustomerId
    }

    if (!customerId) return null

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `IIE ${plan.name} Plan` },
          unit_amount: plan.monthlyPrice * 100,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { org_id: orgId, plan_tier: planTier },
    })

    return { sessionId: session.id, url: session.url! }
  } catch (e) {
    captureError({
      message: 'Stripe checkout creation failed',
      severity: 'error',
      context: { orgId, planTier },
    })
    return null
  }
}

export async function handleStripeWebhook(payload: any, signature: string): Promise<void> {
  try {
    const stripe = await getStripeClient()
    if (!stripe) return

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const orgId = session.metadata?.org_id
        const planTier = session.metadata?.plan_tier

        if (orgId && planTier) {
          await supabaseFetch('/rest/v1/subscriptions', {
            method: 'PATCH',
            body: JSON.stringify({
              status: 'active',
              plan_tier: planTier,
              stripe_subscription_id: session.subscription,
            }),
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const orgId = invoice.metadata?.org_id

        if (orgId) {
          await supabaseFetch('/rest/v1/subscriptions', {
            method: 'PATCH',
            body: JSON.stringify({ status: 'past_due' }),
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const orgId = subscription.metadata?.org_id

        if (orgId) {
          await supabaseFetch('/rest/v1/subscriptions', {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cancelled' }),
          })
        }
        break
      }
    }
  } catch (e) {
    captureError({
      message: 'Stripe webhook handling failed',
      severity: 'critical',
      context: { eventType: payload?.type },
    })
  }
}

let stripeClient: any = null

async function getStripeClient(): Promise<any> {
  if (stripeClient) return stripeClient

  try {
    const { default: Stripe } = await import('stripe')
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
    return stripeClient
  } catch {
    console.warn('[STRIPE] Stripe SDK not available — billing features disabled')
    return null
  }
}
