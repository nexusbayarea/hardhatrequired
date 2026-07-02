-- ============================================================
-- Migration 009 — HHR v1: New Indexes + Feedback + Knowledge Graph
-- Renames IIE → HHR and adds all new tables from the HHR architecture
-- ============================================================

-- ─── 1. Rename: IIE → HHR ────────────────────────────────────────────────────
-- All existing tables keep their data. We only update naming where it
-- appears in non-breaking metadata (config, etc). The underlying table
-- names do NOT change to avoid breaking existing queries.

COMMENT ON TABLE public.companies IS 'HHR: Company leads discovered across all search indexes';
COMMENT ON TABLE public.search_history IS 'HHR: Saved searches across all 6 search indexes';
COMMENT ON TABLE public.campaigns IS 'HHR: Outreach campaigns for leads';

-- ─── 2. Feedback Signals ──────────────────────────────────────────────────────
-- Stores user feedback on search results (accurate/incorrect/trusted/bad_data)
-- Used by FeedbackLearningEngine to improve scoring over time.

CREATE TABLE IF NOT EXISTS public.feedback_signals (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID        NOT NULL,
  user_id           UUID        NOT NULL,
  company_id        TEXT        NOT NULL,   -- may be an external ID, not FK
  vertical_id       TEXT        NOT NULL,
  feedback_type     TEXT        NOT NULL CHECK (feedback_type IN ('accurate','incorrect','trusted_vendor','bad_data')),
  note              TEXT,
  result_index      TEXT,                   -- which HHR index: labor, disposal, etc.
  search_id         UUID,                   -- FK to search_history (nullable)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_org_vertical
  ON public.feedback_signals (organization_id, vertical_id);

CREATE INDEX IF NOT EXISTS idx_feedback_company
  ON public.feedback_signals (company_id);

ALTER TABLE public.feedback_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read own feedback"
  ON public.feedback_signals FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert feedback"
  ON public.feedback_signals FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid()
    )
  );

-- ─── 3. Company Trust Scores ─────────────────────────────────────────────────
-- Aggregated trust score per company, updated by FeedbackLearningEngine.
-- Cross-org: visible to all authenticated users (trust is platform-wide).

CREATE TABLE IF NOT EXISTS public.company_trust_scores (
  company_id          TEXT        PRIMARY KEY,
  score               INTEGER     NOT NULL DEFAULT 50 CHECK (score BETWEEN 0 AND 100),
  positive_signals    INTEGER     NOT NULL DEFAULT 0,
  negative_signals    INTEGER     NOT NULL DEFAULT 0,
  trusted_by_orgs     INTEGER     NOT NULL DEFAULT 0,
  bad_data_reports    INTEGER     NOT NULL DEFAULT 0,
  last_updated        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_score
  ON public.company_trust_scores (score DESC);

ALTER TABLE public.company_trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read trust scores"
  ON public.company_trust_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can upsert trust scores"
  ON public.company_trust_scores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 4. Bid Results ──────────────────────────────────────────────────────────
-- Persists discovered bids from BidIntelligenceIndex for caching + history.

CREATE TABLE IF NOT EXISTS public.bid_results (
  id                  TEXT        PRIMARY KEY,  -- e.g. 'samgov-<noticeId>'
  organization_id     UUID        NOT NULL,
  vertical_id         TEXT        NOT NULL,
  index_type          TEXT        NOT NULL DEFAULT 'bid_intelligence',
  title               TEXT        NOT NULL,
  agency              TEXT,
  bid_source          TEXT        NOT NULL CHECK (bid_source IN ('city','county','state_dot','utility','private','federal')),
  status              TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','closing_soon','closed','awarded','cancelled')),
  bid_number          TEXT,
  description         TEXT,
  state               TEXT,
  county              TEXT,
  city                TEXT,
  estimated_value     NUMERIC,
  published_at        TIMESTAMPTZ,
  due_at              TIMESTAMPTZ,
  awarded_at          TIMESTAMPTZ,
  awarded_to          TEXT,
  awarded_amount      NUMERIC,
  document_url        TEXT,
  contact_name        TEXT,
  contact_email       TEXT,
  contact_phone       TEXT,
  naics_codes         TEXT[],
  score               INTEGER     NOT NULL DEFAULT 0,
  grade               TEXT        NOT NULL DEFAULT 'D' CHECK (grade IN ('A','B','C','D')),
  matched_signals     TEXT[]      DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bids_vertical_status
  ON public.bid_results (vertical_id, status, due_at DESC);

CREATE INDEX IF NOT EXISTS idx_bids_org
  ON public.bid_results (organization_id);

CREATE INDEX IF NOT EXISTS idx_bids_grade
  ON public.bid_results (grade, score DESC);

ALTER TABLE public.bid_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read bid results"
  ON public.bid_results FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to bid results"
  ON public.bid_results FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 5. Knowledge Graph Edge Weights (persistent) ────────────────────────────
-- The in-memory KG starts at weight 1.0 for all edges. Feedback adjustments
-- are applied in-memory per request. This table persists the weight deltas
-- so that the next cold start loads trained weights.

CREATE TABLE IF NOT EXISTS public.kg_edge_weights (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id    TEXT    NOT NULL,
  to_node_id      TEXT    NOT NULL,
  relation        TEXT    NOT NULL,
  weight          NUMERIC NOT NULL DEFAULT 1.0 CHECK (weight BETWEEN 0 AND 1),
  signal_count    INTEGER NOT NULL DEFAULT 0,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_node_id, to_node_id, relation)
);

CREATE INDEX IF NOT EXISTS idx_kg_from_node
  ON public.kg_edge_weights (from_node_id, relation);

-- No RLS needed — this is a platform-level configuration table
-- accessible only via service role.

-- ─── 6. Labor Index Results ───────────────────────────────────────────────────
-- Stores discovered labor results from TomTom + state license databases.

CREATE TABLE IF NOT EXISTS public.labor_results (
  id                    TEXT        PRIMARY KEY,
  organization_id       UUID        NOT NULL,
  vertical_id           TEXT        NOT NULL,
  name                  TEXT        NOT NULL,
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  zip                   TEXT,
  phone                 TEXT,
  website               TEXT,
  email                 TEXT,
  latitude              NUMERIC,
  longitude             NUMERIC,
  distance_miles        NUMERIC,
  category              TEXT,   -- certified_contractor | operator | specialty_crew | inspector | engineer
  license_number        TEXT,
  license_state         TEXT,
  license_expiry        TEXT,
  certifications        TEXT[],
  crew_size             INTEGER,
  union_affiliated      BOOLEAN,
  specialties           TEXT[],
  score                 INTEGER     NOT NULL DEFAULT 0,
  grade                 TEXT        NOT NULL DEFAULT 'D',
  matched_signals       TEXT[]      DEFAULT '{}',
  source                TEXT        NOT NULL DEFAULT 'tomtom',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labor_org_vertical
  ON public.labor_results (organization_id, vertical_id, grade);

ALTER TABLE public.labor_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read labor results"
  ON public.labor_results FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to labor results"
  ON public.labor_results FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 7. Disposal Index Results ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.disposal_results (
  id                      TEXT        PRIMARY KEY,
  organization_id         UUID        NOT NULL,
  vertical_id             TEXT        NOT NULL,
  name                    TEXT        NOT NULL,
  address                 TEXT,
  city                    TEXT,
  state                   TEXT,
  zip                     TEXT,
  phone                   TEXT,
  website                 TEXT,
  latitude                NUMERIC,
  longitude               NUMERIC,
  distance_miles          NUMERIC,
  category                TEXT,   -- landfill | recycler | treatment_facility | waste_processor | epa_disposal_site
  accepted_waste_types    TEXT[],
  epa_id                  TEXT,
  permit_number           TEXT,
  tipping_fee_per_ton     NUMERIC,
  hours_of_operation      TEXT,
  requires_manifest       BOOLEAN,
  hazmat_certified        BOOLEAN,
  score                   INTEGER     NOT NULL DEFAULT 0,
  grade                   TEXT        NOT NULL DEFAULT 'D',
  matched_signals         TEXT[]      DEFAULT '{}',
  source                  TEXT        NOT NULL DEFAULT 'overpass',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disposal_org_vertical
  ON public.disposal_results (organization_id, vertical_id, grade);

ALTER TABLE public.disposal_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read disposal results"
  ON public.disposal_results FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to disposal results"
  ON public.disposal_results FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 8. Add google_category_signals + apollo_description to companies ─────────
-- From previous session's scoring improvements.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS google_category_signals  TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS apollo_description       TEXT;

-- ─── 9. Add trust_score to companies ────────────────────────────────────────

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50;

-- ─── 10. Materialized view: HHR index summary ────────────────────────────────
-- Quick counts across all indexes per org — powers the dashboard KPI bar.

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_hhr_index_summary AS
SELECT
  c.organization_id,
  COUNT(DISTINCT c.id)                                    AS total_companies,
  COUNT(DISTINCT CASE WHEN c.priority = 'A' THEN c.id END) AS priority_a,
  COUNT(DISTINCT CASE WHEN c.priority = 'B' THEN c.id END) AS priority_b,
  COUNT(DISTINCT lr.id)                                   AS total_labor,
  COUNT(DISTINCT dr.id)                                   AS total_disposal,
  COUNT(DISTINCT br.id)                                   AS total_bids,
  COUNT(DISTINCT fs.id)                                   AS total_feedback
FROM public.companies c
LEFT JOIN public.labor_results    lr ON lr.organization_id = c.organization_id
LEFT JOIN public.disposal_results dr ON dr.organization_id = c.organization_id
LEFT JOIN public.bid_results      br ON br.organization_id = c.organization_id
LEFT JOIN public.feedback_signals fs ON fs.organization_id = c.organization_id
GROUP BY c.organization_id
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_hhr_index_summary_org
  ON public.mv_hhr_index_summary (organization_id);

-- Refresh function (call via pg_cron nightly)
CREATE OR REPLACE FUNCTION public.refresh_hhr_index_summary()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hhr_index_summary;
$$;
