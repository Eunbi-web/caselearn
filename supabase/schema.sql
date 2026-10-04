-- ============================================================
-- CASE FILE — assignment vlog · Supabase schema
-- ============================================================
-- Paste this whole file into the Supabase SQL editor and run it once
-- (safe to re-run — everything is "if not exists" / "on conflict").
-- Then run supabase/seed.sql. No auth users are needed: the site has
-- no sign-in and everyone may read and write through the anon key.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- SUBJECTS — the course folders (Folder #001 … #005)
-- ============================================================
create table if not exists public.subjects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  case_number text not null,
  title       text not null,
  short_title text not null default '',
  description text not null default '',
  folder_note text not null default '',
  icon        text not null default 'book'
              check (icon in ('book', 'bulb', 'pencil', 'monitor', 'eye', 'star', 'user', 'camera')),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- ENTRIES — the assignments inside each folder
--   code is the stable reference the site already uses
--   ('001-01', …) — photo slots are named entry-<code>.
-- ============================================================
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references public.subjects (id) on delete cascade,
  code        text not null unique,
  slug        text not null,
  title       text not null default 'NEW ENTRY',
  entry_date  date not null default current_date,
  about       text not null default '',
  description text not null default '',
  key_points  jsonb not null default '[]' check (jsonb_typeof(key_points) = 'array'),
  notes       jsonb not null default '[]' check (jsonb_typeof(notes) = 'array'),
  task        text not null default '',
  wrap_up     text not null default '',
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (subject_id, slug)
);

create index if not exists entries_subject_idx on public.entries (subject_id, sort_order);
create index if not exists entries_date_idx    on public.entries (entry_date desc);

-- ============================================================
-- ENTRY PROGRESS — one row per entry the owner marked as done
-- ============================================================
create table if not exists public.entry_progress (
  entry_id   uuid primary key references public.entries (id) on delete cascade,
  done       boolean not null default true,
  done_at    timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- JOURNAL POSTS — the "LIFE UPDATES" page
--   legacy_id keeps the original seed ids (j-01…) so re-seeding
--   never duplicates; posts written on the site have none.
-- ============================================================
create table if not exists public.journal_posts (
  id        uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  entry_date date not null default current_date,
  title     text not null default 'UNTITLED UPDATE',
  body      text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_date_idx on public.journal_posts (entry_date desc);

-- ============================================================
-- PROFILE — a single row (id is pinned to 1)
-- ============================================================
create table if not exists public.profile (
  id          int primary key default 1 check (id = 1),
  name        text not null default '',
  case_number text not null default '',
  "sign"      text not null default '',
  dob         text not null default '',
  citizen     text not null default '',
  motto       text not null default '',
  extra       text not null default '',
  note_title  text not null default '',
  note_text   text not null default '',
  fandoms     jsonb not null default '[]' check (jsonb_typeof(fandoms) = 'array'),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PHOTOS — maps every upload slot on the site to an object in
--   the site-photos storage bucket. Slots:
--     me                          the profile photo
--     entry-<code>                one per entry (entry-001-01 …)
--     course-<slug>               one per folder cover
--     artwork-01 … artwork-06     the portfolio frames
-- ============================================================
create table if not exists public.photos (
  slot         text primary key,
  storage_path text not null,
  content_type text not null default 'image/jpeg',
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- updated_at touch — applied automatically on every update
-- ============================================================
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['subjects', 'entries', 'entry_progress', 'journal_posts', 'profile', 'photos'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format('create trigger %I_set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t, t);
  end loop;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
--   The site has no sign-in: everyone can read and write.
--   (Row level security is still enabled so the tables are not
--   wide open to service keys; these policies simply allow the
--   public anon key — the same one shipped with the site.)
-- ============================================================
alter table public.subjects       enable row level security;
alter table public.entries        enable row level security;
alter table public.entry_progress enable row level security;
alter table public.journal_posts  enable row level security;
alter table public.profile        enable row level security;
alter table public.photos         enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['subjects', 'entries', 'entry_progress', 'journal_posts', 'profile', 'photos'] loop
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format('create policy %I on public.%I
                    for select to anon, authenticated using (true)', t || '_public_read', t);

    execute format('drop policy if exists %I on public.%I', t || '_owner_write', t);
    execute format('drop policy if exists %I on public.%I', t || '_anyone_write', t);
    execute format('create policy %I on public.%I
                    for all to anon, authenticated using (true) with check (true)', t || '_anyone_write', t);
  end loop;
end;
$$;

-- ============================================================
-- STORAGE — public bucket for every photo slot
-- ============================================================
insert into storage.buckets (id, name, public)
values ('site-photos', 'site-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "site_photos_public_read"  on storage.objects;
drop policy if exists "site_photos_owner_insert" on storage.objects;
drop policy if exists "site_photos_owner_update" on storage.objects;
drop policy if exists "site_photos_owner_delete" on storage.objects;
drop policy if exists "site_photos_anyone_insert" on storage.objects;
drop policy if exists "site_photos_anyone_update" on storage.objects;
drop policy if exists "site_photos_anyone_delete" on storage.objects;

create policy "site_photos_public_read"  on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'site-photos');

create policy "site_photos_anyone_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'site-photos');

create policy "site_photos_anyone_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'site-photos') with check (bucket_id = 'site-photos');

create policy "site_photos_anyone_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'site-photos');
