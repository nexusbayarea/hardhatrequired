-- =====================================================================
-- IIE v1.0 DATABASE SCHEMA MIGRATION
-- Target: Supabase / PostgreSQL Core Engine Database Layer
-- Description: Sets up multi-tenant tables, operational indexes,
--              and Row-Level Security (RLS) policies to avoid data leaks.
-- =====================================================================

-- Enable necessary Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANIZATIONS (Main Tenant Workspace & Billing Entity)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled')),
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. USERS (SaaS Seat Workspace Membership)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. VERTICALS (Multi-Tenant Niche Configuration Templates)
CREATE TABLE public.verticals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- Null means Global Default template
  slug TEXT NOT NULL,
  industry_name TEXT NOT NULL,
  target_naics_codes TEXT[] NOT NULL DEFAULT '{}',
  equipment_keywords TEXT[] NOT NULL DEFAULT '{}',
  negative_keywords TEXT[] NOT NULL DEFAULT '{}',
  search_queries TEXT[] NOT NULL DEFAULT '{}',
  base_scoring_weights JSONB NOT NULL DEFAULT '{"distanceWeight": 30,"contactEnrichmentWeight": 40,"assetSignalWeight": 30}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_tenant_slug UNIQUE (organization_id, slug)
);

-- 4. SAVED SEARCHES (Execution History & Parametrization Logs)
CREATE TABLE public.searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vertical_id UUID NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  radius_miles INTEGER NOT NULL CHECK (radius_miles > 0),
  result_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PROSPECT COMPANIES (Discovered Target B2B Pipelines)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vertical_id UUID NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
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
  enrichment_score INTEGER DEFAULT 30 CHECK (enrichment_score >= 0 AND enrichment_score <= 100),
  priority_group TEXT NOT NULL DEFAULT 'C' CHECK (priority_group IN ('A', 'B', 'C')),
  status TEXT NOT NULL DEFAULT 'NOT_CONTACTED' CHECK (status IN ('NOT_CONTACTED', 'CALLED', 'EMAILED', 'INTERESTED', 'FOLLOW_UP', 'QUALIFIED', 'WON', 'LOST')),
  capability_summary TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. CONTACTS (Decision Makers associated with Companies)
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. CAMPAIGNS (Structured Outreach Pipelines)
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vertical_id UUID NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. OUTREACH LOGS (CRM Activity Records & History Tracking)
CREATE TABLE public.outreach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('CALL', 'EMAIL', 'LINKEDIN', 'NOTE')),
  outcome TEXT CHECK (outcome IN ('no_answer', 'left_voicemail', 'busy', 'connected_interested', 'connected_not_interested', 'sent_proposal', 'out_of_service')),
  notes TEXT,
  performed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. REPORTS (Context-generated CSV downloads & analytics records)
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters_used JSONB NOT NULL DEFAULT '{}'::jsonb,
  download_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =====================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================================
CREATE INDEX idx_users_org ON public.users(organization_id);
CREATE INDEX idx_verticals_org ON public.verticals(organization_id);
CREATE INDEX idx_searches_org_vertical ON public.searches(organization_id, vertical_id);
CREATE INDEX idx_companies_org_vertical ON public.companies(organization_id, vertical_id);
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_contacts_company ON public.contacts(company_id);
CREATE INDEX idx_outreach_company ON public.outreach_logs(company_id);
CREATE INDEX idx_outreach_org ON public.outreach_logs(organization_id);

-- =====================================================================
-- ROW-LEVEL SECURITY (RLS) & AUTH ISOLATION
-- =====================================================================

-- Secure helper function to lookup the current session member's organization safely
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable RLS across every multi-tenant table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Organization Read Policies
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT USING (id = public.get_auth_org_id());

-- Users Table Policies
CREATE POLICY "Users can query members of the same organization"
  ON public.users FOR SELECT USING (organization_id = public.get_auth_org_id());

-- Verticals Table Policies (Users can see their org verticals AND global template configuration defaults)
CREATE POLICY "Users can access template verticals and tenant verticals"
  ON public.verticals FOR SELECT USING (organization_id = public.get_auth_org_id() OR organization_id IS NULL);
CREATE POLICY "Users can manage their tenant verticals"
  ON public.verticals FOR ALL USING (organization_id = public.get_auth_org_id());

-- Saved Searches Policies
CREATE POLICY "Tenant saved search tracking boundary"
  ON public.searches FOR ALL USING (organization_id = public.get_auth_org_id());

-- Companies CRM Policies
CREATE POLICY "Tenant company CRM workspace boundary"
  ON public.companies FOR ALL USING (organization_id = public.get_auth_org_id());

-- Contacts Policies (Through company parent validation)
CREATE POLICY "Tenant contacts access policy"
  ON public.contacts FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE public.companies.id = public.contacts.company_id
        AND public.companies.organization_id = public.get_auth_org_id()
    )
  );

-- Campaigns Policies
CREATE POLICY "Tenant campaign tracking policy"
  ON public.campaigns FOR ALL USING (organization_id = public.get_auth_org_id());

-- Outreach Logs Policies
CREATE POLICY "Tenant CRM interaction history boundary"
  ON public.outreach_logs FOR ALL USING (organization_id = public.get_auth_org_id());

-- Generated Export Reports Policies
CREATE POLICY "Tenant generated export boundary"
  ON public.reports FOR ALL USING (organization_id = public.get_auth_org_id());
