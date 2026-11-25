import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, getTournamentDetail } from "@/lib/data";
import SolverFrame from "./SolverFrame";
import BoardSelect from "./BoardSelect";
import {
  bridgeSolverUrl,
  fmtNum,
  splitContract,
  tricksText,
  type Board,
  type BoardResult,
  type Pair,
  type Seat,
} from "@/lib/bridge-results";

export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ board?: string; cift?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = await getTournamentDetail(id);
  if (!t) return { title: "Sonuç bulunamadı" };
  return {
    title: `${t.title} · ${formatDate(t.played_on)}`,
    description: `${t.title} (${formatDate(t.played_on)}) sonuçları: sıralama, board sonuçları ve eller.`,
    alternates: { canonical: `/sonuclar/${t.id}` },
  };
}

const SEAT_TR: Record<Seat, string> = { N: "K", E: "D", S: "G", W: "B" };
const SEAT_LONG: Record<Seat, string> = { N: "Kuzey", E: "Doğu", S: "Güney", W: "Batı" };
const VUL_TR: Record<Board["vul"], string> = { "-": "Hiçbiri", NS: "K-G", EW: "D-B", Hep: "Herkes" };
const SUITS = [
  { sym: "♠︎", red: false },
  { sym: "♥︎", red: true },
  { sym: "♦︎", red: true },
  { sym: "♣︎", red: false },
];
const STRAIN: Record<string, { sym: string; red: boolean }> = {
  S: SUITS[0],
  H: SUITS[1],
  D: SUITS[2],
  C: SUITS[3],
  N: { sym: "SA", red: false },
};

function Contract({ r }: { r: BoardResult }) {
  if (r.adjusted) return <span className="muted">Ayarlı ({r.adjusted})</span>;
  if (r.contract === "Pass") return <span>Pas</span>;
  const c = splitContract(r.contract);
  if (!c) return <span>{r.contract || "-"}</span>;
  const s = STRAIN[c.suit];
  return (
    <span className="contract">
      {c.level}
      <span className={s.red ? "red" : undefined}>{s.sym}</span>
      {c.dbl && <span className="dbl">{c.dbl}</span>}
    </span>
  );
}

// Sonuç sütunu: "=", "+1", "-2" (pas ve ayarlı skorda boş)
const resultText = (r: BoardResult) =>
  r.contract === "Pass" || r.adjusted ? "" : tricksText(r.contract, r.tricks) || String(r.tricks ?? "");

// "Murat GÜNGÖR" -> "M. GÜNGÖR", "Hüseyin Cahit MOĞULTAY" -> "H. C. MOĞULTAY"
const shortName = (n: string) => {
  const w = n.split(" ");
  return w.length < 2 ? n : [...w.slice(0, -1).map((x) => `${x[0]}.`), w[w.length - 1]].join(" ");
};

// Sonuç: batık (-) kırmızı, fazla löve (+) yeşil, tam (=) mavi
function Res({ r }: { r: BoardResult }) {
  const t = resultText(r);
  if (!t) return null;
  const cls = t.startsWith("-") ? "res-down" : t.startsWith("+") ? "res-up" : t === "=" ? "res-eq" : "";
  return <span className={`res ${cls}`}>{t}</span>;
}

// Yüzde rozeti
//  board yüzdesi: 0-24 kırmızı, 25-49 açık turuncu, 50-69 sarı, 70+ yeşil
//  genel sıralama (total): 55+ yeşil, 45-55 turuncu, 45 altı kırmızı
function Pct({ v, total }: { v: number; total?: boolean }) {
  const cls = total
    ? v >= 55 ? "good" : v >= 45 ? "low" : "bad"
    : v >= 70 ? "good" : v >= 50 ? "mid" : v >= 25 ? "low" : "bad";
  return <span className={`pct ${cls}`}>{fmtNum(v, total ? 2 : 0)}</span>;
}

// IMP rozeti (Lehman): artı yeşil, eksi kırmızı, sıfır sarı
function Imp({ v }: { v: number | undefined }) {
  const x = v ?? 0;
  const txt = x.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  return <span className={`pct ${x > 0 ? "good" : x < 0 ? "bad" : "mid"}`}>{x > 0 ? `+${txt}` : txt}</span>;
}

// K-G'nin puanı artıysa K-G sütununda, eksiyse D-B sütununda gösterilir.
function score(n: number | null, side: "NS" | "EW") {
  if (n === null) return "";
  if (side === "NS") return n > 0 ? String(n) : n === 0 ? "0" : "";
  return n < 0 ? String(-n) : "";
}

export default async function TournamentPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const t = await getTournamentDetail(id);
  if (!t) notFound();

  const { pairs, boards } = t.data;
  const lehman = t.data.kind === "lehman";
  const unit = lehman ? "IMP" : "%";
  // Board satırında taraf puanı: Lehman'da IMP, eşlide yüzde
  const sideScore = (r: BoardResult, side: "NS" | "EW") =>
    lehman ? <Imp v={side === "NS" ? r.impNS : r.impEW} /> : <Pct v={side === "NS" ? r.pctNS : r.pctEW} />;
  const pairById = new Map(pairs.map((p) => [p.id, p]));
  const pairName = (pid: number) => pairById.get(pid)?.names.join(" - ") ?? `Çift ${pid}`;
  const base = `/sonuclar/${t.id}`;

  const boardNo = Number(sp.board);
  const board = boards.find((b) => b.no === boardNo);
  const pair = pairById.get(Number(sp.cift));
  const withPair = (no: number) => `${base}?board=${no}${pair ? `&cift=${pair.id}` : ""}`;

  const head = (
    <div className="res-head">
      <p className="eyebrow">
        <a href="/sonuclar">Sonuç takvimi</a> · {formatDate(t.played_on)}
      </p>
      <h1>{t.title}</h1>
      <p className="muted">
        {lehman
          ? `Lehman · ${t.data.players?.length ?? pairs.length * 2} oyuncu · ${pairs.length / 2} masa · ${boards.length} board`
          : `${pairs.length} çift · ${boards.length} board`}
      </p>
      <div className="view-tabs">
        <a href={base} className={!board && !pair ? "on" : undefined}>Sıralama</a>
        <a href={withPair(board?.no ?? boards[0]?.no ?? 1)} className={board ? "on" : undefined}>
          Boardlar
        </a>
        {pair && (
          <a href={`${base}?cift=${pair.id}`} className={`pair-tab${!board ? " on" : ""}`}>
            {board ? "‹ Çift özetine dön: " : ""}
            {pair.names.join(" - ")}
          </a>
        )}
      </div>
    </div>
  );

  // ---- Board görünümü: solda tüm masalar, sağda Bridge Solver ----
  if (board) {
    const i = boards.indexOf(board);
    const prev = boards[i - 1];
    const next = boards[i + 1];
    // Seçili çiftin oynadığı masa: isimler ellere yazılır, satır vurgulanır.
    const mine = pair ? board.results.find((r) => r.ns === pair.id || r.ew === pair.id) : undefined;
    let names: Partial<Record<Seat, string>> | undefined;
    if (mine) {
      const ns = pairById.get(mine.ns)?.names ?? [];
      const ew = pairById.get(mine.ew)?.names ?? [];
      // Skor programındaki sıra: K-G çiftinde 1. isim Kuzey, D-B çiftinde 1. isim Doğu.
      names = { N: ns[0], S: ns[1], E: ew[0], W: ew[1] };
    }
    const solver = bridgeSolverUrl(board, names);

    return (
      <>
        {head}
        <div className="board-bar">
          {prev ? <a href={withPair(prev.no)} className="cal-step">‹ {prev.no}</a> : <span />}
          <BoardSelect
            boards={boards.map((b) => b.no)}
            current={board.no}
            hrefBase={withPair(0).replace("board=0", "board=__B__")}
          />
          {next ? <a href={withPair(next.no)} className="cal-step">{next.no} ›</a> : <span />}
        </div>
        <p className="board-info">
          Dağıtıcı: <strong>{SEAT_LONG[board.dealer]}</strong> · Zon: <strong>{VUL_TR[board.vul]}</strong>
          {mine && <> · Masa {mine.table}{lehman ? "" : `, Tur ${mine.round}`}</>}
        </p>

        <div className="board-layout">
          <div className="board-left">
            <h3>Tüm masalar</h3>
            <div className="table-wrap desktop-only">
              <table className="res-table traveller">
                <thead>
                  <tr>
                    <th colSpan={2} className="grp">Çift</th>
                    <th rowSpan={2}>Kont.</th>
                    <th rowSpan={2}>Oyn.</th>
                    <th rowSpan={2}>Sonuç</th>
                    <th colSpan={2} className="grp">Skor</th>
                    <th colSpan={2} className="grp">{unit}</th>
                  </tr>
                  <tr>
                    <th>K-G</th>
                    <th>D-B</th>
                    <th className="num">K-G</th>
                    <th className="num">D-B</th>
                    <th className="num">K-G</th>
                    <th className="num">D-B</th>
                  </tr>
                </thead>
                <tbody>
                  {board.results.map((r, k) => (
                    <tr key={k} className={r === mine ? "mine" : undefined}>
                      {[r.ns, r.ew].map((pid) => (
                        <td key={pid} className="tr-names">
                          <a href={`${base}?cift=${pid}`} title={`${pairName(pid)}: çift özeti`}>
                            {(pairById.get(pid)?.names ?? [`Çift ${pid}`]).map((n, k) => (
                              <span key={k}>{shortName(n)}</span>
                            ))}
                          </a>
                        </td>
                      ))}
                      <td><Contract r={r} /></td>
                      <td>{r.declarer ? SEAT_TR[r.declarer] : ""}</td>
                      <td><Res r={r} /></td>
                      <td className="num">{score(r.scoreNS, "NS")}</td>
                      <td className="num">{score(r.scoreNS, "EW")}</td>
                      <td className="num">{sideScore(r, "NS")}</td>
                      <td className="num">{sideScore(r, "EW")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Telefon: kaydırmadan sığan sade tablo */}
            <div className="table-wrap mobile-only">
              <table className="res-table traveller-m">
                <thead>
                  <tr>
                    <th>K-G</th>
                    <th>D-B</th>
                    <th>Kontrat</th>
                    <th className="num">Skor</th>
                    <th className="num">{unit}</th>
                  </tr>
                </thead>
                <tbody>
                  {board.results.map((r, k) => (
                    <tr key={k} className={r === mine ? "mine" : undefined}>
                      {[r.ns, r.ew].map((pid) => (
                        <td key={pid} className="tr-names">
                          <a href={`${base}?cift=${pid}`}>
                            {(pairById.get(pid)?.names ?? [`Çift ${pid}`]).map((n, j) => (
                              <span key={j}>{shortName(n)}</span>
                            ))}
                          </a>
                        </td>
                      ))}
                      <td className="m-contract">
                        <Contract r={r} /> {r.declarer ? SEAT_TR[r.declarer] : ""} <Res r={r} />
                      </td>
                      <td className="num">{r.scoreNS === null ? "" : r.scoreNS > 0 ? `+${r.scoreNS}` : r.scoreNS}</td>
                      <td className="num m-pct">
                        {sideScore(r, "NS")}
                        {sideScore(r, "EW")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted small">Bir çiftin adına dokununca o çiftin özeti açılır.</p>
          </div>

          <div className="board-right">
            {solver ? (
              <>
                <SolverFrame src={solver} title={`Board ${board.no} double dummy analizi`} />
                <a className="solver-link" href={solver} target="_blank" rel="noopener noreferrer">
                  Bridge Solver&apos;ı tam ekran aç ›
                </a>
              </>
            ) : (
              <p className="muted">Bu board&apos;un elleri yüklenmemiş.</p>
            )}
          </div>
        </div>
      </>
    );
  }

  // ---- Çift görünümü ----
  if (pair) {
    const rows = boards
      .map((b) => {
        const r = b.results.find((x) => x.ns === pair.id || x.ew === pair.id);
        return r ? { b, r, ns: r.ns === pair.id } : null;
      })
      .filter((x): x is { b: Board; r: BoardResult; ns: boolean } => x !== null)
      .sort((a, b) => a.r.round - b.r.round || a.b.no - b.b.no);
    return (
      <>
        {head}
        <div className="pair-card">
          <div className="pair-rank">
            {pair.rank}.<span>{pair.dir === "NS" ? "K-G" : "D-B"}</span>
          </div>
          <div>
            <h2>{pair.names.join(" - ")}</h2>
            <p className="muted">
              {lehman ? (
                <>
                  Masa {pair.table} · {pair.dir === "NS" ? "Kuzey-Güney" : "Doğu-Batı"} · <Imp v={pair.imp} /> IMP
                </>
              ) : (
                <>Çift {pair.id} · %{fmtNum(pair.pct, 2)}</>
              )}
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="res-table pair-table">
            <thead>
              <tr>
                <th>Tur</th>
                <th>Board</th>
                <th>Rakip</th>
                <th>Kont.</th>
                <th>Oyn.</th>
                <th>Sonuç</th>
                <th className="num">Skor</th>
                <th className="num">{unit}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ b, r, ns }) => {
                const opp = ns ? r.ew : r.ns;
                const sc = r.scoreNS === null ? "" : String(ns ? r.scoreNS : -r.scoreNS);
                const href = `${base}?board=${b.no}&cift=${pair.id}`;
                return (
                  <tr key={b.no}>
                    <td>{r.round}</td>
                    <td>
                      <a href={href} className="board-link">{b.no}</a>
                    </td>
                    <td className="opp">
                      <a href={`${base}?cift=${opp}`}>{pairName(opp)}</a>
                    </td>
                    <td>
                      <a href={href} className="plain">
                        <Contract r={r} />
                      </a>
                    </td>
                    <td>{r.declarer ? SEAT_TR[r.declarer] : ""}</td>
                    <td><Res r={r} /></td>
                    <td className="num">{sc}</td>
                    <td className="num">{sideScore(r, ns ? "NS" : "EW")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small">Board numarasına dokununca eller ve double dummy analizi açılır.</p>
      </>
    );
  }

  // ---- Sıralama görünümü ----
  const group = (dir: Pair["dir"]) => pairs.filter((p) => p.dir === dir).sort((a, b) => a.rank - b.rank);
  return (
    <>
      {head}
      {lehman && (
        <section className="rank-block">
          <h2>Masalar</h2>
          <p className="muted small" style={{ margin: "-4px 0 12px" }}>
            Oyuncu adına dokununca Lehman grafiği ve istatistikleri, IMP sayısına dokununca çiftin board sonuçları açılır.
          </p>
          <div className="table-wrap">
            <table className="res-table match-table">
              <thead>
                <tr>
                  <th>Masa</th>
                  <th>Kuzey - Güney</th>
                  <th className="num">IMP</th>
                  <th>Doğu - Batı</th>
                  <th className="num">IMP</th>
                </tr>
              </thead>
              <tbody>
                {[...new Set(pairs.map((p) => p.table ?? 0))]
                  .sort((a, b) => a - b)
                  .map((tno) => {
                    const ns = pairs.find((p) => p.table === tno && p.dir === "NS");
                    const ew = pairs.find((p) => p.table === tno && p.dir === "EW");
                    if (!ns || !ew) return null;
                    const nsWin = (ns.impFor ?? 0) > (ew.impFor ?? 0);
                    const ewWin = (ew.impFor ?? 0) > (ns.impFor ?? 0);
                    return (
                      <tr key={tno}>
                        <td className="rank">{tno}</td>
                        <td className="names">
                          <span className="pl-links">
                            {ns.names.map((n, k) => (
                              <a key={k} href={`/sonuclar/oyuncu?ad=${encodeURIComponent(n)}`}>{n}</a>
                            ))}
                          </span>
                        </td>
                        <td className={`num imp-total${nsWin ? " win" : ""}`}>
                          <a href={`${base}?cift=${ns.id}`} title="Çift özeti">{fmtNum(ns.impFor ?? 0, 2)}</a>
                        </td>
                        <td className="names">
                          <span className="pl-links">
                            {ew.names.map((n, k) => (
                              <a key={k} href={`/sonuclar/oyuncu?ad=${encodeURIComponent(n)}`}>{n}</a>
                            ))}
                          </span>
                        </td>
                        <td className={`num imp-total${ewWin ? " win" : ""}`}>
                          <a href={`${base}?cift=${ew.id}`} title="Çift özeti">{fmtNum(ew.impFor ?? 0, 2)}</a>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {!lehman && (["NS", "EW"] as const).map((dir) => (
        <section key={dir} className="rank-block">
          <h2>{dir === "NS" ? "Kuzey - Güney" : "Doğu - Batı"}</h2>
          <div className="table-wrap">
            <table className="res-table ranking">
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>Oyuncular</th>
                  <th className="num">{unit}</th>
                </tr>
              </thead>
              <tbody>
                {group(dir).map((p) => (
                  <tr key={p.id} className={p.rank <= 3 ? `podium p${p.rank}` : undefined}>
                    <td className="rank">{p.rank}</td>
                    <td className="names">
                      <a href={`${base}?cift=${p.id}`}>
                        {p.names.map((n, k) => (
                          <span key={k}>{n}</span>
                        ))}
                      </a>
                    </td>
                    <td className="num">{lehman ? <Imp v={p.imp} /> : <Pct v={p.pct} total />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
