import type { Metadata } from "next";
import { getLatestTournamentDate, getSettings, getTournamentsBetween, type TournamentListItem } from "@/lib/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sonuç takvimi",
  description: "Kartal Briç Spor Kulübü turnuva sonuçları: sıralamalar, board sonuçları ve eller.",
  alternates: { canonical: "/sonuclar" },
};

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const pad = (n: number) => String(n).padStart(2, "0");

function istanbulToday(): { y: number; m: number; d: number } {
  const [y, m, d] = new Date()
    .toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" })
    .split("-")
    .map(Number);
  return { y, m, d };
}

type Props = { searchParams: Promise<{ y?: string; m?: string }> };

export default async function SonuclarPage({ searchParams }: Props) {
  const sp = await searchParams;
  const today = istanbulToday();

  let y = Number(sp.y);
  let m = Number(sp.m);
  if (!(y >= 2000 && y <= 2100 && m >= 1 && m <= 12)) {
    // Ay seçilmediyse en son turnuvanın ayı açılır.
    const latest = await getLatestTournamentDate();
    if (latest) {
      [y, m] = latest.split("-").map(Number);
    } else {
      y = today.y;
      m = today.m;
    }
  }

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Pazartesi = 0
  const [items, settings] = await Promise.all([
    getTournamentsBetween(`${y}-${pad(m)}-01`, `${y}-${pad(m)}-${pad(daysInMonth)}`),
    getSettings(),
  ]);

  const byDay = new Map<number, TournamentListItem[]>();
  for (const t of items) {
    const d = Number(t.played_on.slice(8, 10));
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(t);
  }

  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const external =
    settings.results_url && /^https?:\/\//.test(settings.results_url) ? settings.results_url : null;

  return (
    <>
      <div className="res-head">
        <p className="eyebrow">Turnuva sonuçları</p>
        <h1>Sonuç takvimi</h1>
      </div>

      <div className="cal-bar">
        <a className="cal-step" href={`/sonuclar?y=${prev.y}&m=${prev.m}`} aria-label="Önceki ay">
          ‹ <span>{MONTHS[prev.m - 1]}</span>
        </a>
        <h2>
          {MONTHS[m - 1]} {y}
        </h2>
        <a className="cal-step" href={`/sonuclar?y=${next.y}&m=${next.m}`} aria-label="Sonraki ay">
          <span>{MONTHS[next.m - 1]}</span> ›
        </a>
      </div>

      <div className="cal" role="grid" aria-label={`${MONTHS[m - 1]} ${y} takvimi`}>
        {DAYS.map((d, k) => (
          <div key={d} className="cal-dow" role="columnheader">
            <span className="long">{d}</span>
            <span className="short">{DAYS_SHORT[k]}</span>
          </div>
        ))}
        {cells.map((d, i) => {
          const list = d ? byDay.get(d) ?? [] : [];
          const isToday = d === today.d && m === today.m && y === today.y;
          return (
            <div
              key={i}
              role="gridcell"
              className={`cal-cell${d ? "" : " empty"}${isToday ? " today" : ""}${list.length ? " has" : ""}`}
            >
              {d && <span className="cal-day">{d}</span>}
              {list.map((t) => (
                <a key={t.id} href={`/sonuclar/${t.id}`} className="cal-event" title={t.title}>
                  {t.title}
                </a>
              ))}
            </div>
          );
        })}
      </div>

      {external && (
        <p className="muted" style={{ marginTop: 24 }}>
          <a href={external} target="_blank" rel="noopener noreferrer" className="inline-link">
            Diğer sonuçlar (Vugraph) ›
          </a>
        </p>
      )}
    </>
  );
}
