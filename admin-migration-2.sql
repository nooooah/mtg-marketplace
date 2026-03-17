-- ═══════════════════════════════════════════════════════
-- Admin System Migration 2 — Seed admin credentials
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- Seed admin credentials into app_settings
-- (won't overwrite if already set)
insert into public.app_settings (key, value)
  values
    ('admin_username',       'admin'),
    ('admin_password',       'mtgAdmin123!'),
    ('admin_email',          'noah.loyola@gmail.com'),
    ('waitlist_notify_email','noah.loyola@gmail.com')
  on conflict (key) do nothing;
