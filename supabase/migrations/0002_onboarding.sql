-- Slice 2: the 4-step onboarding answers.
-- Run this once in the Supabase SQL Editor, after 0001_profiles.sql.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists household_size text,
  add column if not exists main_app text,
  add column if not exists backup_app text,
  add column if not exists wait_window text,
  add column if not exists onboarding_completed_at timestamptz;

-- One row per item a household picked in onboarding (or added later).
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  catalog_id text,              -- e.g. 'milk'; null for a custom "Add item" entry
  custom_name text,             -- only set when catalog_id is null
  category text not null,
  estimated_days integer not null,
  cant_wait boolean not null default false,
  pet_name text,
  status text not null default 'active', -- active | paused | parked_next_basket
  last_restock_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pantry_items enable row level security;

-- Same privacy rule as profiles: a person can only ever see or change
-- their own pantry rows.
create policy "pantry_items: select own rows"
  on public.pantry_items for select
  using (auth.uid() = user_id);

create policy "pantry_items: insert own rows"
  on public.pantry_items for insert
  with check (auth.uid() = user_id);

create policy "pantry_items: update own rows"
  on public.pantry_items for update
  using (auth.uid() = user_id);

create policy "pantry_items: delete own rows"
  on public.pantry_items for delete
  using (auth.uid() = user_id);
