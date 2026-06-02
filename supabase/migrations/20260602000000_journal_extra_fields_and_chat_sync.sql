-- Migration #2.
--
-- 1. Extend journal_entries with three new optional columns:
--      sleep_quality (0..10) — how rested they feel
--      energy        (0..10) — subjective energy
--      stress        (0..10) — subjective stress
--    All nullable so old rows continue to work, and old clients don't
--    have to know about them.
--
-- 2. New table chat_messages — persists AI Physio chat across devices
--    instead of only living in the local Zustand store.

------------------------------------------------------------
-- journal_entries: extra fields
------------------------------------------------------------

alter table public.journal_entries
  add column if not exists sleep_quality integer
    check (sleep_quality is null or (sleep_quality >= 0 and sleep_quality <= 10));

alter table public.journal_entries
  add column if not exists energy integer
    check (energy is null or (energy >= 0 and energy <= 10));

alter table public.journal_entries
  add column if not exists stress integer
    check (stress is null or (stress >= 0 and stress <= 10));

------------------------------------------------------------
-- chat_messages
------------------------------------------------------------

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_time_idx
  on public.chat_messages (user_id, created_at);

alter table public.chat_messages enable row level security;

create policy "Users can read own chat"
  on public.chat_messages for select using (auth.uid() = user_id);
create policy "Users can insert own chat"
  on public.chat_messages for insert with check (auth.uid() = user_id);
create policy "Users can delete own chat"
  on public.chat_messages for delete using (auth.uid() = user_id);
