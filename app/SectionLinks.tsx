"use client";

import { useEffect } from "react";

// Sayfa içi bağlantılar (#galeri gibi) adres çubuğuna "#..." eklemeden kaydırır.
// Böylece adres hep "kartalbric.com/" kalır ve adres çubuğunda Enter sayfayı yeniler.
export default function SectionLinks() {
  useEffect(() => {
    const clearHash = () => {
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };

    // Başka yerden "#galeri" ile gelindiyse tarayıcı kaydırır; sonra adresi temizleriz.
    const t = window.setTimeout(clearHash, 600);

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!link) return;
      const id = decodeURIComponent(link.getAttribute("href")!.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      clearHash();
    }

    document.addEventListener("click", onClick);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
