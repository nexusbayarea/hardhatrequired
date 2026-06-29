-- =====================================================================
-- IIE v1.0 DATABASE OUTREACH CAMPAIGN & OUTCOME AUTOMATION (Part 4)
-- Target: Supabase / PostgreSQL Core Database Layer
-- Description: Sets up advisory lock queue routing, automated progression
--              triggers, and campaign performance aggregation RPCs.
-- =====================================================================

-- STREAMING_CHUNK: Initializing outreach session lock table...
CREATE TABLE IF NOT EXISTS public.queue_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  locked_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '15 minutes'),
  CONSTRAINT unique_active_lock UNIQUE (company_id)
);

CREATE INDEX IF NOT EXISTS idx_queue_lockouts_expiry ON public.queue_lockouts(expires_at);

-- STREAMING_CHUNK: Defining safe outreach queue selector RPC (auth-bound)...
CREATE OR REPLACE FUNCTION public.acquire_outreach_targets(
  p_campaign_id UUID,
  p_agent_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  state TEXT,
  priority_group TEXT,
  enrichment_score INT,
  current_status TEXT,
  capability_summary TEXT
) AS $$
DECLARE
  v_org_id UUID;
  v_vertical_id UUID;
BEGIN
  v_org_id := public.get_auth_org_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Authentication Fault: Query context is missing an active organization mapping.';
  END IF;

  SELECT vertical_id INTO v_vertical_id
  FROM public.campaigns
  WHERE id = p_campaign_id AND organization_id = v_org_id;

  IF v_vertical_id IS NULL THEN
    RAISE EXCEPTION 'Security Fault: Requested Campaign does not exist or target workspace boundaries do not match.';
  END IF;

  DELETE FROM public.queue_lockouts WHERE expires_at < timezone('utc'::text, now());

  RETURN QUERY
  WITH selected_leads AS (
    SELECT c.id AS lead_id
    FROM public.companies c
    WHERE c.organization_id = v_org_id
      AND c.vertical_id = v_vertical_id
      AND c.status IN ('NOT_CONTACTED', 'FOLLOW_UP')
      AND NOT EXISTS (
        SELECT 1 FROM public.queue_lockouts l
        WHERE l.company_id = c.id
      )
    ORDER BY
      c.priority_group ASC,
      c.enrichment_score DESC,
      c.created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  INSERT INTO public.queue_lockouts (organization_id, company_id, campaign_id, locked_by)
  SELECT v_org_id, lead_id, p_campaign_id, p_agent_id
  FROM selected_leads
  ON CONFLICT (company_id) DO NOTHING
  RETURNING company_id;

  RETURN QUERY
  SELECT
    c.id AS company_id,
    c.company_name,
    c.website,
    c.phone,
    c.email,
    c.city,
    c.state,
    c.priority_group,
    c.enrichment_score,
    c.status AS current_status,
    c.capability_summary
  FROM public.companies c
  JOIN public.queue_lockouts l ON l.company_id = c.id
  WHERE l.locked_by = p_agent_id AND l.campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service-role companion: explicit org_id
CREATE OR REPLACE FUNCTION public.acquire_outreach_targets_by_org(
  p_org_id UUID,
  p_campaign_id UUID,
  p_agent_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  state TEXT,
  priority_group TEXT,
  enrichment_score INT,
  current_status TEXT,
  capability_summary TEXT
) AS $$
DECLARE
  v_vertical_id UUID;
BEGIN
  SELECT vertical_id INTO v_vertical_id
  FROM public.campaigns
  WHERE id = p_campaign_id AND organization_id = p_org_id;

  IF v_vertical_id IS NULL THEN
    RAISE EXCEPTION 'Security Fault: Requested campaign does not exist or org boundaries do not match.';
  END IF;

  DELETE FROM public.queue_lockouts WHERE expires_at < timezone('utc'::text, now());

  RETURN QUERY
  WITH selected_leads AS (
    SELECT c.id AS lead_id
    FROM public.companies c
    WHERE c.organization_id = p_org_id
      AND c.vertical_id = v_vertical_id
      AND c.status IN ('NOT_CONTACTED', 'FOLLOW_UP')
      AND NOT EXISTS (
        SELECT 1 FROM public.queue_lockouts l WHERE l.company_id = c.id
      )
    ORDER BY c.priority_group ASC, c.enrichment_score DESC, c.created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  INSERT INTO public.queue_lockouts (organization_id, company_id, campaign_id, locked_by)
  SELECT p_org_id, lead_id, p_campaign_id, p_agent_id
  FROM selected_leads
  ON CONFLICT (company_id) DO NOTHING
  RETURNING company_id;

  RETURN QUERY
  SELECT
    c.id, c.company_name, c.website, c.phone, c.email,
    c.city, c.state, c.priority_group, c.enrichment_score,
    c.status, c.capability_summary
  FROM public.companies c
  JOIN public.queue_lockouts l ON l.company_id = c.id
  WHERE l.locked_by = p_agent_id AND l.campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STREAMING_CHUNK: Designing automatic status progression trigger...
CREATE OR REPLACE FUNCTION public.process_outreach_outcome_progression()
RETURNS TRIGGER AS $$
DECLARE
  v_new_status TEXT;
BEGIN
  v_new_status := CASE NEW.outcome
    WHEN 'connected_interested' THEN 'INTERESTED'
    WHEN 'sent_proposal' THEN 'QUALIFIED'
    WHEN 'connected_not_interested' THEN 'LOST'
    WHEN 'left_voicemail' THEN 'FOLLOW_UP'
    WHEN 'no_answer' THEN 'FOLLOW_UP'
    WHEN 'busy' THEN 'FOLLOW_UP'
    WHEN 'out_of_service' THEN 'LOST'
    ELSE 'CALLED'
  END;

  UPDATE public.companies
  SET
    status = v_new_status,
    updated_at = timezone('utc'::text, now())
  WHERE id = NEW.company_id
    AND organization_id = NEW.organization_id;

  DELETE FROM public.queue_lockouts WHERE company_id = NEW.company_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_outreach_outcome_progression ON public.outreach_logs;
CREATE TRIGGER trigger_outreach_outcome_progression
  AFTER INSERT ON public.outreach_logs
  FOR EACH ROW EXECUTE FUNCTION public.process_outreach_outcome_progression();

-- STREAMING_CHUNK: Creating analytical campaign metrics aggregation (auth-bound)...
CREATE OR REPLACE FUNCTION public.get_campaign_analytics_aggregates(
  p_campaign_id UUID
)
RETURNS TABLE (
  total_assigned_leads BIGINT,
  total_completed_interactions BIGINT,
  calls_made BIGINT,
  emails_sent BIGINT,
  positive_connections BIGINT,
  rejections BIGINT,
  connection_ratio NUMERIC,
  conversion_to_interest_ratio NUMERIC
) AS $$
DECLARE
  v_org_id UUID;
  v_vertical_id UUID;
  v_total_assigned BIGINT;
BEGIN
  v_org_id := public.get_auth_org_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Authentication Fault: Query context is missing an active organization mapping.';
  END IF;

  SELECT vertical_id INTO v_vertical_id
  FROM public.campaigns
  WHERE id = p_campaign_id AND organization_id = v_org_id;

  SELECT COUNT(*) INTO v_total_assigned
  FROM public.companies
  WHERE organization_id = v_org_id AND vertical_id = v_vertical_id;

  RETURN QUERY
  SELECT
    v_total_assigned,
    COUNT(ol.id)::BIGINT,
    COUNT(ol.id) FILTER (WHERE ol.interaction_type = 'CALL')::BIGINT,
    COUNT(ol.id) FILTER (WHERE ol.interaction_type = 'EMAIL')::BIGINT,
    COUNT(ol.id) FILTER (WHERE ol.outcome IN ('connected_interested', 'sent_proposal'))::BIGINT,
    COUNT(ol.id) FILTER (WHERE ol.outcome = 'connected_not_interested')::BIGINT,
    CASE WHEN v_total_assigned > 0
      THEN ROUND((COUNT(ol.id)::NUMERIC / v_total_assigned::NUMERIC) * 100, 2)
      ELSE 0.00
    END,
    CASE WHEN COUNT(ol.id) > 0
      THEN ROUND((COUNT(ol.id) FILTER (WHERE ol.outcome IN ('connected_interested', 'sent_proposal'))::NUMERIC / COUNT(ol.id)::NUMERIC) * 100, 2)
      ELSE 0.00
    END
  FROM public.outreach_logs ol
  WHERE ol.organization_id = v_org_id AND ol.campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service-role companion: explicit org_id
CREATE OR REPLACE FUNCTION public.get_campaign_analytics_aggregates_by_org(
  p_org_id UUID,
  p_campaign_id UUID
)
RETURNS TABLE (
  total_assigned_leads BIGINT,
  total_completed_interactions BIGINT,
  calls_made BIGINT,
  emails_sent BIGINT,
  positive_connections BIGINT,
  rejections BIGINT,
  connection_ratio NUMERIC,
  conversion_to_interest_ratio NUMERIC
) AS $$
DECLARE
  v_vertical_id UUID;
  v_total_assigned BIGINT;
BEGIN
  SELECT vertical_id INTO v_vertical_id
  FROM public.campaigns
  WHERE id = p_campaign_id AND organization_id = p_org_id;

  SELECT COUNT(*) INTO v_total_assigned
  FROM public.companies
  WHERE organization_id = p_org_id AND vertical_id = v_vertical_id;

  RETURN QUERY
  SELECT
    v_total_assigned,
    COUNT(ol.id)::BIGINT,
    COUNT(ol.id) FILTER (WHERE ol.interaction_type = 'CALL')::BIGINT,
    COUNT(ol.id) FILTER (WHERE ol.interaction_type = 'EMAIL')::BIGINT,
    COUNT(ol.id) FILTER (WHERE ol.outcome IN ('connected_interested', 'sent_proposal'))::BIGINT,
    COUNT(ol.id) FILTER (WHERE ol.outcome = 'connected_not_interested')::BIGINT,
    CASE WHEN v_total_assigned > 0
      THEN ROUND((COUNT(ol.id)::NUMERIC / v_total_assigned::NUMERIC) * 100, 2)
      ELSE 0.00
    END,
    CASE WHEN COUNT(ol.id) > 0
      THEN ROUND((COUNT(ol.id) FILTER (WHERE ol.outcome IN ('connected_interested', 'sent_proposal'))::NUMERIC / COUNT(ol.id)::NUMERIC) * 100, 2)
      ELSE 0.00
    END
  FROM public.outreach_logs ol
  WHERE ol.organization_id = p_org_id AND ol.campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
