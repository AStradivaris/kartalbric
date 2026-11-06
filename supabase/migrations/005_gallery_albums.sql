-- Galeri albümleri ve fotoğraf açıklamaları. Supabase SQL Editor'de bir kez çalıştırın.

create table if not exists gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  album_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table photos add column if not exists album_id uuid references gallery_albums(id) on delete cascade;
alter table photos add column if not exists sort_order int not null default 0;

alter table gallery_albums enable row level security;

drop policy if exists "herkes okur" on gallery_albums;
drop policy if exists "yonetici yazar" on gallery_albums;
create policy "herkes okur" on gallery_albums for select using (true);
create policy "yonetici yazar" on gallery_albums for all to authenticated using (true) with check (true);

notify pgrst, 'reload schema';
