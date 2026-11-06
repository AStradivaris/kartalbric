-- Kartal Briç: Supabase tabloları
-- Supabase panelinde SQL Editor'e yapıştırıp bir kez çalıştırın.

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
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
  ('address', ''), ('phone', ''), ('email', '')
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
