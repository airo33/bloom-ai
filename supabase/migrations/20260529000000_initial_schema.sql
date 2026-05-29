-- Initial RECOVA schema.
--
-- Tables:
--   profiles         — per-user app profile (name, age, fitness level,
--                      injury description, subscription tier, preferences)
--   plans            — the AI-generated rehab plan for a user (latest)
--   journal_entries  — daily logs (pain, mood, notes, water count)
--   exercise_completions — which exercises a user marked done on which day
--
-- All tables have RLS on, and every policy keys off auth.uid() so a user
-- can only read/write their own rows.
--
-- Timestamps default to now(); updated_at is maintained by a trigger.

------------------------------------------------------------
-- shared helpers
------------------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

------------------------------------------------------------
-- profiles
------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  age text,
  fitness_level text check (fitness_level in ('Sedentary','Moderate','Athletic') or fitness_level is null),
  injury text,
  subscription_tier text check (subscription_tier in ('weekly','monthly','annual','trial') or subscription_tier is null),
  notifications jsonb not null default '{"exercise":false,"water":false,"journal":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

------------------------------------------------------------
-- plans
------------------------------------------------------------
-- We keep only the latest plan per user (one row each) but store it as
-- jsonb so the shape can evolve without migrations. The exercises and
-- phases live inside the json.

create table public.plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan jsonb not null,
  source text not null default 'ai' check (source in ('ai','fallback')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger plans_updated_at
  before update on public.plans
  for each row execute function public.handle_updated_at();

alter table public.plans enable row level security;

create policy "Users can read own plan"
  on public.plans for select using (auth.uid() = user_id);
create policy "Users can insert own plan"
  on public.plans for insert with check (auth.uid() = user_id);
create policy "Users can update own plan"
  on public.plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own plan"
  on public.plans for delete using (auth.uid() = user_id);

------------------------------------------------------------
-- journal_entries
------------------------------------------------------------

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day integer not null,
  log_date date not null,
  pain integer not null check (pain >= 0 and pain <= 10),
  mood text not null,
  water integer not null check (water >= 0 and water <= 8),
  notes text,
  created_at timestamptz not null default now()
);

create index journal_entries_user_log_date_idx
  on public.journal_entries (user_id, log_date desc);

alter table public.journal_entries enable row level security;

create policy "Users can read own journal"
  on public.journal_entries for select using (auth.uid() = user_id);
create policy "Users can insert own journal"
  on public.journal_entries for insert with check (auth.uid() = user_id);
create policy "Users can delete own journal"
  on public.journal_entries for delete using (auth.uid() = user_id);

------------------------------------------------------------
-- exercise_completions
------------------------------------------------------------
-- Tracks which exercises were marked done on which calendar day. Composite
-- primary key prevents duplicates and lets us upsert cleanly.

create table public.exercise_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  completed_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id, completed_on)
);

create index exercise_completions_user_date_idx
  on public.exercise_completions (user_id, completed_on desc);

alter table public.exercise_completions enable row level security;

create policy "Users can read own completions"
  on public.exercise_completions for select using (auth.uid() = user_id);
create policy "Users can insert own completions"
  on public.exercise_completions for insert with check (auth.uid() = user_id);
create policy "Users can delete own completions"
  on public.exercise_completions for delete using (auth.uid() = user_id);

------------------------------------------------------------
-- water_history
------------------------------------------------------------
-- One row per user per day with the final glass count.

create table public.water_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  glasses integer not null check (glasses >= 0 and glasses <= 8),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

create trigger water_history_updated_at
  before update on public.water_history
  for each row execute function public.handle_updated_at();

alter table public.water_history enable row level security;

create policy "Users can read own water"
  on public.water_history for select using (auth.uid() = user_id);
create policy "Users can upsert own water"
  on public.water_history for insert with check (auth.uid() = user_id);
create policy "Users can update own water"
  on public.water_history for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- auto-create a profile row on signup
------------------------------------------------------------
-- Trigger on auth.users so every new user gets a matching profiles row.
-- The user's chosen name (passed in user_metadata at signUp) is copied in.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
