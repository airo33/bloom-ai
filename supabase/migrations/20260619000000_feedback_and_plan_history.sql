-- Migration #3.
--
-- 1. feedback — captures in-app feedback / bug reports / feature ideas
--    submitted from Profile → Send feedback.
-- 2. plan_history — archives previous plans whenever the user regenerates
--    or adjusts so they can browse what changed.

------------------------------------------------------------
-- feedback
------------------------------------------------------------

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('bug', 'idea', 'praise', 'other')),
  message text not null,
  device_info jsonb,
  app_version text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_user_idx on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;

create policy "Users can insert own feedback"
  on public.feedback for insert with check (auth.uid() = user_id);
create policy "Users can read own feedback"
  on public.feedback for select using (auth.uid() = user_id);

------------------------------------------------------------
-- plan_history
------------------------------------------------------------

create table if not exists public.plan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan jsonb not null,
  source text not null default 'ai' check (source in ('ai', 'fallback', 'adjusted')),
  -- "why" — adjustment text when the user reshaped the plan
  adjustment text,
  archived_at timestamptz not null default now()
);

create index if not exists plan_history_user_time_idx
  on public.plan_history (user_id, archived_at desc);

alter table public.plan_history enable row level security;

create policy "Users can read own plan history"
  on public.plan_history for select using (auth.uid() = user_id);
create policy "Users can insert own plan history"
  on public.plan_history for insert with check (auth.uid() = user_id);
