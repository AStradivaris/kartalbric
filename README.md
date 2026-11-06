# Kartal Briç Spor Kulübü

Kulüp web sitesi: Next.js + Supabase.

## Yapı

- `app/page.tsx`: ana sayfa (duyurular, sonuçlar, galeri, iletişim)
- `lib/`: Supabase bağlantısı ve veri okuma
- `supabase/schema.sql`: veritabanı tabloları ve güvenlik kuralları

## Ortam değişkenleri

`.env.example` dosyasındaki iki değişken Vercel'de (ve yerelde `.env.local` içinde) tanımlanmalıdır:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Tanımlı değilse site boş durumlarla ("Henüz duyuru yok") açılır.

## Durum

- [x] Ana sayfa
- [ ] Supabase kurulumu
- [ ] Yönetim paneli
- [ ] Yayın ve alan adı
