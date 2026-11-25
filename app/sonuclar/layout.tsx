import "./sonuclar.css";

export default function SonuclarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="nav res-nav">
        <a href="/" className="brand" aria-label="Kartal Briç ana sayfa">
          <img src="/logo.jpg" alt="Kartal Briç Spor Kulübü logosu" />
          <span>Kartal Briç</span>
        </a>
        <nav className="nav-links">
          <a href="/">Ana sayfa</a>
          <a href="/sonuclar">Sonuç takvimi</a>
        </nav>
      </header>
      <main className="res-wrap">{children}</main>
      <footer className="footer res-footer">
        <span>Kartal Briç Spor Kulübü</span>
        <span>Kuruluş 2002</span>
      </footer>
    </>
  );
}
