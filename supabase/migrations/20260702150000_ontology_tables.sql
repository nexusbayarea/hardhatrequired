-- ──────────────────────────────────────────────────────────────────────────────
-- HHR Ontology Registry — DB-backed ontology replacing hardcoded TS dictionaries
-- 4-layer ontology: Service / Equipment / Waste / Regulatory
-- ──────────────────────────────────────────────────────────────────────────────

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists pg_trgm;
create extension if not exists pg_net;

-- ── Entity type domain ───────────────────────────────────────────────────────
create type ontology_entity_type as enum (
  'service',
  'equipment',
  'waste',
  'regulatory',
  'material'
);

-- ── Match type domain ────────────────────────────────────────────────────────
create type match_type as enum ('exact', 'fuzzy', 'weak', 'synonym', 'stemmed');

-- ── Source provenance domain ─────────────────────────────────────────────────
create type ontology_source as enum (
  'manual_seed',
  'scraper_discovery',
  'tenant_custom',
  'ai_generated',
  'api_import'
);

-- ── 0. ontology_versions: Version tracking for cache invalidation ────────────
-- Each mutation bumps the version for that vertical.
-- Redis keys become ontology:vertical:{id}:v{version} instead of flat keys.
-- This prevents stale cache serving after partial invalidation.
create table if not exists public.ontology_versions (
  id bigserial primary key,
  vertical_id text not null,
  created_at timestamptz default now()
);

create index if not exists idx_ontology_versions_vertical
  on public.ontology_versions (vertical_id, id);

-- ── 1. ontology_entities: Master canonical definitions ───────────────────────
create table if not exists public.ontology_entities (
  id uuid primary key default gen_random_uuid(),
  canonical_id text unique not null,
  entity_type ontology_entity_type not null,
  vertical_id text,
  label text not null,
  description text,
  source ontology_source default 'manual_seed',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ontology_entities_vertical
  on public.ontology_entities (vertical_id) where vertical_id is not null;
create index if not exists idx_ontology_entities_type
  on public.ontology_entities (entity_type);
create index if not exists idx_ontology_entities_active
  on public.ontology_entities (active) where active = true;
create index if not exists idx_ontology_entities_canonical
  on public.ontology_entities (canonical_id);

-- ── 2. ontology_aliases: All alternate names ─────────────────────────────────
create table if not exists public.ontology_aliases (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.ontology_entities(id) on delete cascade,
  alias text not null,
  language_code text default 'en',
  weight int default 100,                          -- display/ranking weight
  confidence_weight int default 100,                -- scoring weight (split from display weight)
  match_type match_type default 'exact',            -- exact match vs weak/fuzzy
  source ontology_source default 'manual_seed',     -- where this alias came from
  organization_id uuid,                             -- tenant override: NULL = global
  created_at timestamptz default now()
);

create index if not exists idx_ontology_aliases_entity
  on public.ontology_aliases (entity_id);
create index if not exists idx_ontology_aliases_alias
  on public.ontology_aliases (alias);
create index if not exists idx_ontology_aliases_language
  on public.ontology_aliases (language_code);
create index if not exists idx_ontology_aliases_lookup
  on public.ontology_aliases using gin (alias gin_trgm_ops);
create index if not exists idx_ontology_aliases_org
  on public.ontology_aliases (organization_id) where organization_id is not null;

-- ── 3. ontology_relationships: Entity relationships ──────────────────────────
create table if not exists public.ontology_relationships (
  id uuid primary key default gen_random_uuid(),
  source_entity_id uuid not null references public.ontology_entities(id) on delete cascade,
  target_entity_id uuid not null references public.ontology_entities(id) on delete cascade,
  relation text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (source_entity_id, target_entity_id, relation)
);

create index if not exists idx_ontology_relationships_source
  on public.ontology_relationships (source_entity_id);
create index if not exists idx_ontology_relationships_target
  on public.ontology_relationships (target_entity_id);
create index if not exists idx_ontology_relationships_relation
  on public.ontology_relationships (relation);

-- ── RLS (service role only, same as other tables) ───────────────────────────
alter table public.ontology_entities enable row level security;
alter table public.ontology_aliases enable row level security;
alter table public.ontology_relationships enable row level security;
alter table public.ontology_versions enable row level security;

create policy "Service role full access on entities"
  on public.ontology_entities to service_role using (true) with check (true);
create policy "Service role full access on aliases"
  on public.ontology_aliases to service_role using (true) with check (true);
create policy "Service role full access on relationships"
  on public.ontology_relationships to service_role using (true) with check (true);
create policy "Service role full access on versions"
  on public.ontology_versions to service_role using (true) with check (true);

-- ── pg_net webhook trigger: cache invalidation ─────────────────────────────
-- Also bumps the ontology version on each alias mutation so Redis keys
-- become versioned (ontology:vertical:{id}:v{N}) — stale cache can never
-- be served after partial invalidation.
create or replace function public.handle_ontology_alias_mutation()
returns trigger
language plpgsql
security definer
as $$
declare
  v_entity_id uuid;
  v_vertical_id text;
  v_webhook_secret text := coalesce(
    current_setting('app.ontology_webhook_secret', true),
    'change-me-in-production'
  );
  v_endpoint text := coalesce(
    current_setting('app.ontology_webhook_endpoint', true),
    'https://hardhatrequired.vercel.app/api/ontology/cache-webhook'
  );
begin
  if tg_op = 'delete' then
    v_entity_id := old.entity_id;
  else
    v_entity_id := new.entity_id;
  end if;

  select vertical_id into v_vertical_id
  from public.ontology_entities
  where id = v_entity_id;

  if v_vertical_id is not null then
    -- Bump version first (INSERT returns new bigserial id)
    insert into public.ontology_versions (vertical_id) values (v_vertical_id);

    perform net.http_post(
      url := v_endpoint,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Webhook-Secret', v_webhook_secret
      ),
      body := jsonb_build_object(
        'vertical_id', v_vertical_id,
        'operation', tg_op
      )
    );
  end if;

  return null;
end;
$$;

drop trigger if exists trigger_ontology_alias_mutation on public.ontology_aliases;
create trigger trigger_ontology_alias_mutation
  after insert or update or delete
  on public.ontology_aliases
  for each row
  execute function public.handle_ontology_alias_mutation();

-- ── Entity-level updated_at trigger ─────────────────────────────────────────
create or replace function public.update_ontology_entity_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_ontology_entity_updated on public.ontology_entities;
create trigger trigger_ontology_entity_updated
  before update on public.ontology_entities
  for each row
  execute function public.update_ontology_entity_timestamp();

-- ── Helper: bump and get latest version for a vertical ───────────────────────
create or replace function public.bump_ontology_version(p_vertical_id text)
returns bigint
language plpgsql
as $$
declare
  v_new_id bigint;
begin
  insert into public.ontology_versions (vertical_id) values (p_vertical_id)
  returning id into v_new_id;
  return v_new_id;
end;
$$;

create or replace function public.get_ontology_version(p_vertical_id text)
returns bigint
language sql
stable
as $$
  select max(id) from public.ontology_versions where vertical_id = p_vertical_id;
$$;

-- ── Helper: get all aliases for active entities ─────────────────────────────
create or replace function public.get_active_ontology()
returns table (
  canonical_id text,
  entity_type text,
  vertical_id text,
  label text,
  alias text,
  language_code text,
  weight int,
  confidence_weight int,
  match_type text,
  source text,
  organization_id uuid
)
language sql
stable
as $$
  select
    e.canonical_id,
    e.entity_type::text,
    e.vertical_id,
    e.label,
    a.alias,
    a.language_code,
    a.weight,
    a.confidence_weight,
    a.match_type::text,
    a.source::text,
    a.organization_id
  from public.ontology_entities e
  join public.ontology_aliases a on a.entity_id = e.id
  where e.active = true
  order by e.vertical_id, e.canonical_id;
$$;

-- ── Helper: get aliases for a specific vertical ─────────────────────────────
-- Supports tenant overrides: returns global aliases (org=NULL) merged with
-- tenant-specific aliases for the given organization_id.
create or replace function public.get_vertical_ontology(
  p_vertical_id text,
  p_organization_id uuid default null
)
returns table (
  canonical_id text,
  entity_type text,
  alias text,
  language_code text,
  weight int,
  confidence_weight int,
  match_type text,
  source text,
  organization_id uuid
)
language sql
stable
as $$
  select
    e.canonical_id,
    e.entity_type::text,
    a.alias,
    a.language_code,
    a.weight,
    a.confidence_weight,
    a.match_type::text,
    a.source::text,
    a.organization_id
  from public.ontology_entities e
  join public.ontology_aliases a on a.entity_id = e.id
  where e.active = true
    and e.vertical_id = p_vertical_id
    and (
      a.organization_id is null
      or a.organization_id = p_organization_id
    )
  order by e.canonical_id, a.organization_id nulls first;
$$;

-- ── Helper: get relationships for truth checking ────────────────────────────
create or replace function public.get_ontology_relationships()
returns table (
  source_canonical_id text,
  target_canonical_id text,
  relation text,
  metadata jsonb
)
language sql
stable
as $$
  select
    src.canonical_id,
    tgt.canonical_id,
    r.relation,
    r.metadata
  from public.ontology_relationships r
  join public.ontology_entities src on src.id = r.source_entity_id
  join public.ontology_entities tgt on tgt.id = r.target_entity_id
  where src.active = true and tgt.active = true;
$$;
