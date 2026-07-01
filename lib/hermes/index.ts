import { supabaseFetch } from '@/lib/db'
import { captureError } from '@/lib/telemetry'

interface HermesConfig {
  apiKey: string
  baseUrl: string
  webhookSecret: string
}

function getHermesConfig(): HermesConfig | null {
  const apiKey = process.env.HERMES_API_KEY
  const baseUrl = process.env.HERMES_BASE_URL || 'https://api.hermes outreach.io/v1'

  if (!apiKey) {
    console.warn('[HERMES] HERMES_API_KEY not set — integration disabled')
    return null
  }

  return { apiKey, baseUrl, webhookSecret: process.env.HERMES_WEBHOOK_SECRET || '' }
}

interface HermesSequenceStep {
  stepNumber: number
  channel: 'email' | 'sms' | 'linkedin' | 'voicemail'
  delayHours: number
  templateId: string
  subject?: string
  body: string
}

interface HermesTarget {
  companyId: string
  contactId: string
  email?: string
  phone?: string
  linkedinUrl?: string
  firstName: string
  companyName: string
  priority: string
}

interface HermesCampaignPayload {
  campaignId: string
  orgId: string
  name: string
  vertical: string
  sequence: HermesSequenceStep[]
  targets: HermesTarget[]
}

interface HermesWebhookEvent {
  type: 'email.opened' | 'email.clicked' | 'email.replied' | 'sms.delivered' | 'call.completed'
  campaignId: string
  targetId: string
  contactId: string
  metadata: Record<string, unknown>
  timestamp: string
}

export async function syncCampaignToHermes(
  campaignId: string,
  orgId: string
): Promise<{ success: boolean; hermesCampaignId?: string; error?: string }> {
  const config = getHermesConfig()
  if (!config) {
    return { success: false, error: 'Hermes not configured' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const campaignRes = await fetch(`${baseUrl}/api/campaigns/id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId }),
    })
    const campaign = await campaignRes.json()

    if (!campaign) {
      return { success: false, error: 'Campaign not found' }
    }

    const queueRes = await fetch(`${baseUrl}/api/campaigns/call-queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId }),
    })
    const queue = await queueRes.json()

    const payload: HermesCampaignPayload = {
      campaignId,
      orgId,
      name: campaign.name,
      vertical: campaign.vertical,
      sequence: buildSequence(campaign.vertical),
      targets: (queue.queue || []).map((item: any) => ({
        companyId: item.companyId,
        contactId: item.contactId || item.companyId,
        email: item.email,
        phone: item.phone,
        linkedinUrl: item.linkedin_url,
        firstName: item.contactName?.split(' ')[0] || 'there',
        companyName: item.companyName,
        priority: item.priority,
      })),
    }

    const hermesRes = await fetch(`${config.baseUrl}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!hermesRes.ok) {
      throw new Error(`Hermes API error: ${hermesRes.status}`)
    }

    const hermesData = await hermesRes.json()

    await supabaseFetch('/rest/v1/outreach_logs', {
      method: 'POST',
      body: JSON.stringify({
        org_id: orgId,
        campaign_id: campaignId,
        action: 'hermes_sync',
        details: {
          hermes_campaign_id: hermesData.id,
          targets_count: payload.targets.length,
          sequence_steps: payload.sequence.length,
        },
      }),
    })

    return { success: true, hermesCampaignId: hermesData.id }
  } catch (e: any) {
    captureError({
      message: 'Hermes sync failed',
      severity: 'error',
      context: { campaignId, orgId, error: e.message },
    })
    return { success: false, error: e.message }
  }
}

function buildSequence(vertical: string): HermesSequenceStep[] {
  const sequences: Record<string, HermesSequenceStep[]> = {
    slurry_processing: [
      {
        stepNumber: 1,
        channel: 'email',
        delayHours: 0,
        templateId: 'concrete_intro',
        subject: 'Quick question about your concrete slurry disposal',
        body: `Hi {{firstName}},\n\nI noticed {{companyName}} handles concrete work in the area. We specialize in slurry recycling that can cut disposal costs by 40%.\n\nWorth a 5-minute chat?\n\nBest,\n[Your Name]`,
      },
      {
        stepNumber: 2,
        channel: 'email',
        delayHours: 72,
        templateId: 'concrete_followup',
        subject: 'Re: concrete slurry — case study attached',
        body: `Hi {{firstName}},\n\nFollowing up on my note about slurry recycling. Attached is a case study from a contractor near you who saved $12K/month.\n\nOpen to a brief call this week?\n\nBest,\n[Your Name]`,
      },
      {
        stepNumber: 3,
        channel: 'sms',
        delayHours: 168,
        templateId: 'concrete_sms',
        body: `Hi {{firstName}}, this is [Name] from [Company]. Quick question about your concrete slurry disposal — are you open to saving 40% on costs? Reply STOP to opt out.`,
      },
    ],
    default: [
      {
        stepNumber: 1,
        channel: 'email',
        delayHours: 0,
        templateId: 'generic_intro',
        subject: 'Partnership opportunity with {{companyName}}',
        body: `Hi {{firstName}},\n\nI came across {{companyName}} and think there might be a great fit for a partnership.\n\nDo you have 10 minutes this week for a quick intro call?\n\nBest,\n[Your Name]`,
      },
      {
        stepNumber: 2,
        channel: 'email',
        delayHours: 96,
        templateId: 'generic_followup',
        subject: 'Re: Partnership opportunity',
        body: `Hi {{firstName}},\n\nWanted to make sure my last email didn't get buried. Still interested in exploring how we might work together?\n\nBest,\n[Your Name]`,
      },
    ],
  }

  return sequences[vertical] || sequences.default
}

export async function handleHermesWebhook(
  event: HermesWebhookEvent,
  signature: string
): Promise<void> {
  const config = getHermesConfig()
  if (!config) return

  try {
    const interactionType = event.type.split('.')[0] as 'email' | 'sms' | 'call'
    const outcome = event.type.split('.')[1] as 'opened' | 'clicked' | 'replied' | 'delivered' | 'completed'

    await supabaseFetch('/rest/v1/outreach_logs', {
      method: 'POST',
      body: JSON.stringify({
        org_id: event.campaignId,
        campaign_id: event.campaignId,
        contact_id: event.contactId,
        interaction_type: interactionType,
        outcome,
        metadata: event.metadata,
        created_at: event.timestamp,
      }),
    })

    if (event.type === 'email.replied') {
      await triggerAINextAction(event)
    }
  } catch (e: any) {
    captureError({
      message: 'Hermes webhook handling failed',
      severity: 'error',
      context: { eventType: event.type, campaignId: event.campaignId },
    })
  }
}

async function triggerAINextAction(event: HermesWebhookEvent): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/campaign-orchestrator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'analyze_reply',
        campaignId: event.campaignId,
        contactId: event.contactId,
        replyText: event.metadata?.replyText,
      }),
    })

    const nextAction = await res.json()

    await supabaseFetch('/rest/v1/outreach_logs', {
      method: 'POST',
      body: JSON.stringify({
        org_id: event.campaignId,
        campaign_id: event.campaignId,
        contact_id: event.contactId,
        interaction_type: 'ai_analysis',
        outcome: 'next_action_generated',
        metadata: { next_action: nextAction },
      }),
    })
  } catch (e) {
    console.error('AI next action failed', e)
  }
}

export async function getHermesStatus(): Promise<{ connected: boolean; campaigns: number; error?: string }> {
  const config = getHermesConfig()
  if (!config) return { connected: false, campaigns: 0, error: 'Not configured' }

  try {
    const res = await fetch(`${config.baseUrl}/health`, {
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
    })

    if (!res.ok) {
      return { connected: false, campaigns: 0, error: `HTTP ${res.status}` }
    }

    const data = await res.json()
    return { connected: true, campaigns: data.activeCampaigns || 0 }
  } catch (e: any) {
    return { connected: false, campaigns: 0, error: e.message }
  }
}

export async function syncAllActiveCampaigns(orgId: string): Promise<{
  synced: number
  failed: number
  errors: string[]
}> {
  const result = { synced: 0, failed: 0, errors: [] as string[] }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, status: 'ACTIVE' }),
    })
    const data = await res.json()

    for (const campaign of data.campaigns || []) {
      const syncResult = await syncCampaignToHermes(campaign.id, orgId)
      if (syncResult.success) {
        result.synced++
      } else {
        result.failed++
        result.errors.push(`${campaign.name}: ${syncResult.error}`)
      }
    }
  } catch (e: any) {
    result.errors.push(`Batch sync failed: ${e.message}`)
  }

  return result
}
