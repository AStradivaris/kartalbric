-- Duyuru sıralaması. Supabase SQL Editor'de bir kez çalıştırın.
-- Mevcut duyurulara tarih sırasına göre numara verir (en yeni en üstte).

alter table announcements add column if not exists sort_order int not null default 0;

update announcements a
set sort_order = s.rn
from (select id, row_number() over (order by published_at asc) as rn from announcements) s
where a.id = s.id;

notify pgrst, 'reload schema';
