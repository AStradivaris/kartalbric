"use client";

import { useEffect, useState } from "react";

const KEY = "fitbridge-promo-closed";

// Sağ altta, sayfa aşağı kaydırılınca kayarak çıkan FitBridge tanıtım kartı.
// Kapatılırsa o ziyaret boyunca bir daha görünmez.
export default function FitBridgePromo() {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(true);

  useEffect(() => {
    let wasClosed = false;
    try {
      wasClosed = sessionStorage.getItem(KEY) === "1";
    } catch {
      /* gizli sekme vb.: kart yine çalışır */
    }
    setClosed(wasClosed);
    if (wasClosed) return;

    const onScroll = () => setVisible(window.scrollY > Math.min(480, window.innerHeight * 0.6));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function close() {
    setClosed(true);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* yok say */
    }
  }

  if (closed) return null;

  return (
    <aside className={`fb-promo${visible ? " show" : ""}`} aria-label="FitBridge tanıtımı" aria-hidden={!visible}>
      <button className="fb-close" onClick={close} aria-label="Tanıtımı kapat" tabIndex={visible ? 0 : -1}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <a href="/fitbridge" className="fb-link" target="_blank" rel="noopener" tabIndex={visible ? 0 : -1}>
        <img src="/fitbridge-logo.png" alt="" width={265} height={128} className="fb-logo" />
        <span className="fb-text">
          <span className="fb-name">FitBridge</span>
          <span className="fb-slogan">Ortağınla ihale pratiği yap, sistemini birlikte kur.</span>
          <span className="fb-cta">Hemen dene &rarr;</span>
        </span>
      </a>
    </aside>
  );
}
