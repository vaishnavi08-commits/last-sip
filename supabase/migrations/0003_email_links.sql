-- Slice 5: tracks which one-tap email links have already been used, so a
-- link can't be replayed (e.g. an email provider's link-scanner
-- pre-fetching it, or someone reusing an old email).
-- Run this once in the Supabase SQL Editor.

create table if not exists public.used_email_links (
  token_hash text primary key,
  used_at timestamptz not null default now()
);

alter table public.used_email_links enable row level security;
-- No policies: this table is only ever touched by server code using the
-- service role key, which bypasses RLS. Regular users can never read or
-- write it directly.
