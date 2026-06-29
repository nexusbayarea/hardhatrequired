-- =====================================================================
-- IIE v1.0 PRODUCTION GAPS — supplemental tables, ALTERs, RLS (Part 6)
-- Target: Supabase / PostgreSQL Core Database Layer
-- Description: Fills missing tables, updates status CHECK constraints,
--              adds billing/usage/campaign_target infrastructure.
-- =====================================================================

-- 1. ORGANIZATION_USERS (mirrors the existing `users` table; added for
--    spec compliance without breaking existing FOREIGN KEY references)
--    NOTE: The existing `public.users` table already serves this role.
CREATE TABLE IF NOT EXISTS public.organization_users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'SALES', 'VIEWER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. CAMPAIGN TARGETS (junction between campaigns and companies)
CREATE TABLE IF NOT EXISTS public.campaign_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  priority_group TEXT NOT NULL DEFAULT 'C' CHECK (priority_group IN ('A', 'B', 'C')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_campaign_company UNIQUE (campaign_id, company_id)
);

-- 3. SUBSCRIPTIONS (dedicated billing plan table)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. USAGE EVENTS (per-organisation usage tracking for billing)
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('search', 'enrichment', 'export', 'campaign')),
  units INTEGER NOT NULL DEFAULT 1 CHECK (units > 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_usage_events_org_type ON public.usage_events(organization_id, event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_created ON public.usage_events(created_at DESC);

-- 5. BILLING LIMITS (quota configuration per plan tier)
CREATE TABLE IF NOT EXISTS public.billing_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_tier TEXT NOT NULL PRIMARY KEY CHECK (plan_tier IN ('starter', 'pro', 'enterprise')),
  max_searches INTEGER NOT NULL DEFAULT 100,
  max_enrichments INTEGER NOT NULL DEFAULT 500,
  max_exports INTEGER NOT NULL DEFAULT 10,
  max_campaigns INTEGER NOT NULL DEFAULT 3,
  max_companies INTEGER NOT NULL DEFAULT 500,
  max_users INTEGER NOT NULL DEFAULT 5
);

-- Seed default billing limits
INSERT INTO public.billing_limits (plan_tier, max_searches, max_enrichments, max_exports, max_campaigns, max_companies, max_users)
VALUES
  ('starter', 100, 500, 10, 3, 500, 5),
  ('pro', 1000, 5000, 100, 20, 5000, 25),
  ('enterprise', 999999, 999999, 999999, 999999, 999999, 999999)
ON CONFLICT (plan_tier) DO NOTHING;

-- =====================================================================
-- ALTER EXISTING TABLES FOR SPEC COMPLIANCE
-- =====================================================================

-- Update campaigns.status to include DRAFT
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'));

-- Update companies.status to include NEW and PROPOSAL
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_status_check;
ALTER TABLE public.companies ADD CONSTRAINT companies_status_check
  CHECK (status IN ('NEW', 'CONTACTED', 'INTERESTED', 'PROPOSAL', 'WON', 'LOST'));

-- =====================================================================
-- RLS POLICIES FOR NEW TABLES
-- =====================================================================

ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_limits ENABLE ROW LEVEL SECURITY;

-- Organization users
CREATE POLICY "Tenant org_users select" ON public.organization_users
  FOR SELECT USING (organization_id = public.get_auth_org_id());
CREATE POLICY "Tenant org_users insert" ON public.organization_users
  FOR INSERT WITH CHECK (organization_id = public.get_auth_org_id());
CREATE POLICY "Tenant org_users update" ON public.organization_users
  FOR UPDATE USING (organization_id = public.get_auth_org_id());

-- Campaign targets (scoped to org through campaign)
CREATE POLICY "Tenant campaign_targets access" ON public.campaign_targets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.organization_id = public.get_auth_org_id())
  );

-- Subscriptions
CREATE POLICY "Tenant subscriptions select" ON public.subscriptions
  FOR SELECT USING (organization_id = public.get_auth_org_id());

-- Usage events
CREATE POLICY "Tenant usage_events select" ON public.usage_events
  FOR SELECT USING (organization_id = public.get_auth_org_id());
CREATE POLICY "Tenant usage_events insert" ON public.usage_events
  FOR INSERT WITH CHECK (organization_id = public.get_auth_org_id());

-- Billing limits (public read)
CREATE POLICY "Public billing_limits select" ON public.billing_limits
  FOR SELECT USING (true);
