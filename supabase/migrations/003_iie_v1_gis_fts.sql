-- =====================================================================
-- IIE v1.0 DATABASE GEOSPATIAL & FULL-TEXT SEARCH MIGRATION (Part 3)
-- Target: Supabase / PostgreSQL Core Database Layer
-- Description: Sets up Earthdistance indexing, full-text search vector
--              trigger systems, and automatic CRM pipeline progression.
-- =====================================================================

-- 1. GEOSPATIAL EXTENSIONS & FUNCTIONAL INDEXES
-- Enable standard Postgres extensions for coordinates computations
CREATE EXTENSION IF NOT EXISTS cube WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS earthdistance WITH SCHEMA public;

-- Drop index if already exists to ensure clean execution
DROP INDEX IF EXISTS public.idx_companies_geoloc;

-- Create functional GiST index to support rapid geospatial coordinate scans
-- Latitude and Longitude are stored as NUMERIC, cast to double precision for compatibility
CREATE INDEX idx_companies_geoloc ON public.companies
  USING GIST (ll_to_earth(latitude::double precision, longitude::double precision));

-- 2. DYNAMIC GEOGRAPHIC RADIUS QUERYING RPC (auth-bound)
-- Calculates distance dynamically and filters records using the GIST spatial bounding box
CREATE OR REPLACE FUNCTION public.search_companies_by_radius(
  p_center_lat NUMERIC,
  p_center_lon NUMERIC,
  p_radius_miles NUMERIC,
  p_vertical_id UUID DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  distance_miles NUMERIC,
  priority_group TEXT,
  status TEXT,
  capability_summary TEXT,
  search_rank REAL
) AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Resolve secure tenant scope from active auth context
  v_org_id := public.get_auth_org_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Authentication Fault: Query context is missing an active organization mapping.';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.company_name,
    c.website,
    c.phone,
    c.email,
    c.address,
    c.city,
    c.state,
    c.zip,
    c.latitude,
    c.longitude,
    -- Compute spherical distance in miles using Earthdistance
    (earth_distance(
      ll_to_earth(p_center_lat::double precision, p_center_lon::double precision),
      ll_to_earth(c.latitude::double precision, c.longitude::double precision)
    ) / 1609.344)::NUMERIC AS distance_miles,
    c.priority_group,
    c.status,
    c.capability_summary,
    -- Rank search match relevance if query string is present
    CASE
      WHEN p_search_query IS NOT NULL AND p_search_query <> '' THEN
        ts_rank_cd(c.search_vector, websearch_to_tsquery('english', p_search_query))
      ELSE 1.0::REAL
    END AS search_rank
  FROM public.companies c
  WHERE c.organization_id = v_org_id
    AND (p_vertical_id IS NULL OR c.vertical_id = p_vertical_id)
    -- GiST spatial bounding box check to restrict execution scope before precise calculation
    AND earth_box(
      ll_to_earth(p_center_lat::double precision, p_center_lon::double precision),
      p_radius_miles::double precision * 1609.344
    ) @> ll_to_earth(c.latitude::double precision, c.longitude::double precision)
    -- True distance calculation matching the specified threshold
    AND (earth_distance(
      ll_to_earth(p_center_lat::double precision, p_center_lon::double precision),
      ll_to_earth(c.latitude::double precision, c.longitude::double precision)
    ) / 1609.344) <= p_radius_miles
    -- Apply Full-Text query vector matching if query string exists
    AND (p_search_query IS NULL OR p_search_query = '' OR c.search_vector @@ websearch_to_tsquery('english', p_search_query))
  ORDER BY
    search_rank DESC,
    distance_miles ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2b. SERVICE-ROLE COMPANION: explicit org_id parameter (for server-to-server calls)
-- Bypasses auth.uid() — call with SUPABASE_SERVICE_ROLE_KEY when no user session exists
CREATE OR REPLACE FUNCTION public.search_companies_by_radius_by_org(
  p_org_id UUID,
  p_center_lat NUMERIC,
  p_center_lon NUMERIC,
  p_radius_miles NUMERIC,
  p_vertical_id UUID DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  distance_miles NUMERIC,
  priority_group TEXT,
  status TEXT,
  capability_summary TEXT,
  search_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.company_name,
    c.website,
    c.phone,
    c.email,
    c.address,
    c.city,
    c.state,
    c.zip,
    c.latitude,
    c.longitude,
    (earth_distance(
      ll_to_earth(p_center_lat::double precision, p_center_lon::double precision),
      ll_to_earth(c.latitude::double precision, c.longitude::double precision)
    ) / 1609.344)::NUMERIC AS distance_miles,
    c.priority_group,
    c.status,
    c.capability_summary,
    CASE
      WHEN p_search_query IS NOT NULL AND p_search_query <> '' THEN
        ts_rank_cd(c.search_vector, websearch_to_tsquery('english', p_search_query))
      ELSE 1.0::REAL
    END AS search_rank
  FROM public.companies c
  WHERE c.organization_id = p_org_id
    AND (p_vertical_id IS NULL OR c.vertical_id = p_vertical_id)
    AND earth_box(
      ll_to_earth(p_center_lat::double precision, p_center_lon::double precision),
      p_radius_miles::double precision * 1609.344
    ) @> ll_to_earth(c.latitude::double precision, c.longitude::double precision)
    AND (earth_distance(
      ll_to_earth(p_center_lat::double precision, p_center_lon::double precision),
      ll_to_earth(c.latitude::double precision, c.longitude::double precision)
    ) / 1609.344) <= p_radius_miles
    AND (p_search_query IS NULL OR p_search_query = '' OR c.search_vector @@ websearch_to_tsquery('english', p_search_query))
  ORDER BY
    search_rank DESC,
    distance_miles ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. LANGUAGE-AWARE SEARCH VECTOR GENERATION
-- Alter company schema to support indexable search vectors
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Index the generated vector column for lightning fast lookups
DROP INDEX IF EXISTS public.idx_companies_search_vector;
CREATE INDEX idx_companies_search_vector ON public.companies USING GIN (search_vector);

-- Define text-parsing search vector updates procedure
CREATE OR REPLACE FUNCTION public.companies_search_vector_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    -- Weight A: High prioritization for direct Company Name
    setweight(to_tsvector('english', COALESCE(NEW.company_name, '')), 'A') ||
    -- Weight B: Medium prioritization for dynamic crawler summaries
    setweight(to_tsvector('english', COALESCE(NEW.capability_summary, '')), 'B') ||
    -- Weight C: Lower prioritization for structural metadata
    setweight(to_tsvector('english', COALESCE(NEW.city, '') || ' ' || COALESCE(NEW.state, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind vectorization pipeline triggers
DROP TRIGGER IF EXISTS trigger_update_companies_search_vector ON public.companies;
CREATE TRIGGER trigger_update_companies_search_vector
  BEFORE INSERT OR UPDATE OF company_name, capability_summary, city, state
  ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.companies_search_vector_trigger();

-- 4. AUTOMATED CRM PIPELINE TRIGGERS
-- Automatically injects a call or outreach action into outreach_logs when a lead status moves to 'QUALIFIED'
CREATE OR REPLACE FUNCTION public.handle_lead_qualification()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Perform check: trigger only when transition moves from any status to QUALIFIED
  IF NEW.status = 'QUALIFIED' AND (OLD.status IS NULL OR OLD.status <> 'QUALIFIED') THEN

    -- Pick organization owner, administrator or automated script ID
    SELECT id INTO v_owner_id
    FROM public.users
    WHERE organization_id = NEW.organization_id
    ORDER BY role = 'owner' DESC, created_at ASC
    LIMIT 1;

    -- Create task entry inside outreach logs
    INSERT INTO public.outreach_logs (
      organization_id,
      company_id,
      interaction_type,
      notes,
      performed_by
    )
    VALUES (
      NEW.organization_id,
      NEW.id,
      'CALL',
      '[Automated Task] Lead moved to QUALIFIED. Initiate high-priority calling pipeline sequence.',
      v_owner_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind pipeline progression automation
DROP TRIGGER IF EXISTS trigger_lead_qualification ON public.companies;
CREATE TRIGGER trigger_lead_qualification
  AFTER UPDATE OF status ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_lead_qualification();
