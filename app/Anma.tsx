// 10 Kasım anma bölümü: her yıl 10 Kasım günü (İstanbul saatiyle) ana sayfada kendiliğinden görünür.
export function isAnmaDay(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  return day === 10 && month === 11;
}

export default function Anma() {
  const year = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", year: "numeric" }).format(new Date())
  );
  const nth = year - 1938;
  const message = `Gazi Mustafa Kemal Atatürk'ü aramızdan ayrılışının ${nth}. yılında saygı, sevgi ve özlemle anıyoruz.`;

  // Bu yılın afişi varsa (2026) afişi gösterir; diğer yıllarda yazılı anma metni çıkar.
  if (year === 2026) {
    return (
      <section className="anma anma-poster" aria-labelledby="anma-baslik">
        <h2 id="anma-baslik" className="sr-only">{message}</h2>
        <img
          src="/anma-10-kasim.jpg"
          width={1080}
          height={1920}
          alt={`10 Kasım 1938, 09.05. ${message} "Benim naçiz vücudum elbet bir gün toprak olacaktır, fakat Türkiye Cumhuriyeti ilelebet payidar kalacaktır." 1881'den sonsuza. Kartal Briç Spor Kulübü.`}
        />
      </section>
    );
  }

  return (
    <section className="anma" aria-labelledby="anma-baslik">
      <div className="anma-inner">
        <p className="anma-date">10 Kasım 1938 · 09.05</p>
        <h2 id="anma-baslik" className="anma-title">
          Gazi Mustafa Kemal Atatürk&apos;ü
          <br />
          vefatının {nth}. yılında saygı, sevgi ve özlemle anıyoruz.
        </h2>
        <p className="anma-quote">
          &ldquo;Benim naçiz vücudum elbet bir gün toprak olacaktır, fakat Türkiye Cumhuriyeti ilelebet payidar
          kalacaktır.&rdquo;
        </p>
        <p className="anma-years" aria-label="1881'den sonsuza">
          1881 <span aria-hidden="true">–</span> <span className="anma-inf" aria-hidden="true">∞</span>
        </p>
        <p className="anma-sign">Kartal Briç Spor Kulübü</p>
      </div>
    </section>
  );
}
