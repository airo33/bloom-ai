-- Waitlist table for pre-launch signups from the landing page.
-- Anon INSERT only (public form); reads restricted to service role
-- so scrapers can't dump the email list via the exposed anon key.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,               -- 'landing' | 'tiktok' | 'reddit' | ...
  created_at timestamptz not null default now(),
  unique (email)
);

alter table public.waitlist enable row level security;

-- Public form can INSERT. We do NOT grant select/update/delete to anon.
drop policy if exists "anon can insert" on public.waitlist;
create policy "anon can insert" on public.waitlist
  for insert to anon with check (true);
