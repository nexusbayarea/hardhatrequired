-- =====================================================================
-- IIE v1.0 DATABASE AUTOMATION & ANALYTICS MIGRATION
-- Target: Supabase / PostgreSQL Core Database Layer (Part 2)
-- Description: Sets up auth hooks, automated subscription quotas,
--              and analytical aggregation RPC functions.
-- =====================================================================

-- 1. AUTOMATED MODIFICATION TIMESTAMP PROCEDURES
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind Timestamp Triggers
CREATE OR REPLACE TRIGGER update_organizations_modtime
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER update_companies_modtime
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. AUTOMATED TENANT PROFILE PROVISIONING (Supabase Auth Hook)
-- Automatically provisions a matching public tenant organization and sets user role as 'owner'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
BEGIN
  -- Extract desired workspace name or fall back gracefully
  org_name := COALESCE(
    NEW.raw_user_meta_data->>'workspace_name',
    SPLIT_PART(NEW.email, '@', 1) || ' Workspace'
  );

  -- 1. Create a tenant workspace boundaries
  INSERT INTO public.organizations (name, subscription_status, subscription_tier)
  VALUES (org_name, 'trialing', 'starter')
  RETURNING id INTO new_org_id;

  -- 2. Bind the newly authenticated user profile to this workspace
  INSERT INTO public.users (id, organization_id, first_name, last_name, role)
  VALUES (
    NEW.id,
    new_org_id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution immediately following standard auth signups
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. SAAS SUBSCRIPTION ENFORCEMENT QUOTAS
-- Dynamically checks lead count limit matches prior to committing batches to memory
CREATE OR REPLACE FUNCTION public.check_billing_quota()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_tier TEXT;
  v_limit INTEGER;
  v_current BIGINT;
BEGIN
  v_org_id := NEW.organization_id;

  -- Pull workspace billing parameters
  SELECT subscription_tier INTO v_tier
  FROM public.organizations
  WHERE id = v_org_id;

  v_limit := CASE
    WHEN v_tier = 'starter' THEN 500
    WHEN v_tier = 'pro' THEN 5000
    ELSE 1000000 -- Enterprise tier has infinite scale capacity
  END;

  SELECT COUNT(*) INTO v_current
  FROM public.companies
  WHERE organization_id = v_org_id;

  IF v_current >= v_limit THEN
    RAISE EXCEPTION
      'Workspace Quota Exhausted: Your current subscription tier (%) restricts allocations to % maximum leads. Please upgrade inside the dashboard.',
      v_tier, v_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind Quota Gates
CREATE OR REPLACE TRIGGER gate_lead_creation_by_quota
  BEFORE INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.check_billing_quota();

-- 4. ATOMIC BATCH LEAD IMPORT (Database-Native Transaction RPC)
-- Merges dual-vector scraped pipelines in a single database round-trip
CREATE OR REPLACE FUNCTION public.upsert_market_leads(p_companies JSONB)
RETURNS VOID AS $$
DECLARE
  v_company_record JSONB;
  v_company_id UUID;
  v_org_id UUID;
BEGIN
  v_org_id := public.get_auth_org_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Authentication Fault: Current security token is missing an active organization mapping.';
  END IF;

  FOR v_company_record IN SELECT * FROM jsonb_array_elements(p_companies) LOOP
    INSERT INTO public.companies (
      organization_id,
      vertical_id,
      company_name,
      website,
      phone,
      email,
      address,
      city,
      state,
      zip,
      latitude,
      longitude,
      distance_miles,
      enrichment_score,
      priority_group,
      status,
      capability_summary,
      source
    ) VALUES (
      v_org_id,
      (v_company_record->>'vertical_id')::UUID,
      (v_company_record->>'company_name'),
      (v_company_record->>'website'),
      (v_company_record->>'phone'),
      (v_company_record->>'email'),
      (v_company_record->>'address'),
      (v_company_record->>'city'),
      (v_company_record->>'state'),
      (v_company_record->>'zip'),
      (v_company_record->>'latitude')::NUMERIC,
      (v_company_record->>'longitude')::NUMERIC,
      (v_company_record->>'distance_miles')::NUMERIC,
      COALESCE((v_company_record->>'enrichment_score')::INTEGER, 30),
      COALESCE((v_company_record->>'priority_group'), 'C'),
      COALESCE((v_company_record->>'status'), 'NOT_CONTACTED'),
      (v_company_record->>'capability_summary'),
      (v_company_record->>'source')
    )
    ON CONFLICT (id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      website = COALESCE(EXCLUDED.website, public.companies.website),
      phone = COALESCE(EXCLUDED.phone, public.companies.phone),
      email = COALESCE(EXCLUDED.email, public.companies.email),
      enrichment_score = EXCLUDED.enrichment_score,
      priority_group = EXCLUDED.priority_group,
      capability_summary = COALESCE(EXCLUDED.capability_summary, public.companies.capability_summary),
      updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_company_id;

    -- Upsert nested contact entities if mapped within the scraper matrix
    IF v_company_record ? 'contacts' THEN
      INSERT INTO public.contacts (company_id, first_name, last_name, title, email, phone, linkedin_url, is_primary)
      SELECT
        v_company_id,
        (contact_elem->>'first_name'),
        (contact_elem->>'last_name'),
        (contact_elem->>'title'),
        (contact_elem->>'email'),
        (contact_elem->>'phone'),
        (contact_elem->>'linkedin_url'),
        COALESCE((contact_elem->>'is_primary')::BOOLEAN, false)
      FROM jsonb_array_elements(v_company_record->'contacts') AS contact_elem;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REAL-TIME TENANT CONVERSION FUNNEL METRICS (Security-Asserted RPC)
-- Pulls transactional and operational indicators safe-bound by active tenant cookies
CREATE OR REPLACE FUNCTION public.get_tenant_metrics()
RETURNS TABLE (
  total_leads BIGINT,
  priority_a_leads BIGINT,
  priority_b_leads BIGINT,
  priority_c_leads BIGINT,
  contact_enrichment_percentage NUMERIC,
  contacted_leads BIGINT,
  interested_leads BIGINT,
  won_deals BIGINT,
  pipeline_conversion_rate NUMERIC
) AS $$
DECLARE
  v_org_id UUID;
  v_total BIGINT;
  v_enriched BIGINT;
BEGIN
  v_org_id := public.get_auth_org_id();

  SELECT COUNT(*), COUNT(*) FILTER (WHERE email IS NOT NULL OR phone IS NOT NULL)
  INTO v_total, v_enriched
  FROM public.companies
  WHERE organization_id = v_org_id;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_leads,
    COUNT(*) FILTER (WHERE priority_group = 'A')::BIGINT AS priority_a_leads,
    COUNT(*) FILTER (WHERE priority_group = 'B')::BIGINT AS priority_b_leads,
    COUNT(*) FILTER (WHERE priority_group = 'C')::BIGINT AS priority_c_leads,
    CASE WHEN v_total > 0
      THEN ROUND((v_enriched::NUMERIC / v_total::NUMERIC) * 100, 2)
      ELSE 0.00
    END AS contact_enrichment_percentage,
    COUNT(*) FILTER (WHERE status IN ('CALLED', 'EMAILED', 'FOLLOW_UP', 'QUALIFIED', 'WON', 'LOST'))::BIGINT AS contacted_leads,
    COUNT(*) FILTER (WHERE status = 'INTERESTED')::BIGINT AS interested_leads,
    COUNT(*) FILTER (WHERE status = 'WON')::BIGINT AS won_deals,
    CASE
      WHEN COUNT(*) FILTER (WHERE status IN ('CALLED', 'EMAILED', 'FOLLOW_UP', 'QUALIFIED', 'WON', 'LOST')) > 0
      THEN ROUND(
        (COUNT(*) FILTER (WHERE status = 'WON')::NUMERIC /
         COUNT(*) FILTER (WHERE status IN ('CALLED', 'EMAILED', 'FOLLOW_UP', 'QUALIFIED', 'WON', 'LOST'))::NUMERIC) * 100, 2)
      ELSE 0.00
    END AS pipeline_conversion_rate
  FROM public.companies
  WHERE organization_id = v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. SERVICE-ROLE COMPANION: org_id-explicit metrics (for server-to-server calls)
-- Bypasses auth.uid() lookup — call with SERVICE_ROLE key when no user session exists
CREATE OR REPLACE FUNCTION public.get_tenant_metrics_by_org(p_org_id UUID)
RETURNS TABLE (
  total_leads BIGINT,
  priority_a_leads BIGINT,
  priority_b_leads BIGINT,
  priority_c_leads BIGINT,
  contact_enrichment_percentage NUMERIC,
  contacted_leads BIGINT,
  interested_leads BIGINT,
  won_deals BIGINT,
  pipeline_conversion_rate NUMERIC
) AS $$
DECLARE
  v_total BIGINT;
  v_enriched BIGINT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE email IS NOT NULL OR phone IS NOT NULL)
  INTO v_total, v_enriched
  FROM public.companies
  WHERE organization_id = p_org_id;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE priority_group = 'A')::BIGINT,
    COUNT(*) FILTER (WHERE priority_group = 'B')::BIGINT,
    COUNT(*) FILTER (WHERE priority_group = 'C')::BIGINT,
    CASE WHEN v_total > 0
      THEN ROUND((v_enriched::NUMERIC / v_total::NUMERIC) * 100, 2)
      ELSE 0.00
    END,
    COUNT(*) FILTER (WHERE status IN ('CALLED', 'EMAILED', 'FOLLOW_UP', 'QUALIFIED', 'WON', 'LOST'))::BIGINT,
    COUNT(*) FILTER (WHERE status = 'INTERESTED')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'WON')::BIGINT,
    CASE
      WHEN COUNT(*) FILTER (WHERE status IN ('CALLED', 'EMAILED', 'FOLLOW_UP', 'QUALIFIED', 'WON', 'LOST')) > 0
      THEN ROUND(
        (COUNT(*) FILTER (WHERE status = 'WON')::NUMERIC /
         COUNT(*) FILTER (WHERE status IN ('CALLED', 'EMAILED', 'FOLLOW_UP', 'QUALIFIED', 'WON', 'LOST'))::NUMERIC) * 100, 2)
      ELSE 0.00
    END
  FROM public.companies
  WHERE organization_id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
