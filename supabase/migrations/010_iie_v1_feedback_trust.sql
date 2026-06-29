-- Trust-Weighted Feedback System
-- Replaces simple accurate/not-accurate with vote_type + trust factors
-- Tracks cumulative feedback profiles per company+vertical

-- Individual feedback votes with trust factors
create table public.feedback_votes (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  company_name text,
  vertical text not null,
  vote_type text not null check (vote_type in ('accurate', 'partial', 'bad')),
  user_trust real not null default 0.5,
  vertical_trust real not null default 0.5,
  consensus_weight real not null default 1.0,
  time_decay real not null default 1.0,
  weighted_impact real not null default 0,
  lead_score integer,
  signals text,
  created_at timestamptz not null default now()
);

-- Aggregated feedback profiles per company+vertical
create table public.company_feedback_profiles (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  vertical text not null,
  feedback_score real not null default 0,
  feedback_confidence real not null default 0,
  total_votes integer not null default 0,
  accurate_votes integer not null default 0,
  partial_votes integer not null default 0,
  bad_votes integer not null default 0,
  vote_history jsonb not null default '[]'::jsonb,
  last_vote_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (company_id, vertical)
);

-- Indexes
create index idx_feedback_votes_company on public.feedback_votes (company_id, vertical);
create index idx_feedback_votes_vertical on public.feedback_votes (vertical);
create index idx_feedback_votes_created on public.feedback_votes (created_at desc);
create index idx_feedback_profiles_company on public.company_feedback_profiles (company_id, vertical);
create index idx_feedback_profiles_score on public.company_feedback_profiles (feedback_score desc);

-- RLS: anon can insert votes and read profiles
alter table public.feedback_votes enable row level security;
alter table public.company_feedback_profiles enable row level security;

create policy "anon insert votes"
  on public.feedback_votes for insert
  to anon
  with check (true);

create policy "anon read votes"
  on public.feedback_votes for select
  to anon
  using (true);

create policy "anon read profiles"
  on public.company_feedback_profiles for select
  to anon
  using (true);

create policy "anon upsert profiles"
  on public.company_feedback_profiles for insert
  to anon
  with check (true);

create policy "anon update profiles"
  on public.company_feedback_profiles for update
  to anon
  using (true)
  with check (true);

-- Drop old feedback table
drop table if exists public.search_feedback;
