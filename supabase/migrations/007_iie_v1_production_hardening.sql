-- D1: Finish Production Migrations
-- D2: RLS Audit All Tables
-- D3: Index Optimization
-- D4: Backup + Recovery helpers

-- ============================================================
-- D2: RLS AUDIT — Ensure ALL tables have RLS enabled
-- ============================================================

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'organizations', 'users', 'verticals', 'searches', 
            'companies', 'contacts', 'campaigns', 'outreach_logs', 
            'reports', 'queue_lockouts', 'provider_audits',
            'organization_users', 'campaign_targets', 
            'subscriptions', 'usage_events', 'billing_limits'
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
        RAISE NOTICE 'RLS enabled on %', tbl.tablename;
    END LOOP;
END $$;

-- ============================================================
-- D2: COMPREHENSIVE RLS POLICIES (covers all new tables)
-- ============================================================

CREATE POLICY IF NOT EXISTS "Users see own org memberships"
ON public.organization_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admins manage org users"
ON public.organization_users FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_users ou
        WHERE ou.org_id = organization_users.org_id
        AND ou.user_id = auth.uid()
        AND ou.role IN ('OWNER', 'ADMIN')
    )
);

CREATE POLICY IF NOT EXISTS "Campaign targets scoped to org"
ON public.campaign_targets FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.campaigns c
        WHERE c.id = campaign_targets.campaign_id
        AND c.org_id = (
            SELECT org_id FROM public.organization_users 
            WHERE user_id = auth.uid() LIMIT 1
        )
    )
);

CREATE POLICY IF NOT EXISTS "Subscriptions org-scoped"
ON public.subscriptions FOR SELECT
TO authenticated
USING (org_id = (
    SELECT org_id FROM public.organization_users 
    WHERE user_id = auth.uid() LIMIT 1
));

CREATE POLICY IF NOT EXISTS "Usage events service role"
ON public.usage_events FOR ALL
TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Usage events org read"
ON public.usage_events FOR SELECT
TO authenticated
USING (org_id = (
    SELECT org_id FROM public.organization_users 
    WHERE user_id = auth.uid() LIMIT 1
));

CREATE POLICY IF NOT EXISTS "Billing limits org-scoped"
ON public.billing_limits FOR SELECT
TO authenticated
USING (org_id = (
    SELECT org_id FROM public.organization_users 
    WHERE user_id = auth.uid() LIMIT 1
));

-- ============================================================
-- D3: INDEX OPTIMIZATION
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_companies_org_vertical 
ON public.companies(org_id, vertical_id);

CREATE INDEX IF NOT EXISTS idx_contacts_company_priority 
ON public.contacts(company_id, priority_group);

CREATE INDEX IF NOT EXISTS idx_outreach_logs_org_date 
ON public.outreach_logs(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_org_status 
ON public.campaigns(org_id, status);

CREATE INDEX IF NOT EXISTS idx_searches_org_created 
ON public.searches(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_audits_org_provider 
ON public.provider_audits(org_id, provider_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_org_type 
ON public.usage_events(org_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_active 
ON public.campaigns(org_id, status) 
WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_companies_metadata_gin 
ON public.companies USING GIN (metadata jsonb_path_ops);

-- ============================================================
-- D3: QUERY PERFORMANCE — Materialized view for dashboard
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_tenant_kpis AS
SELECT 
    c.org_id,
    COUNT(DISTINCT c.id) AS total_companies,
    COUNT(DISTINCT ct.id) AS total_contacts,
    COUNT(DISTINCT CASE WHEN ct.priority_group = 'A' THEN ct.id END) AS priority_a_contacts,
    COUNT(DISTINCT CASE WHEN ct.priority_group = 'B' THEN ct.id END) AS priority_b_contacts,
    COUNT(DISTINCT cam.id) AS total_campaigns,
    COUNT(DISTINCT CASE WHEN cam.status = 'ACTIVE' THEN cam.id END) AS active_campaigns,
    MAX(c.created_at) AS last_discovery_at
FROM public.companies c
LEFT JOIN public.contacts ct ON ct.company_id = c.id
LEFT JOIN public.campaigns cam ON cam.org_id = c.org_id
GROUP BY c.org_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_tenant_kpis_org 
ON public.mv_tenant_kpis(org_id);

CREATE OR REPLACE FUNCTION public.refresh_tenant_kpis()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_tenant_kpis;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- D4: BACKUP + RECOVERY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.backup_markers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    marker_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    row_count BIGINT,
    checksum TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backup_markers_org 
ON public.backup_markers(org_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_org_table_counts(p_org_id UUID)
RETURNS TABLE(table_name TEXT, row_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 'companies'::TEXT, COUNT(*)::BIGINT 
    FROM public.companies WHERE org_id = p_org_id
    UNION ALL
    SELECT 'contacts'::TEXT, COUNT(*)::BIGINT 
    FROM public.contacts ct 
    JOIN public.companies c ON c.id = ct.company_id 
    WHERE c.org_id = p_org_id
    UNION ALL
    SELECT 'campaigns'::TEXT, COUNT(*)::BIGINT 
    FROM public.campaigns WHERE org_id = p_org_id
    UNION ALL
    SELECT 'outreach_logs'::TEXT, COUNT(*)::BIGINT 
    FROM public.outreach_logs WHERE org_id = p_org_id
    UNION ALL
    SELECT 'searches'::TEXT, COUNT(*)::BIGINT 
    FROM public.searches WHERE org_id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE OR REPLACE VIEW public.active_companies AS
SELECT * FROM public.companies WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_contacts AS
SELECT * FROM public.contacts WHERE deleted_at IS NULL;
