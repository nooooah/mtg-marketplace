-- ═══════════════════════════════════════════
-- TCG Community Market — Supabase SQL Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. PROFILES
--    One row per user, linked to auth.users
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid        references auth.users on delete cascade primary key,
  username    text        unique not null,
  avatar_url  text,
  bio         text,
  created_at  timestamptz default timezone('utc', now()) not null
);

-- Auto-create profile on signup (trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "Profiles are public"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);


-- ─────────────────────────────────────────────
-- 2. LISTINGS
--    Card listings posted by sellers
-- ─────────────────────────────────────────────
create table if not exists public.listings (
  id              uuid        default gen_random_uuid() primary key,
  user_id         uuid        references public.profiles(id) on delete cascade not null,
  card_id         text        not null,        -- Scryfall card UUID
  card_name       text        not null,
  card_set        text,                        -- e.g. "lea"
  card_set_name   text,                        -- e.g. "Limited Edition Alpha"
  card_image_uri  text,
  card_rarity     text,
  card_mana_cost  text,
  card_type       text,
  condition       text        not null check (condition in ('NM','LP','MP','HP','DMG')),
  price           numeric(10,2) not null check (price > 0),
  quantity        integer     default 1 check (quantity >= 1),
  notes           text,
  views           integer     default 0,
  created_at      timestamptz default timezone('utc', now()) not null
);

-- Index for search + sort performance
create index if not exists listings_card_name_idx on public.listings using gin (to_tsvector('english', card_name));
create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_views_idx       on public.listings (views desc);
create index if not exists listings_user_id_idx     on public.listings (user_id);

-- RLS
alter table public.listings enable row level security;

create policy "Listings are public"
  on public.listings for select using (true);

create policy "Sellers can insert own listings"
  on public.listings for insert with check (auth.uid() = user_id);

create policy "Sellers can update own listings"
  on public.listings for update using (auth.uid() = user_id);

create policy "Sellers can delete own listings"
  on public.listings for delete using (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 3. EVENTS
-- ─────────────────────────────────────────────
create table if not exists public.events (
  id            uuid        default gen_random_uuid() primary key,
  title         text        not null,
  description   text,
  date          timestamptz not null,
  location      text,
  image_url     text,
  organizer_id  uuid        references public.profiles(id) on delete set null,
  created_at    timestamptz default timezone('utc', now()) not null
);

alter table public.events enable row level security;

create policy "Events are public"
  on public.events for select using (true);

create policy "Authenticated users can create events"
  on public.events for insert with check (auth.uid() is not null);


-- ─────────────────────────────────────────────
-- 4. MESSAGES
-- ─────────────────────────────────────────────
create table if not exists public.messages (
  id           uuid        default gen_random_uuid() primary key,
  sender_id    uuid        references public.profiles(id) on delete cascade not null,
  receiver_id  uuid        references public.profiles(id) on delete cascade not null,
  listing_id   uuid        references public.listings(id) on delete set null,
  content      text        not null,
  read         boolean     default false,
  created_at   timestamptz default timezone('utc', now()) not null
);

create index if not exists messages_receiver_idx on public.messages (receiver_id, created_at desc);

alter table public.messages enable row level security;

create policy "Users can see their own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Authenticated users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Receivers can mark messages as read"
  on public.messages for update
  using (auth.uid() = receiver_id);


-- ─────────────────────────────────────────────
-- 5. VIEW COUNTER FUNCTION
--    Called when a listing page is opened
-- ─────────────────────────────────────────────
create or replace function public.increment_listing_views(listing_id uuid)
returns void as $$
  update public.listings set views = views + 1 where id = listing_id;
$$ language sql security definer;
