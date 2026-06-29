import { NextRequest, NextResponse } from 'next/server';
import { getVerticalConfigByDomain } from '@/lib/market/registry';
import { OutreachQueueItem, CampaignPerformanceStats } from '@/types/rpc_outreach';
import { supabaseFetch, supabaseRpc } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, campaignId, agentId, limit, interactionLog } = body;

    if (!action || !campaignId) {
      return NextResponse.json(
        { error: 'Incomplete request parameters. Campaign configuration details are required.' },
        { status: 400 }
      );
    }

    const clientHeader = req.headers.get('x-iie-client-context');
    if (!clientHeader) {
      return NextResponse.json(
        { error: 'X-IIE-Client-Context validation context missing.' },
        { status: 401 }
      );
    }

    const verticalConfig = await getVerticalConfigByDomain(clientHeader);
    if (!verticalConfig) {
      return NextResponse.json(
        { error: 'Invalid workspace or inactive tenant context signature.' },
        { status: 403 }
      );
    }

    if (action === 'fetch-queue') {
      const res = await supabaseRpc('acquire_outreach_targets_by_org', {
        p_org_id: verticalConfig.id,
        p_campaign_id: campaignId,
        p_agent_id: agentId || verticalConfig.id,
        p_limit: limit || 5
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`RPC acquire_outreach_targets_by_org failed: ${text}`);
      }
      const data = await res.json();

      const queue: OutreachQueueItem[] = (data || []).map((row: any) => ({
        companyId: row.company_id,
        companyName: row.company_name,
        website: row.website,
        phone: row.phone,
        email: row.email,
        city: row.city,
        state: row.state,
        priorityGroup: row.priority_group,
        enrichmentScore: Number(row.enrichment_score || 0),
        currentStatus: row.current_status,
        capabilitySummary: row.capability_summary
      }));

      return NextResponse.json({ success: true, count: queue.length, queue });
    }

    if (action === 'log-interaction') {
      if (!interactionLog || !interactionLog.companyId || !interactionLog.interactionType || !interactionLog.outcome) {
        return NextResponse.json({ error: 'Missing core interaction values to construct outreach records.' }, { status: 400 });
      }

      const insertRes = await supabaseFetch('/rest/v1/outreach_logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          organization_id: verticalConfig.id,
          company_id: interactionLog.companyId,
          campaign_id: campaignId,
          contact_id: interactionLog.contactId || null,
          interaction_type: interactionLog.interactionType,
          outcome: interactionLog.outcome,
          notes: interactionLog.notes || null,
          performed_by: verticalConfig.id
        })
      });

      if (!insertRes.ok) {
        const errText = await insertRes.text();
        return NextResponse.json({ error: 'Outreach database transaction error occurred.', details: errText }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Activity logged. Automatic CRM lead progression committed.' });
    }

    if (action === 'get-analytics') {
      const res = await supabaseRpc('get_campaign_analytics_aggregates_by_org', {
        p_org_id: verticalConfig.id,
        p_campaign_id: campaignId
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`RPC get_campaign_analytics_aggregates_by_org failed: ${text}`);
      }
      const data = await res.json();

      const rawStats = Array.isArray(data) ? data[0] : data;
      const statistics: CampaignPerformanceStats = {
        totalAssignedLeads: Number(rawStats?.total_assigned_leads || 0),
        totalCompletedInteractions: Number(rawStats?.total_completed_interactions || 0),
        callsMade: Number(rawStats?.calls_made || 0),
        emailsSent: Number(rawStats?.emails_sent || 0),
        positiveConnections: Number(rawStats?.positive_connections || 0),
        rejections: Number(rawStats?.rejections || 0),
        connectionRatio: Number(Number(rawStats?.connection_ratio || 0).toFixed(2)),
        conversionToInterestRatio: Number(Number(rawStats?.conversion_to_interest_ratio || 0).toFixed(2))
      };

      return NextResponse.json({ success: true, statistics });
    }

    return NextResponse.json(
      { error: `Requested route action: '${action}' is not registered.` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
