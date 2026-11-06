-- Kartal Briç: Supabase tabloları
-- Supabase panelinde SQL Editor'e yapıştırıp bir kez çalıştırın.

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  image_url text,
  published boolean not null default true,
  published_at timestamptz not null default now()
);

create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  played_on date not null default current_date
);

create table if not exists result_rows (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  rank int not null,
  pair text not null,
  score numeric(5,2)
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists site_settings (
  key text primary key,
  value text not null default ''
);

insert into site_settings (key, value) values
  ('address', ''), ('phone', ''), ('email', ''), ('results_url', '')
on conflict (key) do nothing;

-- Güvenlik: herkes okuyabilir, yalnızca giriş yapmış yönetici yazabilir.
alter table announcements enable row level security;
alter table tournaments enable row level security;
alter table result_rows enable row level security;
alter table photos enable row level security;
alter table site_settings enable row level security;

create policy "herkes okur" on announcements for select using (published or auth.role() = 'authenticated');
create policy "herkes okur" on tournaments for select using (true);
create policy "herkes okur" on result_rows for select using (true);
create policy "herkes okur" on photos for select using (true);
create policy "herkes okur" on site_settings for select using (true);

create policy "yonetici yazar" on announcements for all to authenticated using (true) with check (true);
create policy "yonetici yazar" on tournaments for all to authenticated using (true) with check (true);
create policy "yonetici yazar" on result_rows for all to authenticated using (true) with check (true);
create policy "yonetici yazar" on photos for all to authenticated using (true) with check (true);
create policy "yonetici yazar" on site_settings for all to authenticated using (true) with check (true);

-- Fotoğraf deposu (galeri)
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "galeri herkes okur" on storage.objects for select using (bucket_id = 'gallery');
create policy "galeri yonetici yazar" on storage.objects for all to authenticated
  using (bucket_id = 'gallery') with check (bucket_id = 'gallery');

-- ---- Kayıt sistemi (migrations/002_registrations.sql ile aynı) ----
create table if not exists registration_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references registration_events(id) on delete cascade,
  p1_name text not null,
  p2_name text not null,
  created_at timestamptz not null default now(),
  constraint p1_len check (char_length(trim(p1_name)) between 3 and 80),
  constraint p2_len check (char_length(trim(p2_name)) between 3 and 80),
  constraint different_players check (lower(trim(p1_name)) <> lower(trim(p2_name)))
);

-- Aynı çift (sıra fark etmeksizin, büyük/küçük harf fark etmeksizin) aynı turnuvaya iki kez yazılamaz.
create unique index if not exists registrations_unique_pair on registrations (
  event_id,
  least(lower(trim(p1_name)), lower(trim(p2_name))),
  greatest(lower(trim(p1_name)), lower(trim(p2_name)))
);

-- Duyuruya kayıt bağlantısı
alter table announcements
  add column if not exists event_id uuid references registration_events(id) on delete set null;

alter table registration_events enable row level security;
alter table registrations enable row level security;

create policy "herkes okur" on registration_events for select using (true);
create policy "herkes okur" on registrations for select using (true);

create policy "yonetici yazar" on registration_events for all to authenticated using (true) with check (true);
create policy "yonetici yazar" on registrations for all to authenticated using (true) with check (true);

-- Herkes, yalnızca kaydı AÇIK bir turnuvaya kayıt ekleyebilir (silemez, değiştiremez).
create policy "herkes kayit olur" on registrations for insert to anon, authenticated
with check (
  exists (
    select 1 from registration_events e
    where e.id = registrations.event_id and e.is_open
  )
);

notify pgrst, 'reload schema';

-- ---- Duyuru adresi (migrations/003_announcement_address.sql ile aynı) ----
alter table announcements add column if not exists address text;

-- ---- Duyuru sıralaması (migrations/004_announcement_order.sql) ----
alter table announcements add column if not exists sort_order int not null default 0;
