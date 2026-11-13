import type { Metadata } from "next";
import {
  FITBRIDGE_PLAY_URL,
  FITBRIDGE_WEB_URL,
  FITBRIDGE_YOUTUBE_CHANNEL,
  FITBRIDGE_YOUTUBE_ID,
} from "@/lib/site";
import "./fitbridge.css";

export const metadata: Metadata = {
  title: "FitBridge: ortağınla deklere pratiği",
  description:
    "FitBridge ile ortağınla istediğin zaman deklere pratiği yap, deklere sisteminizi birlikte yaz. Aynı anda çevrimiçi olmanız gerekmez. Android ve web.",
  alternates: { canonical: "/fitbridge" },
  openGraph: {
    title: "FitBridge: ortağınla deklere pratiği",
    description: "Ortağınla deklere pratiği yap, deklere sisteminizi birlikte yaz.",
    url: "/fitbridge",
    images: [{ url: "/fitbridge/tile.png", alt: "FitBridge logosu" }],
  },
};

const FEATURES = [
  {
    img: "seri",
    kicker: "El gönder",
    title: "Hangi elleri çalışacağınızı sen seç",
    text: "Ortağını ve el sayısını seç, ortaklık puanını belirle. Örneğin en az 25 HCP'lik ellerle oyun ihalelerini çalışın. Ortağına anında bildirim gider.",
  },
  {
    img: "sistem",
    kicker: "Sistemini yaz",
    title: "Deklere sisteminizi adım adım kurun",
    text: "Açılışları ve cevapları ağaç şeklinde yaz: 1NT, Stayman, transferler, davetler… Hazır olunca tek dokunuşla PDF çıktısını al.",
  },
  {
    img: "paylasim",
    kicker: "Birlikte düzenle",
    title: "Sistemi ortağınla paylaş",
    text: "Sadece görüntüleme, tam erişim ya da kendi kopyası: ortağına hangi yetkiyi vereceğini sen seç. Tam erişimde sistemi birlikte düzenlersiniz.",
  },
  {
    img: "alert",
    kicker: "Deklerede yanında",
    title: "Her deklerenin anlamı ekranda",
    text: "Deklarasyon sırasında sisteminizi seçin. Deklereni seçtiğin anda anlamı, ortağının deklaresinin anlamı da karşında görünür. Pratik yaptıkça ezberle.",
  },
  {
    img: "analiz",
    kicker: "Birlikte incele",
    title: "Dört el ve tüm deklareler bir arada",
    text: "Deklarasyon bitince dört eli, puanları ve kimin ne dediğini birlikte görün. Favorilere ekleyip sonra tekrar çalışın.",
  },
];

function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 3.5v17l14-8.5z" fill="currentColor" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9s1.3-6.3 3.8-9z" />
    </svg>
  );
}

function Cta() {
  return (
    <div className="fbp-cta">
      <a className="fbp-btn primary" href={FITBRIDGE_PLAY_URL} target="_blank" rel="noopener noreferrer">
        <PlayIcon />
        Google Play&apos;den indir
      </a>
      <a className="fbp-btn ghost" href={FITBRIDGE_WEB_URL} target="_blank" rel="noopener noreferrer">
        <GlobeIcon />
        Web&apos;de aç
      </a>
    </div>
  );
}

export default function FitBridgePage() {
  return (
    <div className="fbp">
      <header className="fbp-top">
        <a href="/" className="fbp-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Kartal Briç
        </a>
        <a className="fbp-top-open" href={FITBRIDGE_WEB_URL} target="_blank" rel="noopener noreferrer">
          Uygulamayı aç
        </a>
      </header>

      {/* Giriş */}
      <section className="fbp-hero">
        <span className="fbp-suit s1" aria-hidden="true">♠</span>
        <span className="fbp-suit s2" aria-hidden="true">♥</span>
        <span className="fbp-suit s3" aria-hidden="true">♦</span>
        <span className="fbp-suit s4" aria-hidden="true">♣</span>
        <div className="fbp-hero-text">
          <img className="fbp-tile" src="/fitbridge/tile.png" alt="FitBridge logosu" width={120} height={120} />
          <h1>FitBridge</h1>
          <p className="fbp-lead">
            Ortağınla deklere pratiği yap,
            <br />
            deklere sisteminizi birlikte yaz.
          </p>
          <Cta />
          <p className="fbp-note">iPhone ve bilgisayarda web sürümünü kullanabilirsin.</p>
        </div>
        <div className="fbp-hero-phones" aria-hidden="true">
          <div className="fbp-phone back">
            <img src="/fitbridge/deklere-ortak.jpg" alt="" width={470} height={920} />
          </div>
          <div className="fbp-phone front">
            <img src="/fitbridge/alert.jpg" alt="" width={470} height={920} />
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="fbp-section fbp-video-wrap" id="video">
        <h2>2 dakikada FitBridge</h2>
        <p className="fbp-sub">Hesap açmaktan sistemini deklerede kullanmaya kadar her adım.</p>
        <div className="fbp-video">
          {FITBRIDGE_YOUTUBE_ID ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${FITBRIDGE_YOUTUBE_ID}?rel=0&playsinline=1`}
              title="FitBridge nasıl kullanılır"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <a className="fbp-video-soon" href={FITBRIDGE_YOUTUBE_CHANNEL} target="_blank" rel="noopener noreferrer">
              <span className="fbp-play" aria-hidden="true">
                <PlayIcon />
              </span>
              <strong>Tanıtım videosu çok yakında</strong>
              <span>YouTube kanalımız: @fitbridgetr</span>
            </a>
          )}
        </div>
        {FITBRIDGE_YOUTUBE_ID && (
          <div className="fbp-yt-row">
            {/* Telefonda YouTube uygulamasında, bilgisayarda YouTube'da açılır */}
            <a className="fbp-yt" href={`https://youtu.be/${FITBRIDGE_YOUTUBE_ID}`} target="_blank" rel="noopener noreferrer">
              <svg width="30" height="21" viewBox="0 0 30 21" aria-hidden="true">
                <rect width="30" height="21" rx="6" fill="#ff0033" />
                <path d="M12 6v9l8-4.5z" fill="#fff" />
              </svg>
              YouTube&apos;da izle
            </a>
          </div>
        )}
      </section>

      {/* Asenkron */}
      <section className="fbp-section fbp-async">
        <div className="fbp-async-text">
          <span className="fbp-kicker">Asıl fark</span>
          <h2>Herkes aynı anda müsait olamaz.</h2>
          <p>
            Sen öğle arasında deklereni verirsin, ortağın akşam müsait olunca cevaplar. Aynı anda çevrimiçi
            olmanız gerekmez: <b>FitBridge&apos;de eller sizi bekler.</b>
          </p>
        </div>
        <div className="fbp-async-phones">
          <figure className="fbp-clockphone day">
            <figcaption>
              <span aria-hidden="true">☀</span> 13:00 <small>öğle arası</small>
            </figcaption>
            <div className="fbp-phone">
              <img src="/fitbridge/deklere-sen.jpg" alt="Senin ekranın: elini görüp ilk deklereyi veriyorsun" width={470} height={920} loading="lazy" />
            </div>
          </figure>
          <figure className="fbp-clockphone night">
            <figcaption>
              <span aria-hidden="true">☾</span> 20:30 <small>akşam</small>
            </figcaption>
            <div className="fbp-phone">
              <img src="/fitbridge/deklere-ortak.jpg" alt="Ortağının ekranı: akşam uygulamayı açıp cevap veriyor" width={470} height={920} loading="lazy" />
            </div>
          </figure>
        </div>
      </section>

      {/* Özellikler */}
      <section className="fbp-section fbp-features">
        {FEATURES.map((f, i) => (
          <article key={f.img} className={`fbp-feature${i % 2 ? " flip" : ""}`}>
            <div className="fbp-feature-media">
              <div className="fbp-phone">
                <img src={`/fitbridge/${f.img}.jpg`} alt={f.title} width={470} height={920} loading="lazy" />
              </div>
              {f.img === "alert" && (
                <img className="fbp-callout" src="/fitbridge/alert-kutu.jpg" alt="" width={900} height={170} loading="lazy" />
              )}
            </div>
            <div className="fbp-feature-text">
              <span className="fbp-kicker">{f.kicker}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Başlangıç */}
      <section className="fbp-section fbp-steps-wrap">
        <h2>Üç adımda başla</h2>
        <ol className="fbp-steps">
          <li>
            <b>Hesabını aç</b>
            <span>Kullanıcı adın, ortaklarının seni göreceği isimdir.</span>
          </li>
          <li>
            <b>Ortağını ekle</b>
            <span>Arkadaşlar sekmesinde ara, istek gönder.</span>
          </li>
          <li>
            <b>İlk serini gönder</b>
            <span>El sayısını ve puanı seç, ortağın bildirim alsın.</span>
          </li>
        </ol>
      </section>

      {/* Kapanış */}
      <section className="fbp-final">
        <img className="fbp-tile" src="/fitbridge/tile.png" alt="" width={96} height={96} />
        <h2>Ortağınla çalışmaya bugün başla</h2>
        <Cta />
      </section>

      <footer className="fbp-foot">
        <span>FitBridge · Kartal Briç Spor Kulübü</span>
        <a href="mailto:fitbridge@kartalbric.com">fitbridge@kartalbric.com</a>
        <a href={FITBRIDGE_YOUTUBE_CHANNEL} target="_blank" rel="noopener noreferrer">
          YouTube: @fitbridgetr
        </a>
      </footer>
    </div>
  );
}
