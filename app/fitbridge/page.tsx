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
    text: "Açılışları ve cevapları ağaç şeklinde yaz: 1NT, Stayman, transferler, davetler… Hazır olunca tek dokunuşla PDF çıktısını al. Sayfalarca sisteminiz varsa elle yazmanıza gerek yok, biz aktaralım.",
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

const SYSTEM_MAIL =
  "mailto:fitbridge@kartalbric.com?subject=" + encodeURIComponent("FitBridge'e sistem aktarma");

const NEWS = [
  {
    icon: "⚡",
    title: "Daha hızlı",
    text: "Arayüz, deklarasyon ekranı ve sistem yazma modülü yenilendi. Uygulama artık çok daha akıcı.",
    href: "",
    link: "",
  },
  {
    icon: "📚",
    title: "Sisteminizi biz aktaralım",
    text: "Sayfalarca sisteminiz mi var? PDF, Word ya da fotoğraf olarak gönderin, uygulamaya biz ekleyelim.",
    href: "#sistem-aktar",
    link: "Nasıl?",
  },
  {
    icon: "🔔",
    title: "iPhone'da bildirimler",
    text: "Web sürümünü ana ekrana ekleyin, ortağınız seri başlattığında bildirim telefonunuza gelsin.",
    href: "#iphone",
    link: "Adımlar",
  },
];

const IPHONE_STEPS = [
  { b: "Safari'den aç", s: "fitbridge.kartalbric.com adresine Safari ile girin." },
  { b: "Paylaş'a dokun", s: "Alttaki yukarı oklu kare simgesi. Göremezseniz önce ••• menüsüne dokunun." },
  { b: "Ana Ekrana Ekle", s: "Listeden “Ana Ekrana Ekle”yi seçip Ekle'ye dokunun." },
  { b: "Simgeden giriş yap", s: "Ana ekranda beliren FitBridge simgesiyle uygulamayı açıp giriş yapın." },
  { b: "Bildirimlere izin ver", s: "İzin sorulunca “İzin Ver”e dokunun. Hepsi bu kadar." },
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
          <a className="fbp-new" href="#yenilikler">
            <span className="fbp-new-tag">YENİ</span>
            <span className="fbp-new-long">Daha hızlı uygulama, iPhone&apos;da bildirimler</span>
            <span className="fbp-new-short">Kasım güncellemesi geldi</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <h1>FitBridge</h1>
          <p className="fbp-lead">
            Ortağınla deklere pratiği yap,
            <br />
            deklere sisteminizi birlikte yaz.
          </p>
          <Cta />
          <p className="fbp-note">
            iPhone ve bilgisayarda web sürümünü kullanabilirsin. iPhone&apos;da{" "}
            <a href="#iphone">ana ekrana ekleyince bildirimler de gelir</a>.
          </p>
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

      {/* Yenilikler */}
      <section className="fbp-section fbp-news-wrap" id="yenilikler">
        <span className="fbp-kicker">Kasım güncellemesi</span>
        <h2>Yenilikler</h2>
        <div className="fbp-news">
          {NEWS.map((n) => (
            <article key={n.title} className="fbp-news-card">
              <span className="fbp-news-icon" aria-hidden="true">
                {n.icon}
              </span>
              <h3>{n.title}</h3>
              <p>{n.text}</p>
              {n.href && (
                <a className="fbp-news-link" href={n.href}>
                  {n.link} →
                </a>
              )}
            </article>
          ))}
        </div>
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

      {/* Sistem aktarma */}
      <section className="fbp-section fbp-import" id="sistem-aktar">
        <div className="fbp-import-card">
          <div className="fbp-import-text">
            <span className="fbp-kicker">Sistem aktarma</span>
            <h2>Sayfalarca sisteminiz mi var? Elle yazmanıza gerek yok.</h2>
            <p>
              Sisteminizi <b>PDF, Word ya da fotoğraf</b> olarak gönderin, FitBridge&apos;e biz aktaralım. Sonrasında:
            </p>
            <ul className="fbp-checks">
              <li>Deklarasyonda siz ve ortağınız deklerelere dokunarak anlamlarını görürsünüz.</li>
              <li>Sistemi uygulama içinde istediğiniz zaman düzenlersiniz.</li>
              <li>Başka arkadaşlarınızla paylaşır, tam erişim ya da sadece görüntüleme yetkisi verirsiniz.</li>
            </ul>
            <div className="fbp-cta">
              <a className="fbp-btn primary" href={SYSTEM_MAIL}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                Sistemini gönder
              </a>
            </div>
            <p className="fbp-import-mail">fitbridge@kartalbric.com</p>
            <p className="fbp-import-soon">
              Sisteminizi paylaşmak istemiyor musunuz? <b>İçe aktarma modülü</b> üzerinde çalışıyoruz; yakında kendiniz
              aktarabileceksiniz.
            </p>
          </div>
          <div className="fbp-import-tree" aria-hidden="true">
            <div className="fbp-tree-doc">
              <span>PDF</span>
              <span>Word</span>
              <span>📷</span>
            </div>
            <div className="fbp-tree-arrow">→</div>
            <ul className="fbp-tree">
              <li><b className="c">1♣</b> 16+ any</li>
              <li className="in"><b className="d">1♦</b> 0-7 any</li>
              <li className="in"><b className="h">1♥</b> 8-11 balanced</li>
              <li><b className="n">1NT</b> 14-16 balanced</li>
              <li className="in"><b className="c">2♣</b> Stayman</li>
            </ul>
          </div>
        </div>
      </section>

      {/* iPhone bildirimleri */}
      <section className="fbp-section fbp-iphone" id="iphone">
        <div className="fbp-iphone-head">
          <span className="fbp-kicker">iPhone kullanıcıları</span>
          <h2>Bildirimleri bir kez açın, sıra size gelince haber alın</h2>
          <p className="fbp-sub">
            Web sürümünü ana ekrana ekleyince FitBridge uygulama gibi açılır ve bildirim gönderebilir.
          </p>
        </div>
        <ol className="fbp-isteps">
          {IPHONE_STEPS.map((st) => (
            <li key={st.b}>
              <b>{st.b}</b>
              <span>{st.s}</span>
            </li>
          ))}
        </ol>
        <p className="fbp-iphone-note">
          <b>Önemli:</b> Uygulamaya hep ana ekrandaki simgeden girin; bildirimler Safari sekmesinden değil oradan çalışır.
          iOS 16.4 veya daha yeni bir sürüm gerekir.
        </p>
        <div className="fbp-cta center">
          <a className="fbp-btn navy" href={FITBRIDGE_WEB_URL} target="_blank" rel="noopener noreferrer">
            <GlobeIcon />
            fitbridge.kartalbric.com
          </a>
        </div>
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
