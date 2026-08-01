-- EasyCare database schema.
-- Open the SQL Editor in your Supabase project, paste this whole file in, and run it.

-- ---- Tables ----------------------------------------------------------

create table medications (
  id bigint generated always as identity primary key,
  name text not null,
  dosage text,
  frequency text,       -- e.g. "Mon, Wed, Fri" or "Every day"
  reminder_time text,   -- 24-hour "HH:MM"
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table medication_logs (
  id bigint generated always as identity primary key,
  medication_id bigint references medications(id),
  status text not null default 'taken',
  taken_at timestamptz not null default now(),
  photo_url text
);

create table meals (
  id bigint generated always as identity primary key,
  meal_type text,
  meal_date date not null default current_date,
  photo_url text,
  food_tags jsonb not null default '[]',
  notes text,
  created_at timestamptz not null default now()
);

create table custom_food_tags (
  id bigint generated always as identity primary key,
  name text not null unique
);

-- The app has no login, so it connects with Supabase's public "anon" key.
-- These tables need row level security turned off (or open policies) for
-- that key to read and write them.
alter table medications disable row level security;
alter table medication_logs disable row level security;
alter table meals disable row level security;
alter table custom_food_tags disable row level security;

-- ---- Photo storage -----------------------------------------------------
-- Lets the app upload the meal and medication confirmation photos, and load
-- them back with a public URL.

insert into storage.buckets (id, name, public)
values ('medication-photos', 'medication-photos', true),
       ('meal-photos', 'meal-photos', true)
on conflict (id) do nothing;

create policy "public read" on storage.objects for select
  using (bucket_id in ('medication-photos', 'meal-photos'));

create policy "public upload" on storage.objects for insert
  with check (bucket_id in ('medication-photos', 'meal-photos'));
