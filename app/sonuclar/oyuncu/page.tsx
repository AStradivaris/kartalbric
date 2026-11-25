import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, getLehmanTournaments } from "@/lib/data";
import { personAvg, playerStats, type PlayerMatch, type PlayerStats } from "@/lib/lehman-stats";

export const revalidate = 60;

type Props = { searchParams: Promise<{ ad?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { ad } = await searchParams;
  return { title: ad ? `${ad} · Lehman istatistikleri` : "Lehman istatistikleri", robots: { index: false } };
}

const fmt = (n: number, d = 2) => n.toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = (n: number, d = 2) => `${n > 0 ? "+" : ""}${fmt(n, d)}`;
const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
// Aynı gün birden çok parti varsa tarihe parti numarası eklenir: "24 Kas-2"
function dateLabels(matches: PlayerMatch[]): string[] {
  const seen = new Map<string, number>();
  const total = new Map<string, number>();
  for (const m of matches) total.set(m.date, (total.get(m.date) ?? 0) + 1);
  return matches.map((m) => {
    const k = (seen.get(m.date) ?? 0) + 1;
    seen.set(m.date, k);
    return (total.get(m.date) ?? 1) > 1 ? `${shortDate(m.date)}-${k}` : shortDate(m.date);
  });
}
const playerHref = (n: string) => `/sonuclar/oyuncu?ad=${encodeURIComponent(n)}`;

// Lehman puanının maçtan maça seyri: tek seri, çizgi + noktalar.
// Puanlar dar bir aralıkta (45-60) değiştiği için sıfırdan başlayan çubuk yerine çizgi kullanılır.
function LehmanChart({ matches }: { matches: PlayerMatch[] }) {
  const W = 480;
  const H = 230;
  const pad = { l: 34, r: 22, t: 26, b: 30 };
  const vals = matches.map((m) => m.lehman);
  let lo = Math.floor(Math.min(...vals) - 0.5);
  let hi = Math.ceil(Math.max(...vals) + 0.5);
  if (hi - lo < 4) {
    const mid = (hi + lo) / 2;
    lo = Math.floor(mid - 2);
    hi = Math.ceil(mid + 2);
  }
  const n = matches.length;
  const x = (i: number) => (n === 1 ? (pad.l + W - pad.r) / 2 : pad.l + (i * (W - pad.l - pad.r)) / (n - 1));
  const y = (v: number) => pad.t + ((hi - v) * (H - pad.t - pad.b)) / (hi - lo);
  const step = Math.max(1, Math.ceil((hi - lo) / 5));
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) ticks.push(v);
  const maxI = vals.indexOf(Math.max(...vals));
  const minI = vals.indexOf(Math.min(...vals));
  const labelled = new Set([n - 1, maxI, minI, 0]);
  const xEvery = Math.max(1, Math.ceil(n / 6));
  const labels = dateLabels(matches);
  const path = matches.map((m, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(m.lehman).toFixed(1)}`).join(" ");

  return (
    <figure className="lehman-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Lehman puanının maçlara göre değişimi">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="grid" />
            <text x={pad.l - 8} y={y(v) + 4} className="axis" textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {n > 1 && <path d={path} className="line" />}
        {matches.map((m, i) => (
          <g key={i} className="pt">
            <circle cx={x(i)} cy={y(m.lehman)} r={14} className="hit">
              <title>
                {`${formatDate(m.date)} · ${m.title}\nLehman ${fmt(m.lehman)}${m.change !== null ? ` (${signed(m.change)})` : ""}\nIMP ${signed(m.net)}`}
              </title>
            </circle>
            <circle cx={x(i)} cy={y(m.lehman)} r={5} className="dot" />
            {labelled.has(i) && (
              <text x={x(i)} y={y(m.lehman) - 12} className="val" textAnchor="middle">
                {fmt(m.lehman)}
              </text>
            )}
            {(i % xEvery === 0 || i === n - 1) && (
              <text x={x(i)} y={H - 10} className="axis" textAnchor="middle">
                {labels[i]}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  );
}

function Person({ s, withAvg }: { s: { name: string; count: number } | null; withAvg?: number | null }) {
  if (!s) return <span className="muted">-</span>;
  return (
    <>
      <a href={playerHref(s.name)}>{s.name}</a>{" "}
      <span className="muted">
        {withAvg !== undefined && withAvg !== null ? `(${signed(withAvg)} lehman/maç)` : `(${s.count})`}
      </span>
    </>
  );
}

function StatsTable({ st }: { st: PlayerStats }) {
  const rows: [string, React.ReactNode][] = [
    ["Oynadığı maç sayısı", st.matches.length],
    ["Kazandığı maç sayısı", st.won],
    ["Kaybettiği maç sayısı", st.lost],
    ["Lehman'ın arttığı maç sayısı", st.up],
    ["Lehman'ın azaldığı maç sayısı", st.down],
    ["Aldığı ortalama IMP", fmt(st.avgFor)],
    ["Verdiği ortalama IMP", fmt(st.avgAgainst)],
    ["Ortalama Lehman değişimi", st.avgChange === null ? <span className="muted">-</span> : `${signed(st.avgChange)} lehman/maç`],
    ["En çok oynadığı ortak", <Person key="mp" s={st.mostPartner} />],
    ["En çok oynadığı rakip", <Person key="mo" s={st.mostOpponent} />],
    ["En başarılı olduğu ortak", <Person key="bp" s={st.bestPartner} withAvg={personAvg(st.bestPartner)} />],
    ["En başarısız olduğu ortak", <Person key="wp" s={st.worstPartner} withAvg={personAvg(st.worstPartner)} />],
    ["En başarılı olduğu rakip", <Person key="bo" s={st.bestOpponent} withAvg={personAvg(st.bestOpponent)} />],
    ["En başarısız olduğu rakip", <Person key="wo" s={st.worstOpponent} withAvg={personAvg(st.worstOpponent)} />],
  ];
  return (
    <div className="table-wrap">
      <table className="res-table stats-table">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <th scope="row">{k}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PlayerPage({ searchParams }: Props) {
  const { ad } = await searchParams;
  if (!ad) notFound();
  const list = await getLehmanTournaments();
  const st = playerStats(list, ad);
  if (!st) notFound();
  const last = st.matches[st.matches.length - 1];
  const labels = dateLabels(st.matches);

  return (
    <>
      <div className="res-head">
        <p className="eyebrow">
          <a href="/sonuclar">Sonuç takvimi</a> · Lehman istatistikleri
        </p>
        <h1>{st.name}</h1>
        <p className="muted">
          Güncel Lehman: <strong className="lehman-now">{fmt(st.current)}</strong> · {st.matches.length} maç
        </p>
        <div className="view-tabs">
          <a href={`/sonuclar/${last.tournamentId}`}>‹ Son turnuvaya dön</a>
        </div>
      </div>

      <section className="rank-block">
        <h2>Lehman grafiği</h2>
        <LehmanChart matches={st.matches} />
        {st.matches.length < 2 && (
          <p className="muted small">
            Grafik ve değişim istatistikleri, oyuncunun sitede yayınlanan Lehman maçları arttıkça dolacak.
          </p>
        )}
      </section>

      <section className="rank-block">
        <h2>İstatistikler</h2>
        <StatsTable st={st} />
      </section>

      <section className="rank-block">
        <h2>Maçları</h2>
        <div className="table-wrap">
          <table className="res-table player-matches">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Ortak</th>
                <th>Rakipler</th>
                <th className="num">IMP</th>
                <th className="num">Lehman</th>
              </tr>
            </thead>
            <tbody>
              {st.matches.map((m, i) => ({ m, label: labels[i] })).reverse().map(({ m, label }) => (
                <tr key={m.tournamentId}>
                  <td>
                    <a href={`/sonuclar/${m.tournamentId}?cift=${m.pairId}`}>{label}</a>
                  </td>
                  <td className="wrap">
                    <a href={playerHref(m.partner)} className="plain-link">{m.partner}</a>
                  </td>
                  <td className="wrap">
                    {m.opponents.map((o, k) => (
                      <a key={k} href={playerHref(o)} className="plain-link block">
                        {o}
                      </a>
                    ))}
                  </td>
                  <td className="num">
                    <span className={`pct ${m.net > 0 ? "good" : m.net < 0 ? "bad" : "mid"}`}>{signed(m.net)}</span>
                  </td>
                  <td className="num">
                    <strong>{fmt(m.lehman)}</strong>
                    {m.change !== null && (
                      <span className={`chg ${m.change >= 0 ? "res-up" : "res-down"}`}>{signed(m.change)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
