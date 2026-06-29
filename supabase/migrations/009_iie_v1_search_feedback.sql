create table if not exists public.search_feedback (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  company_name text,
  vertical text not null,
  accurate boolean not null,
  score integer,
  signals text,
  created_at timestamp default now()
);

alter table public.search_feedback enable row level security;

create policy "anon insert feedback"
  on public.search_feedback
  for insert
  to anon
  with check (true);

create policy "auth read feedback"
  on public.search_feedback
  for select
  to authenticated
  using (true);

create index if not exists idx_feedback_vertical
  on public.search_feedback (vertical);

create index if not exists idx_feedback_accurate
  on public.search_feedback (accurate);
