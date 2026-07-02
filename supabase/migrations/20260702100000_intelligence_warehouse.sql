-- ──────────────────────────────────────────────────────────────────────────────
-- HHR Intelligence Warehouse — L2 PostGIS + L1 Redis + L3 Scrape
-- ──────────────────────────────────────────────────────────────────────────────

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists postgis;

-- ── deep_profiles: per-company structured intelligence ────────────────────────
create table if not exists public.deep_profiles (
  id uuid primary key default gen_random_uuid(),
  canonical_key text unique not null,
  company_name text not null,
  domain text,
  geohash text,
  vertical text not null,
  address text,
  city text,
  state text,
  zip text,
  latitude double precision,
  longitude double precision,
  location geography(Point, 4326)
    generated always as (
      case
        when latitude is not null and longitude is not null
        then ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        else null
      end
    ) stored,
  fit_type text
    default null
    check (fit_type in ('DIRECT_OPERATOR', 'INDIRECT_VENDOR', 'DISPOSAL_NODE', 'REGULATORY_NODE')),

  -- Structured intelligence
  scraped_content text,
  structured_signals jsonb default '{}'::jsonb,
  permits jsonb default '[]'::jsonb,
  equipment jsonb default '[]'::jsonb,
  services jsonb default '[]'::jsonb,
  naics_codes text[] default '{}',

  -- Scoring & staleness
  confidence_score integer default 0,
  signal_hits text[] default '{}',
  negative_hits text[] default '{}',
  is_commercial boolean default false,
  is_residential boolean default false,
  is_mismatch boolean default false,

  -- TTL tracking
  services_ttl timestamptz,
  equipment_ttl timestamptz,
  permits_ttl timestamptz,
  pricing_ttl timestamptz,
  content_ttl timestamptz,

  last_scraped_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_deep_profiles_canonical on public.deep_profiles (canonical_key);
create index if not exists idx_deep_profiles_vertical on public.deep_profiles (vertical);
create index if not exists idx_deep_profiles_expires on public.deep_profiles (expires_at) where expires_at is not null;
create index if not exists idx_deep_profiles_domain on public.deep_profiles (domain) where domain is not null;
create index if not exists idx_deep_profiles_zip on public.deep_profiles (zip) where zip is not null;
create index if not exists idx_deep_profiles_fit_type on public.deep_profiles (fit_type) where fit_type is not null;
create index if not exists idx_deep_profiles_geo
  on public.deep_profiles using gist (location)
  where location is not null and vertical is not null;

-- RLS
alter table public.deep_profiles enable row level security;
create policy "Service role full access"
  on public.deep_profiles
  to service_role
  using (true)
  with check (true);

-- ── search_cache_meta ─────────────────────────────────────────────────────────
create table if not exists public.search_cache_meta (
  cache_key text primary key,
  result_count integer default 0,
  avg_confidence integer default 0,
  cached_at timestamptz default now(),
  expires_at timestamptz
);
create index if not exists idx_search_cache_expires on public.search_cache_meta (expires_at) where expires_at is not null;
alter table public.search_cache_meta enable row level security;
create policy "Service role full access on search_cache"
  on public.search_cache_meta
  to service_role
  using (true)
  with check (true);

-- ── scrape_jobs ───────────────────────────────────────────────────────────────
create type if not exists job_priority as enum ('high', 'medium', 'low');
create table if not exists public.scrape_jobs (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null,
  company_name text,
  domain text,
  vertical text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'complete', 'failed')),
  priority job_priority not null default 'medium',
  trigger_reason text,
  attempt_count integer default 0,
  max_attempts integer default 3,
  error text,
  scheduled_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_scrape_jobs_pending on public.scrape_jobs (priority, scheduled_at)
  where status = 'pending';
alter table public.scrape_jobs enable row level security;
create policy "Service role full access on scrape_jobs"
  on public.scrape_jobs
  to service_role
  using (true)
  with check (true);

-- ── RPC: get_geo_candidates ───────────────────────────────────────────────────
-- Multi-ring PostGIS lookup + intelligence scoring.
-- Expands radius through search_rings (25, 50, 100...) until min_results_threshold
-- is met. Returns scored candidates ordered by intelligence_score descending.
-- Returns surface coordinates (lat/lng) extracted from the geography column.
--
-- Scoring formula:
--   geo            = max(0, 30 - distance_miles)
--   freshness      = 20 if scraped < 7d, 10 if < 30d, else 0
--   fit            = DIRECT_OPERATOR=25, DISPOSAL_NODE=20, REGULATORY_NODE=15, INDIRECT_VENDOR=10
--   intelligence  = geo + confidence_score + freshness + fit
create or replace function public.get_geo_candidates(
  target_lng double precision,
  target_lat double precision,
  target_vertical text,
  search_rings int[] default '{25,50,100}',
  min_results_threshold int default 5
)
returns table (
  id uuid,
  company_name text,
  vertical text,
  confidence_score int,
  fit_type text,
  distance_miles double precision,
  intelligence_score int,
  evaluated_ring int,
  latitude double precision,
  longitude double precision
)
language plpgsql stable
as $$
declare
  current_ring int;
  found_count int := 0;
  search_point geography := ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography;
begin
  foreach current_ring in array search_rings loop
    return query
    with candidate_pool as (
      select
        dp.id,
        dp.company_name,
        dp.vertical,
        dp.confidence_score,
        dp.fit_type,
        ST_Distance(dp.location, search_point) / 1609.344 as dist_miles,
        ST_Y(dp.location::geometry) as lat,
        ST_X(dp.location::geometry) as lng,
        case
          when dp.last_scraped_at >= now() - interval '7 days' then 20
          when dp.last_scraped_at >= now() - interval '30 days' then 10
          else 0
        end as freshness_weight,
        case dp.fit_type
          when 'DIRECT_OPERATOR'  then 25
          when 'DISPOSAL_NODE'    then 20
          when 'REGULATORY_NODE'  then 15
          when 'INDIRECT_VENDOR'  then 10
          else 0
        end as fit_weight
      from public.deep_profiles dp
      where dp.vertical = target_vertical
        and dp.location is not null
        and ST_DWithin(dp.location, search_point, current_ring * 1609.344)
        and (dp.expires_at is null or dp.expires_at > now())
    )
    select
      cp.id,
      cp.company_name,
      cp.vertical,
      cp.confidence_score,
      cp.fit_type,
      cp.dist_miles,
      greatest(0, 30 - cp.dist_miles)::int + cp.confidence_score + cp.freshness_weight + cp.fit_weight as intelligence_score,
      current_ring,
      cp.lat,
      cp.lng
    from candidate_pool cp
    order by intelligence_score desc;

    get diagnostics found_count = row_count;
    if found_count >= min_results_threshold then
      return;
    end if;
  end loop;
end;
$$;
