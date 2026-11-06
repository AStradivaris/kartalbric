-- Mevcut veritabanına: duyurulara fotoğraf ve sonuç bağlantısı ayarı ekler.
-- Supabase SQL Editor'de bir kez çalıştırın.

alter table announcements add column if not exists image_url text;

insert into site_settings (key, value) values ('results_url', '')
on conflict (key) do nothing;
