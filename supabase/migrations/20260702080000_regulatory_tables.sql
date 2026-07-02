-- Regulatory Intelligence tables
-- CalRecycle SWIS + future regulatory data sources

create table if not exists public.regulatory_swis_raw (
  id uuid default gen_random_uuid() primary key,
  swis_number text not null,
  site_name text,
  latitude double precision,
  longitude double precision,
  street_address text,
  city text,
  state text default 'CA',
  zip_code text,
  county text,
  site_operational_status text,
  site_regulatory_status text,
  reporting_agency text,
  raw_payload jsonb,
  imported_at timestamptz default now()
);

create index if not exists idx_swis_raw_city on public.regulatory_swis_raw(city);
create index if not exists idx_swis_raw_county on public.regulatory_swis_raw(county);
create index if not exists idx_swis_raw_swis on public.regulatory_swis_raw(swis_number);
create index if not exists idx_swis_raw_geo on public.regulatory_swis_raw using gist (ll_to_earth(latitude, longitude));

create table if not exists public.regulatory_swis_waste_types (
  id uuid default gen_random_uuid() primary key,
  swis_number text not null references public.regulatory_swis_raw(swis_number) on delete cascade,
  waste_type text not null,
  activity text,
  imported_at timestamptz default now()
);

create index if not exists idx_swis_waste_swis on public.regulatory_swis_waste_types(swis_number);
create index if not exists idx_swis_waste_type on public.regulatory_swis_waste_types(waste_type);

create table if not exists public.regulatory_swis_activities (
  id uuid default gen_random_uuid() primary key,
  swis_number text not null references public.regulatory_swis_raw(swis_number) on delete cascade,
  activity text not null,
  activity_category text,
  activity_classification text,
  imported_at timestamptz default now()
);

create index if not exists idx_swis_activity_swis on public.regulatory_swis_activities(swis_number);

create table if not exists public.regulatory_swis_operators (
  id uuid default gen_random_uuid() primary key,
  swis_number text not null references public.regulatory_swis_raw(swis_number) on delete cascade,
  operator_name text,
  operator_phone text,
  operator_street_address text,
  operator_city text,
  operator_state text,
  operator_zip text,
  imported_at timestamptz default now()
);

create index if not exists idx_swis_operator_swis on public.regulatory_swis_operators(swis_number);
create index if not exists idx_swis_operator_name on public.regulatory_swis_operators(operator_name);

-- Classified facility view: raw data tagged with HHR verticals
create table if not exists public.regulatory_facilities (
  id uuid default gen_random_uuid() primary key,
  swis_number text not null references public.regulatory_swis_raw(swis_number) on delete cascade,
  facility_name text,
  operator_name text,
  city text,
  county text,
  state text default 'CA',
  zip text,
  latitude double precision,
  longitude double precision,
  permit_status text,
  regulatory_status text,
  waste_types text[],
  activities text[],
  vertical text not null,
  confidence text, -- 'high' | 'medium' | 'low'
  searchable tsvector generated always as (
    to_tsvector('english', coalesce(facility_name, '') || ' ' || coalesce(city, '') || ' ' || coalesce(vertical, ''))
  ) stored,
  imported_at timestamptz default now()
);

create index if not exists idx_reg_fac_vertical on public.regulatory_facilities(vertical);
create index if not exists idx_reg_fac_city on public.regulatory_facilities(city);
create index if not exists idx_reg_fac_county on public.regulatory_facilities(county);
create index if not exists idx_reg_fac_search on public.regulatory_facilities using gin(searchable);
create index if not exists idx_reg_fac_geo on public.regulatory_facilities using gist (ll_to_earth(latitude, longitude));
