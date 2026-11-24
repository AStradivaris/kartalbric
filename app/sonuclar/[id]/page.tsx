import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, getTournamentDetail } from "@/lib/data";
import {
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
  { sym: "\u2660\uFE0E", red: false },
  { sym: "\u2665\uFE0E", red: true },
  { sym: "\u2666\uFE0E", red: true },
  { sym: "\u2663\uFE0E", red: false },
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

function HandView({ seat, hand, dealer }: { seat: Seat; hand: Hand; dealer: boolean }) {
  return (
    <div className={`hand hand-${seat}`}>
      <div className="hand-head">
        {SEAT_LONG[seat]}
        {dealer && <span className="dealer-tag">Dağıtıcı</span>}
        <span className="hcp">{hcp(hand)} P</span>
      </div>
      {hand.map((cards, i) => (
        <div key={i} className="suit-row">
          <span className={SUITS[i].red ? "red" : undefined}>{SUITS[i].sym}</span>
          <span className="hand-cards">{cards ? cards.replace(/T/g, "10").split("").join(" ").replace(/1 0/g, "10") : "—"}</span>
        </div>
      ))}
    </div>
  );
}

function Diagram({ board }: { board: Board }) {
  if (!board.hands) return null;
  const vulNS = board.vul === "NS" || board.vul === "Hep";
  const vulEW = board.vul === "EW" || board.vul === "Hep";
  return (
    <div className="diagram">
      {(["N", "W", "E", "S"] as Seat[]).map((s) => (
        <HandView key={s} seat={s} hand={board.hands![s]} dealer={board.dealer === s} />
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
  const top = boards[0]?.results.length ? boards[0].results[0].mpNS + boards[0].results[0].mpEW : 0;

  const boardNo = Number(sp.board);
  const board = boards.find((b) => b.no === boardNo);
  const pair = pairById.get(Number(sp.cift));

  const boardChips = (
    <nav className="chips" aria-label="Boardlar">
      {boards.map((b) => (
        <a key={b.no} href={`${base}?board=${b.no}`} className={`chip${b.no === board?.no ? " on" : ""}`}>
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
        {pairs.length} çift · {boards.length} board · Top {fmtNum(top, 0)}
      </p>
      <div className="view-tabs">
        <a href={base} className={!board && !pair ? "on" : undefined}>Sıralama</a>
        <a href={`${base}?board=${board?.no ?? boards[0]?.no ?? 1}`} className={board ? "on" : undefined}>
          Boardlar
        </a>
        {pair && <a className="on">Çift {pair.id}</a>}
      </div>
    </div>
  );

  // ---- Board görünümü ----
  if (board) {
    const i = boards.indexOf(board);
    const prev = boards[i - 1];
    const next = boards[i + 1];
    return (
      <>
        {head}
        {boardChips}
        <div className="board-bar">
          {prev ? <a href={`${base}?board=${prev.no}`} className="cal-step">‹ {prev.no}</a> : <span />}
          <h2>Board {board.no}</h2>
          {next ? <a href={`${base}?board=${next.no}`} className="cal-step">{next.no} ›</a> : <span />}
        </div>
        <p className="board-info">
          Dağıtıcı: <strong>{SEAT_LONG[board.dealer]}</strong> · Zon: <strong>{VUL_TR[board.vul]}</strong>
        </p>
        <Diagram board={board} />

        <div className="table-wrap">
          <table className="res-table traveller">
            <thead>
              <tr>
                <th>K-G</th>
                <th>D-B</th>
                <th>Kontrat</th>
                <th>Oyn.</th>
                <th>Löve</th>
                <th className="num">K-G</th>
                <th className="num">D-B</th>
                <th className="num">MP K-G</th>
                <th className="num">MP D-B</th>
              </tr>
            </thead>
            <tbody>
              {board.results.map((r, k) => (
                <tr key={k}>
                  <td>
                    <a href={`${base}?cift=${r.ns}`} title={pairName(r.ns)}>{r.ns}</a>
                  </td>
                  <td>
                    <a href={`${base}?cift=${r.ew}`} title={pairName(r.ew)}>{r.ew}</a>
                  </td>
                  <td><Contract r={r} /></td>
                  <td>{r.declarer ? SEAT_TR[r.declarer] : ""}</td>
                  <td>{r.contract === "Pass" ? "" : tricksText(r.contract, r.tricks) || (r.tricks ?? "")}</td>
                  <td className="num">{score(r.scoreNS, "NS")}</td>
                  <td className="num">{score(r.scoreNS, "EW")}</td>
                  <td className="num strong">{fmtNum(r.mpNS)}</td>
                  <td className="num strong">{fmtNum(r.mpEW)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">Çift numarasına dokunarak o çiftin tüm boardlarını görebilirsiniz.</p>
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
              Çift {pair.id} · {fmtNum(pair.mp)} MP · %{fmtNum(pair.pct, 2)}
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
                <th>Löve</th>
                <th className="num">Skor</th>
                <th className="num">MP</th>
                <th className="num">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ b, r, ns }) => {
                const opp = ns ? r.ew : r.ns;
                const sc = r.scoreNS === null ? "" : String(ns ? r.scoreNS : -r.scoreNS);
                return (
                  <tr key={b.no}>
                    <td>{r.round}</td>
                    <td>
                      <a href={`${base}?board=${b.no}`}>{b.no}</a>
                    </td>
                    <td className="opp">
                      <a href={`${base}?cift=${opp}`}>{pairName(opp)}</a>
                    </td>
                    <td><Contract r={r} /></td>
                    <td>{r.declarer ? SEAT_TR[r.declarer] : ""}</td>
                    <td>{r.contract === "Pass" ? "" : tricksText(r.contract, r.tricks)}</td>
                    <td className="num">{sc}</td>
                    <td className="num strong">{fmtNum(ns ? r.mpNS : r.mpEW)}</td>
                    <td className="num">{ns ? r.pctNS : r.pctEW}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
                  <th className="num">MP</th>
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
                    <td className="num">{fmtNum(p.mp)}</td>
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
