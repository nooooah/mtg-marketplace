-- ═══════════════════════════════════════════════════════
-- Admin System Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1. Add `restricted` column to profiles
--    Restricted users cannot log in / access the site
-- ─────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists restricted boolean default false not null;

-- ─────────────────────────────────────────────────────────
-- 2. App Settings
--    Key/value store for site-wide toggles
-- ─────────────────────────────────────────────────────────
create table if not exists public.app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- Seed default: registration is ON
insert into public.app_settings (key, value)
  values ('registration_enabled', 'true')
  on conflict (key) do nothing;

-- RLS: public read, no client writes
alter table public.app_settings enable row level security;

create policy "App settings are public"
  on public.app_settings for select using (true);

-- ─────────────────────────────────────────────────────────
-- 3. Waitlist
--    Emails collected when registration is OFF
-- ─────────────────────────────────────────────────────────
create table if not exists public.waitlist (
  id         uuid        default gen_random_uuid() primary key,
  email      text        unique not null,
  created_at timestamptz default timezone('utc', now()) not null
);

-- RLS: no public reads, inserts allowed for anyone
alter table public.waitlist enable row level security;

create policy "Anyone can join waitlist"
  on public.waitlist for insert with check (true);
