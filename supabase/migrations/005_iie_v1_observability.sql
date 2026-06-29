-- =====================================================================
-- IIE v1.0 DATABASE SYSTEM OBSERVABILITY & VERTICAL CONFIG CRUD (Part 5)
-- Target: Supabase / PostgreSQL Core Database Layer
-- Description: Configures provider audit tables, scraper hit performance
--              analysis logs, and secure dynamic Vertical Tuning RPCs.
-- =====================================================================

-- STREAMING_CHUNK: Setting up system observability audit logs schema...
CREATE TABLE IF NOT EXISTS public.provider_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vertical_id UUID NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL CHECK (provider_name IN ('google_places', 'apollo', 'gemini_grounding', 'system_adapter')),
  action_performed TEXT NOT NULL,
  latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
  tokens_consumed INTEGER DEFAULT 0,
  estimated_cost NUMERIC(10, 6) DEFAULT 0.000000,
  is_success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_provider_audits_org_provider ON public.provider_audits(organization_id, provider_name);
CREATE INDEX IF NOT EXISTS idx_provider_audits_created ON public.provider_audits(created_at DESC);

-- STREAMING_CHUNK: Designing vertical configuration CRUD management function...
CREATE OR REPLACE FUNCTION public.upsert_vertical_configuration(
  p_slug TEXT,
  p_industry_name TEXT,
  p_target_naics_codes TEXT[],
  p_equipment_keywords TEXT[],
  p_negative_keywords TEXT[],
  p_search_queries TEXT[],
  p_base_scoring_weights JSONB
)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
  v_vertical_id UUID;
BEGIN
  v_org_id := public.get_auth_org_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Authentication Fault: Explicit tenant authorization scope required for updates.';
  END IF;

  INSERT INTO public.verticals (
    organization_id, slug, industry_name, target_naics_codes,
    equipment_keywords, negative_keywords, search_queries, base_scoring_weights
  )
  VALUES (
    v_org_id, p_slug, p_industry_name, p_target_naics_codes,
    p_equipment_keywords, p_negative_keywords, p_search_queries, p_base_scoring_weights
  )
  ON CONFLICT (organization_id, slug) DO UPDATE SET
    industry_name = EXCLUDED.industry_name,
    target_naics_codes = EXCLUDED.target_naics_codes,
    equipment_keywords = EXCLUDED.equipment_keywords,
    negative_keywords = EXCLUDED.negative_keywords,
    search_queries = EXCLUDED.search_queries,
    base_scoring_weights = EXCLUDED.base_scoring_weights,
    created_at = timezone('utc'::text, now())
  RETURNING id INTO v_vertical_id;

  RETURN v_vertical_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service-role companion: explicit org_id
CREATE OR REPLACE FUNCTION public.upsert_vertical_configuration_by_org(
  p_org_id UUID,
  p_slug TEXT,
  p_industry_name TEXT,
  p_target_naics_codes TEXT[],
  p_equipment_keywords TEXT[],
  p_negative_keywords TEXT[],
  p_search_queries TEXT[],
  p_base_scoring_weights JSONB
)
RETURNS UUID AS $$
DECLARE
  v_vertical_id UUID;
BEGIN
  INSERT INTO public.verticals (
    organization_id, slug, industry_name, target_naics_codes,
    equipment_keywords, negative_keywords, search_queries, base_scoring_weights
  )
  VALUES (
    p_org_id, p_slug, p_industry_name, p_target_naics_codes,
    p_equipment_keywords, p_negative_keywords, p_search_queries, p_base_scoring_weights
  )
  ON CONFLICT (organization_id, slug) DO UPDATE SET
    industry_name = EXCLUDED.industry_name,
    target_naics_codes = EXCLUDED.target_naics_codes,
    equipment_keywords = EXCLUDED.equipment_keywords,
    negative_keywords = EXCLUDED.negative_keywords,
    search_queries = EXCLUDED.search_queries,
    base_scoring_weights = EXCLUDED.base_scoring_weights,
    created_at = timezone('utc'::text, now())
  RETURNING id INTO v_vertical_id;

  RETURN v_vertical_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STREAMING_CHUNK: Engineering multi-tenant system performance aggregations...
CREATE OR REPLACE FUNCTION public.get_system_observability_dashboard()
RETURNS TABLE (
  total_api_calls BIGINT,
  accumulated_cost NUMERIC(12,6),
  average_latency_ms NUMERIC(10,2),
  average_gemini_latency_ms NUMERIC(10,2),
  google_calls BIGINT,
  apollo_calls BIGINT,
  gemini_calls BIGINT,
  adapter_calls BIGINT,
  failure_rate_percentage NUMERIC(5,2),
  latency_by_provider JSONB
) AS $$
DECLARE
  v_org_id UUID;
  v_total BIGINT;
  v_failed BIGINT;
BEGIN
  v_org_id := public.get_auth_org_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Authentication Fault: Query context is missing an active organization mapping.';
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_success = false)
  INTO v_total, v_failed
  FROM public.provider_audits
  WHERE organization_id = v_org_id;

  RETURN QUERY
  SELECT
    v_total,
    COALESCE(SUM(estimated_cost), 0.000000),
    COALESCE(AVG(latency_ms), 0.00)::NUMERIC(10,2),
    COALESCE(AVG(latency_ms) FILTER (WHERE provider_name = 'gemini_grounding'), 0.00)::NUMERIC(10,2),
    COUNT(*) FILTER (WHERE provider_name = 'google_places')::BIGINT,
    COUNT(*) FILTER (WHERE provider_name = 'apollo')::BIGINT,
    COUNT(*) FILTER (WHERE provider_name = 'gemini_grounding')::BIGINT,
    COUNT(*) FILTER (WHERE provider_name = 'system_adapter')::BIGINT,
    CASE WHEN v_total > 0 THEN ROUND((v_failed::NUMERIC / v_total::NUMERIC) * 100, 2) ELSE 0.00 END,
    (
      SELECT jsonb_object_agg(sub.provider, sub.latency)
      FROM (
        SELECT
          provider_name AS provider,
          jsonb_build_object(
            'avg_latency', ROUND(AVG(latency_ms), 2),
            'success_rate', CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE is_success = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) ELSE 100.00 END,
            'total_cost', SUM(estimated_cost)
          ) AS latency
        FROM public.provider_audits
        WHERE organization_id = v_org_id
        GROUP BY provider_name
      ) sub
    )
  FROM public.provider_audits
  WHERE organization_id = v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service-role companion: explicit org_id
CREATE OR REPLACE FUNCTION public.get_system_observability_dashboard_by_org(
  p_org_id UUID
)
RETURNS TABLE (
  total_api_calls BIGINT,
  accumulated_cost NUMERIC(12,6),
  average_latency_ms NUMERIC(10,2),
  average_gemini_latency_ms NUMERIC(10,2),
  google_calls BIGINT,
  apollo_calls BIGINT,
  gemini_calls BIGINT,
  adapter_calls BIGINT,
  failure_rate_percentage NUMERIC(5,2),
  latency_by_provider JSONB
) AS $$
DECLARE
  v_total BIGINT;
  v_failed BIGINT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_success = false)
  INTO v_total, v_failed
  FROM public.provider_audits
  WHERE organization_id = p_org_id;

  RETURN QUERY
  SELECT
    v_total,
    COALESCE(SUM(estimated_cost), 0.000000),
    COALESCE(AVG(latency_ms), 0.00)::NUMERIC(10,2),
    COALESCE(AVG(latency_ms) FILTER (WHERE provider_name = 'gemini_grounding'), 0.00)::NUMERIC(10,2),
    COUNT(*) FILTER (WHERE provider_name = 'google_places')::BIGINT,
    COUNT(*) FILTER (WHERE provider_name = 'apollo')::BIGINT,
    COUNT(*) FILTER (WHERE provider_name = 'gemini_grounding')::BIGINT,
    COUNT(*) FILTER (WHERE provider_name = 'system_adapter')::BIGINT,
    CASE WHEN v_total > 0 THEN ROUND((v_failed::NUMERIC / v_total::NUMERIC) * 100, 2) ELSE 0.00 END,
    (
      SELECT jsonb_object_agg(sub.provider, sub.latency)
      FROM (
        SELECT provider_name AS provider,
          jsonb_build_object(
            'avg_latency', ROUND(AVG(latency_ms), 2),
            'success_rate', CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE is_success = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) ELSE 100.00 END,
            'total_cost', SUM(estimated_cost)
          ) AS latency
        FROM public.provider_audits
        WHERE organization_id = p_org_id
        GROUP BY provider_name
      ) sub
    )
  FROM public.provider_audits
  WHERE organization_id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STREAMING_CHUNK: Applying RLS policies to observability datasets...
ALTER TABLE public.provider_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant observability telemetry data lock"
  ON public.provider_audits FOR SELECT USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Tenant observability execution log injection"
  ON public.provider_audits FOR INSERT WITH CHECK (organization_id = public.get_auth_org_id());
