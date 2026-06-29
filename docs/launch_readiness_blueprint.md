# Index Intelligence Engine (IIE v1.0) — Production Launch Readiness Blueprint & Runbook

This comprehensive guide serves as the definitive pre-flight checklist, security audit framework, and operational runbook to transition the headless multi-tenant Index Intelligence Engine (IIE v1.0) from staging into a highly available, secure, and performant production environment.

---

## 1. Executive Summary & Architecture Overview

The IIE v1.0 platform is a headless, multi-tenant B2B discovery and outreach engine. It leverages a Next.js (App Router) API layer integrated with a Supabase (PostgreSQL) backend.

### Key architectural pillars of IIE include:

- **Secure Tenant Isolation:** Enforced at the database layer via PostgreSQL Row-Level Security (RLS) dynamically mapped to the active Supabase JWT claims.
- **Geospatial & Semantic Routing:** Low-latency coordinate searching via the PostgreSQL `earthdistance` extension paired with weighted Full-Text Search (FTS) indices.
- **Concurrent Queue Orchestration:** Agent outreach routing using stateful database advisory locks (`FOR UPDATE SKIP LOCKED`) to eliminate double-allocation risks.
- **Observability & Billing Telemetry:** Automatic pipeline audits assessing external API latency (Google, Apollo, Gemini) and estimating usage costs in real-time.

---

## 2. Pre-Flight Gap Analysis & Mitigation Strategies

Prior to running your production deployment scripts, audit your infrastructure against these critical edge cases:

### A. Telemetry & Billing Leakage

**The Risk:** External crawler or lookup timeouts (e.g., Gemini Web Grounding takes >10s or fails to resolve) could occur without committing the metrics footprint, leading to untracked token expenditures.

**Mitigation:** Implement strict `try/finally` blocks within Next.js API route handlers to guarantee that `provider_audits` insertions execute regardless of API resolution outcomes.

### B. Advisory Lock Lifespans & Connection Pools

**The Risk:** Serverless environments (Next.js Edge Functions or Vercel Serverless) spin down connections rapidly. If an agent's outreach session terminates abruptly, the lease lockouts may persist until the 15-minute expiration trigger.

**Mitigation:** Add client-side heartbeat triggers in the calling dashboard to periodically touch the lockout duration, alongside a cron task that deletes orphaned sessions.

### C. GIN & GiST Index Maintenance

**The Risk:** Rapidly growing database rows in `public.companies` can degrade Full-Text Search and Geospatial calculations if indexes become bloated.

**Mitigation:** Establish automated weekly `REINDEX` maintenance tasks via `pg_cron` to optimize the spatial coordinate bounding boxes (`idx_companies_geoloc`) and search vector indices (`idx_companies_search_vector`).

---

## 3. Production Deployment Runbook

Follow these sequential steps to initialize the database schema and deploy the Next.js environment.

### Step 3.1: Supabase Initialization & Database Setup

Execute the migrations in the Supabase SQL Editor in the following order:

| Order | Migration File | Purpose |
|-------|---------------|---------|
| 1 | `001_iie_v1_schema.sql` | Core tables, indexes, RLS policies |
| 2 | `002_iie_v1_automation.sql` | Timestamp triggers, auth hook, billing quotas |
| 3 | `003_iie_v1_gis_fts.sql` | Earthdistance, GiST/GIN indexes, FTS vectors |
| 4 | `004_iie_v1_outreach.sql` | Advisory locks, queue dispatch, outcome progression |
| 5 | `005_iie_v1_observability.sql` | Provider audits, telemetry aggregation, vertical CRUD |

### Step 3.2: Next.js Environment Variables Config

Configure your Next.js application variables within Vercel or your hosting platform:

```bash
# Supabase Connectivity
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Third-Party Pipeline Keys
GOOGLE_PLACES_API_KEY=AIzaSy...
APOLLO_API_KEY=ap-key-...
GEMINI_API_KEY=AIzaSy...

# Operational Context Configuration
NEXT_PUBLIC_APP_ENV=production
```

---

## 4. Multi-Tenant RLS Auditing & Lockdown

Run these testing procedures directly in your Supabase SQL editor to verify tenant data isolation.

### RLS Verification Queries

```sql
-- Emulate Tenant Owner A
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';

-- Should return ONLY records belonging to Tenant A's organization
SELECT id, company_name, organization_id FROM public.companies;

-- Emulate Tenant Owner B
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000002"}';

-- Validate that Tenant B cannot see or manipulate Tenant A's records
SELECT id, company_name, organization_id FROM public.companies;

-- Reset permissions
RESET ALL;
```

---

## 5. Verification & Integration Health Checks

Verify your multi-tenant pipelines are active by testing core Next.js API endpoints.

### 1. Market Discovery Integration (`/api/search`)

```bash
curl -X POST https://api.yourdomain.com/api/search \
  -H "Content-Type: application/json" \
  -H "X-IIE-Client-Context: slurry_concrete" \
  -d '{"zip": "94544", "radius": 15}'
```

### 2. Campaign Calling Sheet Gating (`/api/callsheet`)

```bash
curl -X POST https://api.yourdomain.com/api/callsheet \
  -H "Content-Type: application/json" \
  -H "X-IIE-Client-Context: grease_trap" \
  -d '{"zip": "90210", "radius": 25}'
```

### 3. File System Transaction Query Storage (`/api/saved-searches`)

```bash
curl -X POST https://api.yourdomain.com/api/saved-searches \
  -H "Content-Type: application/json" \
  -H "X-IIE-Client-Context: asbestos_abatement" \
  -d '{"name": "Bay Area Hazmat Scrapes", "zip": "94544", "radius": 30, "resultCount": 14}'
```

---

## 6. Disaster Recovery & Scale Playbooks

### Playbook A: API Quota / Rate-Limiting Failures

**Symptom:** Gemini Scraper or Apollo Enrichment queries return `429 Too Many Requests`.

**Remediation:**
1. The adapter automatically falls back to base-level registry matches with an enrichment score of 30.
2. Update the vertical parameters inside your Admin CRUD portal to raise search thresholds or scale back keywords.
3. Implement exponential backoff limits directly inside `lib/market/providers/geminiScraper.ts` as needed.

### Playbook B: Database Session Timeout Errors

**Symptom:** Database connection pools exhaustion or advisory lock latency spikes.

**Remediation:**
1. Locate stuck leases in the database:
   ```sql
   SELECT id, company_id, locked_by, expires_at
   FROM public.queue_lockouts
   WHERE expires_at > now();
   ```
2. Manually release stuck leases to refresh the dispatch workflow:
   ```sql
   DELETE FROM public.queue_lockouts
   WHERE expires_at < now() OR company_id = 'target-stuck-uuid';
   ```
