import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, getTournamentDetail } from "@/lib/data";
import SolverFrame from "./SolverFrame";
import {
  bridgeSolverUrl,
  fmtNum,
  hcp,
  splitContract,
  tricksText,
  type Board,
  type BoardResult,
  type Hand,
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

const cardText = (cards: string) =>
  cards ? cards.split("").map((c) => (c === "T" ? "10" : c)).join(" ") : "—";

function HandView({ seat, hand, dealer, name }: { seat: Seat; hand: Hand; dealer: boolean; name?: string }) {
  return (
    <div className={`hand hand-${seat}`}>
      <div className="hand-head">
        {SEAT_LONG[seat]}
        {dealer && <span className="dealer-tag">Dağıtıcı</span>}
        <span className="hcp">{hcp(hand)} P</span>
      </div>
      {name && <div className="hand-name">{name}</div>}
      {hand.map((cards, i) => (
        <div key={i} className="suit-row">
          <span className={SUITS[i].red ? "red" : undefined}>{SUITS[i].sym}</span>
          <span className="hand-cards">{cardText(cards)}</span>
        </div>
      ))}
    </div>
  );
}

function Diagram({ board, names }: { board: Board; names?: Partial<Record<Seat, string>> }) {
  if (!board.hands) return null;
  const vulNS = board.vul === "NS" || board.vul === "Hep";
  const vulEW = board.vul === "EW" || board.vul === "Hep";
  return (
    <div className="diagram">
      {(["N", "W", "E", "S"] as Seat[]).map((s) => (
        <HandView key={s} seat={s} hand={board.hands![s]} dealer={board.dealer === s} name={names?.[s]} />
      ))}
      <div className={`compass${vulNS ? " vns" : ""}${vulEW ? " vew" : ""}`} aria-label="Pusula">
        <span className="c-n">K</span>
        <span className="c-w">B</span>
        <span className="c-no">{board.no}</span>
        <span className="c-e">D</span>
        <span className="c-s">G</span>
      </div>
    </div>
  );
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
  const pairById = new Map(pairs.map((p) => [p.id, p]));
  const pairName = (pid: number) => pairById.get(pid)?.names.join(" - ") ?? `Çift ${pid}`;
  const base = `/sonuclar/${t.id}`;

  const boardNo = Number(sp.board);
  const board = boards.find((b) => b.no === boardNo);
  const pair = pairById.get(Number(sp.cift));
  const withPair = (no: number) => `${base}?board=${no}${pair ? `&cift=${pair.id}` : ""}`;

  const boardChips = (
    <nav className="chips" aria-label="Boardlar">
      {boards.map((b) => (
        <a key={b.no} href={withPair(b.no)} className={`chip${b.no === board?.no ? " on" : ""}`}>
          {b.no}
        </a>
      ))}
    </nav>
  );

  const head = (
    <div className="res-head">
      <p className="eyebrow">
        <a href="/sonuclar">Sonuç takvimi</a> · {formatDate(t.played_on)}
      </p>
      <h1>{t.title}</h1>
      <p className="muted">
        {pairs.length} çift · {boards.length} board
      </p>
      <div className="view-tabs">
        <a href={base} className={!board && !pair ? "on" : undefined}>Sıralama</a>
        <a href={withPair(board?.no ?? boards[0]?.no ?? 1)} className={board ? "on" : undefined}>
          Boardlar
        </a>
        {pair && (
          <a href={`${base}?cift=${pair.id}`} className={!board ? "on" : undefined}>
            Çift {pair.id}
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
        {boardChips}
        <div className="board-bar">
          {prev ? <a href={withPair(prev.no)} className="cal-step">‹ {prev.no}</a> : <span />}
          <h2>Board {board.no}</h2>
          {next ? <a href={withPair(next.no)} className="cal-step">{next.no} ›</a> : <span />}
        </div>
        <p className="board-info">
          Dağıtıcı: <strong>{SEAT_LONG[board.dealer]}</strong> · Zon: <strong>{VUL_TR[board.vul]}</strong>
          {mine && <> · Masa {mine.table}, Tur {mine.round}</>}
        </p>

        <div className="board-layout">
          <div className="board-left">
            <h3>Tüm masalar</h3>
            <div className="table-wrap">
              <table className="res-table traveller">
                <thead>
                  <tr>
                    <th colSpan={2} className="grp">Çift</th>
                    <th rowSpan={2}>Kont.</th>
                    <th rowSpan={2}>Oyn.</th>
                    <th rowSpan={2}>Sonuç</th>
                    <th colSpan={2} className="grp">Skor</th>
                    <th colSpan={2} className="grp">%</th>
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
                          <a href={`${base}?board=${board.no}&cift=${pid}`} title={pairName(pid)}>
                            {(pairById.get(pid)?.names ?? [`Çift ${pid}`]).map((n, k) => (
                              <span key={k}>{shortName(n)}</span>
                            ))}
                          </a>
                        </td>
                      ))}
                      <td><Contract r={r} /></td>
                      <td>{r.declarer ? SEAT_TR[r.declarer] : ""}</td>
                      <td>{resultText(r)}</td>
                      <td className="num">{score(r.scoreNS, "NS")}</td>
                      <td className="num">{score(r.scoreNS, "EW")}</td>
                      <td className="num strong">{r.pctNS}</td>
                      <td className="num strong">{r.pctEW}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted small">Bir çiftin adına dokununca o masanın oyuncuları ellerde görünür.</p>
          </div>

          <div className="board-right">
            {solver ? (
              <>
                {/* Telefonda Bridge Solver dar ekrana sığmadığı için önce kendi diyagramımız */}
                <div className="mobile-only">
                  <Diagram board={board} names={names} />
                </div>
                <div className="desktop-only">
                  <SolverFrame src={solver} title={`Board ${board.no} double dummy analizi`} />
                </div>
                <a className="solver-link" href={solver} target="_blank" rel="noopener noreferrer">
                  Bridge Solver&apos;da aç: double dummy analizi, kart kart oyna ›
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
              Çift {pair.id} · %{fmtNum(pair.pct, 2)}
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
                <th className="num">%</th>
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
                    <td>{resultText(r)}</td>
                    <td className="num">{sc}</td>
                    <td className="num strong">{ns ? r.pctNS : r.pctEW}</td>
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
      {(["NS", "EW"] as const).map((dir) => (
        <section key={dir} className="rank-block">
          <h2>{dir === "NS" ? "Kuzey - Güney" : "Doğu - Batı"}</h2>
          <div className="table-wrap">
            <table className="res-table ranking">
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>No</th>
                  <th>Oyuncular</th>
                  <th className="num">%</th>
                </tr>
              </thead>
              <tbody>
                {group(dir).map((p) => (
                  <tr key={p.id} className={p.rank <= 3 ? `podium p${p.rank}` : undefined}>
                    <td className="rank">{p.rank}</td>
                    <td>{p.id}</td>
                    <td className="names">
                      <a href={`${base}?cift=${p.id}`}>
                        {p.names.map((n, k) => (
                          <span key={k}>{n}</span>
                        ))}
                      </a>
                    </td>
                    <td className="num strong">{fmtNum(p.pct, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <section className="rank-block">
        <h2>Boardlar</h2>
        <p className="muted small">Board numarasına dokunarak elleri ve tüm masaların sonuçlarını görebilirsiniz.</p>
        {boardChips}
      </section>
    </>
  );
}
