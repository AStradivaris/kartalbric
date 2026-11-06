-- Turnuva kayıt sistemi. Supabase SQL Editor'de bir kez çalıştırın.

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
