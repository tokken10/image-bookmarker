-- Enable UUID generation helper
create extension if not exists "pgcrypto";

-- =========================
-- Tables
-- =========================

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  mime_type text,
  media_type text check (media_type in ('image', 'video')),
  title text,
  source_url text,
  categories text[] not null default '{}',
  topics text[] not null default '{}',
  search_tokens text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, url)
);

create table if not exists public.custom_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unique (user_id, name)
);

-- =========================
-- RLS
-- =========================

alter table public.bookmarks enable row level security;
alter table public.custom_categories enable row level security;

-- =========================
-- Policies (drop + create)
-- =========================

-- BOOKMARKS POLICIES

drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own"
  on public.bookmarks
  for select
  using (auth.uid() = user_id);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
  on public.bookmarks
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own"
  on public.bookmarks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
  on public.bookmarks
  for delete
  using (auth.uid() = user_id);

-- CUSTOM CATEGORIES POLICIES

drop policy if exists "custom_categories_select_own" on public.custom_categories;
create policy "custom_categories_select_own"
  on public.custom_categories
  for select
  using (auth.uid() = user_id);

drop policy if exists "custom_categories_insert_own" on public.custom_categories;
create policy "custom_categories_insert_own"
  on public.custom_categories
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "custom_categories_update_own" on public.custom_categories;
create policy "custom_categories_update_own"
  on public.custom_categories
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "custom_categories_delete_own" on public.custom_categories;
create policy "custom_categories_delete_own"
  on public.custom_categories
  for delete
  using (auth.uid() = user_id);