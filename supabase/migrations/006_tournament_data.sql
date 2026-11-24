-- Turnuva sonuç sayfaları (/sonuclar): skor dosyası + .dup ellerinden üretilen veri.
alter table tournaments add column if not exists data jsonb;
alter table tournaments add column if not exists created_at timestamptz not null default now();
create index if not exists tournaments_played_on_idx on tournaments (played_on desc);

notify pgrst, 'reload schema';
