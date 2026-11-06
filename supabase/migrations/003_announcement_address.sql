-- Duyuruya adres alanı (Google Haritalar düğmesi için). Supabase SQL Editor'de bir kez çalıştırın.

alter table announcements add column if not exists address text;

notify pgrst, 'reload schema';
