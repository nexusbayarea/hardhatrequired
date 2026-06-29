import { NextRequest, NextResponse } from 'next/server';
import { getVerticalConfigByDomain } from '@/lib/market/registry';
import { SystemObservabilityStats } from '@/types/rpc_telemetry';
import { supabaseFetch, supabaseRpc } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, verticalConfig, auditPayload } = body;

    const clientHeader = req.headers.get('x-iie-client-context');
    if (!clientHeader) {
      return NextResponse.json(
        { error: 'X-IIE-Client-Context validation identity token missing.' },
        { status: 401 }
      );
    }

    const tenantConfig = await getVerticalConfigByDomain(clientHeader);
    if (!tenantConfig) {
      return NextResponse.json(
        { error: 'Unregistered or inactive client configuration context.' },
        { status: 403 }
      );
    }

    if (action === 'get-telemetry') {
      const res = await supabaseRpc('get_system_observability_dashboard_by_org', {
        p_org_id: tenantConfig.id
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`RPC get_system_observability_dashboard_by_org failed: ${text}`);
      }
      const data = await res.json();

      const row = Array.isArray(data) ? data[0] : data;
      const stats: SystemObservabilityStats = {
        totalApiCalls: Number(row?.total_api_calls || 0),
        accumulatedCost: Number(Number(row?.accumulated_cost || 0).toFixed(6)),
        averageLatencyMs: Number(Number(row?.average_latency_ms || 0).toFixed(2)),
        averageGeminiLatencyMs: Number(Number(row?.average_gemini_latency_ms || 0).toFixed(2)),
        googleCalls: Number(row?.google_calls || 0),
        apolloCalls: Number(row?.apollo_calls || 0),
        geminiCalls: Number(row?.gemini_calls || 0),
        adapterCalls: Number(row?.adapter_calls || 0),
        failureRatePercentage: Number(Number(row?.failure_rate_percentage || 0).toFixed(2)),
        latencyByProvider: row?.latency_by_provider || {}
      };

      return NextResponse.json({ success: true, stats });
    }

    if (action === 'upsert-vertical') {
      if (!verticalConfig || !verticalConfig.slug || !verticalConfig.industryName) {
        return NextResponse.json({ error: 'Incomplete parameters to create vertical profile configuration.' }, { status: 400 });
      }

      const res = await supabaseRpc('upsert_vertical_configuration_by_org', {
        p_org_id: tenantConfig.id,
        p_slug: verticalConfig.slug,
        p_industry_name: verticalConfig.industryName,
        p_target_naics_codes: verticalConfig.targetNaicsCodes || [],
        p_equipment_keywords: verticalConfig.equipmentKeywords || [],
        p_negative_keywords: verticalConfig.negativeKeywords || [],
        p_search_queries: verticalConfig.searchQueries || [],
        p_base_scoring_weights: verticalConfig.baseScoringWeights || {
          distanceWeight: 30,
          contactEnrichmentWeight: 40,
          assetSignalWeight: 30
        }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`RPC upsert_vertical_configuration_by_org failed: ${text}`);
      }
      const data = await res.json();

      return NextResponse.json({
        success: true,
        verticalId: data,
        message: `Vertical '${verticalConfig.industryName}' saved successfully.`
      });
    }

    if (action === 'log-audit') {
      if (!auditPayload || !auditPayload.providerName || !auditPayload.actionPerformed) {
        return NextResponse.json({ error: 'Audit metric is missing core latency payload arrays.' }, { status: 400 });
      }

      const insertRes = await supabaseFetch('/rest/v1/provider_audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          organization_id: tenantConfig.id,
          vertical_id: tenantConfig.id,
          provider_name: auditPayload.providerName,
          action_performed: auditPayload.actionPerformed,
          latency_ms: Number(auditPayload.latencyMs || 0),
          tokens_consumed: Number(auditPayload.tokensConsumed || 0),
          estimated_cost: Number(auditPayload.estimatedCost || 0.0),
          is_success: auditPayload.isSuccess !== false,
          error_message: auditPayload.errorMessage || null
        })
      });

      if (!insertRes.ok) {
        const errText = await insertRes.text();
        return NextResponse.json({ error: 'Error committing telemetry audit trace.', details: errText }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Telemetry audit locked successfully.' });
    }

    return NextResponse.json(
      { error: `Requested route action '${action}' is not registered.` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
