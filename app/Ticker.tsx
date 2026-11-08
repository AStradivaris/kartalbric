// Logonun altında soldan sağa kayan, tıklanınca bağlantıya giden duyuru şeridi.
export default function Ticker({ text, href }: { text: string; href: string }) {
  const external = /^https?:\/\//.test(href) && !href.startsWith("https://www.kartalbric.com");
  // Uzun metinler daha uzun sürede kayar ki okunabilsin.
  const seconds = Math.max(14, Math.round(text.length * 0.32));
  const cta = href.includes("/kayit/") ? "Kayıt ol" : "Detaylar";
  const item = (
    <span className="ticker-item">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      </svg>
      {text}
      <span className="ticker-cta">{cta} &rarr;</span>
    </span>
  );
  return (
    <a
      href={href}
      className="ticker"
      aria-label={text}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="ticker-track" style={{ animationDuration: `${seconds}s` }} aria-hidden="true">
        {item}
        {item}
        {item}
        {item}
      </span>
    </a>
  );
}
