import {
  formatDate,
  mapsUrl,
  getAnnouncements,
  getLatestTournament,
  getPhotos,
  getSettings,
} from "@/lib/data";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Yönetim panelinden yapılan değişiklikler en geç 1 dakika içinde sitede görünür.
export const revalidate = 60;

export default async function Home() {
  const [announcements, tournament, photos, settings] = await Promise.all([
    getAnnouncements(),
    getLatestTournament(),
    getPhotos(),
    getSettings(),
  ]);

  // Google'a kulüp bilgilerini yapılandırılmış biçimde bildirir.
  const structured = {
    "@context": "https://schema.org",
    "@type": "SportsClub",
    name: SITE_NAME,
    alternateName: "Kartal Briç",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.jpg`,
    image: `${SITE_URL}/logo.jpg`,
    description: SITE_DESCRIPTION,
    foundingDate: "2002",
    sport: "Briç",
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    address: settings.address
      ? {
          "@type": "PostalAddress",
          streetAddress: settings.address.replace(/\s*\n\s*/g, ", "),
          addressLocality: "Kartal",
          addressRegion: "İstanbul",
          addressCountry: "TR",
        }
      : { "@type": "PostalAddress", addressLocality: "Kartal", addressRegion: "İstanbul", addressCountry: "TR" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }}
      />
      <header className="nav">
        <a href="#top" className="brand">
          <img src="/logo.jpg" alt="Kartal Briç Spor Kulübü logosu" />
          <span>Kartal Briç</span>
        </a>
        <nav className="nav-links">
          <a href="#duyurular">Duyurular</a>
          <a href="#sonuclar">Sonuçlar</a>
          <a href="#galeri">Galeri</a>
          <a href="#iletisim" className="btn solid">İletişim</a>
        </nav>
      </header>

      <section id="top" className="hero">
        <div className="hero-text">
          <h1 className="eyebrow">Kartal Briç Spor Kulübü · 2002&apos;den beri</h1>
          <p className="slogan">
            Briç, bir masa
            <br />
            etrafında buluşmaktır.
          </p>
          <p>
            Kartal Briç Spor Kulübü; turnuvalar, eğitimler ve haftalık oyunlarla her
            seviyeden oyuncuyu bir araya getirir.
          </p>
          <div className="hero-actions">
            <a href="#duyurular" className="btn solid">Duyurular</a>
            <a href="#sonuclar" className="btn line">Son sonuçlar</a>
          </div>
        </div>
      </section>

      <section id="duyurular" className="section">
        <div className="section-head">
          <h2>Duyurular</h2>
        </div>
        {announcements.length === 0 ? (
          <p className="empty">Henüz duyuru yok.</p>
        ) : (
          <div className="cards">
            {announcements.map((a) => (
              <article key={a.id} className="card">
                {a.image_url && (
                  <img src={a.image_url} alt="" className="card-img" loading="lazy" />
                )}
                <span className="date">{formatDate(a.published_at)}</span>
                <h3>{a.title}</h3>
                <p>{a.body}</p>
                {(a.event_id || a.address) && (
                  <div className="card-actions">
                    {a.event_id && a.registration_events?.is_open && (
                      <a href={`/kayit/${a.event_id}`} className="btn solid">Kayıt ol</a>
                    )}
                    {a.event_id && (
                      <a href={`/kayit/${a.event_id}#liste`} className="btn line">Kayıt olanlar</a>
                    )}
                    {a.address && (
                      <a
                        href={mapsUrl(a.address)}
                        className="btn line"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Adres
                      </a>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="sonuclar" className="section tint">
        <div className="section-head">
          <h2>Turnuva sonuçları</h2>
          {tournament && (
            <p className="empty">
              {tournament.title} · {formatDate(tournament.played_on)}
            </p>
          )}
        </div>
        {!tournament || tournament.result_rows.length === 0 ? (
          <p className="empty">Henüz sonuç yok.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>Çift</th>
                  <th className="num">Skor %</th>
                </tr>
              </thead>
              <tbody>
                {tournament.result_rows.map((r) => (
                  <tr key={r.rank}>
                    <td className="rank">{r.rank}</td>
                    <td>{r.pair}</td>
                    <td className="num">
                      {r.score === null
                        ? "-"
                        : r.score.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {settings.results_url && /^https?:\/\//.test(settings.results_url) && (
          <div className="section-link">
            <a
              href={settings.results_url}
              className="btn solid"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tüm sonuçlar
            </a>
          </div>
        )}
      </section>

      <section id="galeri" className="section">
        <div className="section-head">
          <h2>Galeri</h2>
        </div>
        {photos.length === 0 ? (
          <p className="empty">Henüz fotoğraf yok.</p>
        ) : (
          <div className="gallery">
            {photos.map((p) => (
              <figure key={p.id}>
                <img src={p.url} alt={p.caption ?? "Kulüp fotoğrafı"} loading="lazy" />
              </figure>
            ))}
          </div>
        )}
      </section>

      <section id="iletisim" className="contact">
        <div className="contact-intro">
          <h2>İletişim</h2>
          <p>Üyelik, eğitim ve turnuvalar hakkında bize ulaşın.</p>
        </div>
        <dl className="contact-list">
          <div>
            <dt>Adres</dt>
            <dd>
              {settings.address ? (
                <a href={mapsUrl(settings.address)} target="_blank" rel="noopener noreferrer">
                  {settings.address}
                </a>
              ) : (
                "Yakında"
              )}
            </dd>
          </div>
          <div>
            <dt>Telefon</dt>
            <dd>
              {settings.phone ? <a href={`tel:${settings.phone}`}>{settings.phone}</a> : "Yakında"}
            </dd>
          </div>
          <div>
            <dt>E-posta</dt>
            <dd>
              {settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : "Yakında"}
            </dd>
          </div>
        </dl>
      </section>

      <footer className="footer">
        <span>Kartal Briç Spor Kulübü</span>
        <span>Kuruluş 2002</span>
      </footer>
    </>
  );
}
