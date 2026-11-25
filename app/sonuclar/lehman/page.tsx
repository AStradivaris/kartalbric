import type { Metadata } from "next";
import { getLehmanTournaments } from "@/lib/data";
import { lehmanMonths, monthlyRanking } from "@/lib/lehman-stats";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Lehman sıralaması",
  description: "Kartal Briç Spor Kulübü aylık Lehman sıralaması.",
  alternates: { canonical: "/sonuclar/lehman" },
};

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signed = (n: number) => `${n > 0 ? "+" : ""}${fmt(n)}`;

type Props = { searchParams: Promise<{ y?: string; m?: string }> };

export default async function LehmanRankingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const list = await getLehmanTournaments();
  const months = lehmanMonths(list);

  let y = Number(sp.y);
  let m = Number(sp.m);
  if (!(y >= 2000 && m >= 1 && m <= 12)) {
    // Ay seçilmediyse Lehman oynanmış en son ay
    const latest = months[0];
    if (latest) [y, m] = latest.split("-").map(Number);
    else {
      const now = new Date();
      y = now.getFullYear();
      m = now.getMonth() + 1;
    }
  }
  const rows = monthlyRanking(list, y, m);
  const key = `${y}-${String(m).padStart(2, "0")}`;
  const older = months.find((x) => x < key);
  const newer = [...months].reverse().find((x) => x > key);
  const link = (ym: string) => `/sonuclar/lehman?y=${Number(ym.slice(0, 4))}&m=${Number(ym.slice(5, 7))}`;
  const sessions = list.filter((t) => t.played_on.startsWith(key)).length;

  return (
    <>
      <div className="res-head">
        <p className="eyebrow">
          <a href="/sonuclar">Sonuç takvimi</a> · Lehman
        </p>
        <h1>Lehman sıralaması</h1>
      </div>

      <div className="cal-bar">
        {older ? (
          <a className="cal-step" href={link(older)} aria-label="Önceki ay">
            ‹ <span>{MONTHS[Number(older.slice(5, 7)) - 1]}</span>
          </a>
        ) : (
          <span />
        )}
        <h2>
          {MONTHS[m - 1]} {y}
        </h2>
        {newer ? (
          <a className="cal-step" href={link(newer)} aria-label="Sonraki ay">
            <span>{MONTHS[Number(newer.slice(5, 7)) - 1]}</span> ›
          </a>
        ) : (
          <span />
        )}
      </div>

      {rows.length === 0 ? (
        <p className="muted">Bu ay oynanmış Lehman partisi yok.</p>
      ) : (
        <>
          <p className="muted small" style={{ margin: "0 0 12px", textAlign: "center" }}>
            {sessions} parti · {rows.length} oyuncu · Lehman ay içindeki son puandır
          </p>
          <div className="table-wrap">
            <table className="res-table lehman-month">
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>Oyuncu</th>
                  <th className="num">Maç</th>
                  <th className="num imp-col">IMP</th>
                  <th className="num">Değişim</th>
                  <th className="num">Lehman</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const href = `/sonuclar/oyuncu?ad=${encodeURIComponent(r.name)}`;
                  return (
                    <tr key={r.name} className={`row-link${i < 3 ? ` podium p${i + 1}` : ""}`}>
                      <td className="rank"><a href={href} className="cell-link">{i + 1}</a></td>
                      <td className="lm-name"><a href={href} className="cell-link">{r.name}</a></td>
                      <td className="num"><a href={href} className="cell-link">{r.matches}</a></td>
                      <td className="num imp-col">
                        <a href={href} className="cell-link">
                          <span className={`pct ${r.imp > 0 ? "good" : r.imp < 0 ? "bad" : "mid"}`}>{signed(r.imp)}</span>
                        </a>
                      </td>
                      <td className="num">
                        <a href={href} className="cell-link">
                          {r.change === null ? (
                            <span className="muted">-</span>
                          ) : (
                            <span className={r.change >= 0 ? "res-up" : "res-down"} style={{ fontWeight: 700 }}>
                              {signed(r.change)}
                            </span>
                          )}
                        </a>
                      </td>
                      <td className="num"><a href={href} className="cell-link"><strong>{fmt(r.lehman)}</strong></a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted small">
            Değişim, oyuncunun bu aydan önceki son puanına göredir. Daha önce sitede maçı yoksa ayın ilk maçından itibaren
            hesaplanır. Oyuncuya dokununca Lehman grafiği ve istatistikleri açılır.
          </p>
        </>
      )}
    </>
  );
}
