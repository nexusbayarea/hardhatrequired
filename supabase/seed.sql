-- ============================================================
-- IIE Consolidated Schema — reference seed
-- Matches the Supabase project table structure
-- Run in Supabase SQL Editor after migrations 001-008
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

---------------------------------------------------
-- ORGANIZATIONS
---------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now()
);

---------------------------------------------------
-- COMPANIES
---------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  contact_name TEXT,
  priority TEXT,
  score NUMERIC DEFAULT 0,
  distance NUMERIC,
  status TEXT DEFAULT 'not_contacted',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

---------------------------------------------------
-- CONTACTS
---------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT,
  title TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

---------------------------------------------------
-- SEARCH HISTORY
---------------------------------------------------
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  vertical TEXT,
  zip TEXT,
  radius INT,
  result_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

---------------------------------------------------
-- CAMPAIGNS
---------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'queued',
  created_at TIMESTAMPTZ DEFAULT now()
);

---------------------------------------------------
-- OUTREACH
---------------------------------------------------
CREATE TABLE IF NOT EXISTS outreach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

---------------------------------------------------
-- BILLING
---------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'starter',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT,
  quantity INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

---------------------------------------------------
-- TELEMETRY
---------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT,
  latency_ms INT,
  success BOOLEAN,
  cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

---------------------------------------------------
-- RLS
---------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Temp full access for initial setup
CREATE POLICY IF NOT EXISTS "temp full access"
ON organizations FOR ALL
USING (true) WITH CHECK (true);

-- Repeat for other critical tables as needed
CREATE POLICY IF NOT EXISTS "temp full access subs"
ON subscriptions FOR ALL
USING (true) WITH CHECK (true);

---------------------------------------------------
-- SEED DATA
---------------------------------------------------
INSERT INTO organizations (name)
VALUES ('IIE Default Org')
ON CONFLICT DO NOTHING;

INSERT INTO subscriptions (organization_id, plan)
SELECT id, 'starter'
FROM organizations
WHERE name = 'IIE Default Org'
ON CONFLICT DO NOTHING;
