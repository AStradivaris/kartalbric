// Briç turnuva sonuçlarını okuma:
//  - Skor programının sekmeyle ayrılmış metin çıktısı (.txt): çift sıralaması + board sonuçları
//  - Dağıtma makinesinin .dup dosyası: her board'un dört eli
// Hem tarayıcıda (admin yükleme) hem sunucuda çalışır.

export type Seat = "N" | "E" | "S" | "W";
export const SEATS: Seat[] = ["N", "E", "S", "W"];

export type Pair = {
  id: number;
  rank: number;
  dir: "NS" | "EW";
  table: number | null;
  names: string[];
  mp: number;
  pct: number;
  boards: number;
};

export type BoardResult = {
  table: number;
  round: number;
  ns: number;
  ew: number;
  contract: string; // "4SX", "3N", "Pass", "" (ayarlı skor)
  declarer: Seat | "";
  tricks: number | null;
  scoreNS: number | null; // N-S'nin aldığı puan (E-W aldıysa eksi)
  adjusted: string | null; // "A=", "A+" gibi ayarlı skor
  mpNS: number;
  mpEW: number;
  pctNS: number;
  pctEW: number;
};

// Her el 4 renk: [♠, ♥, ♦, ♣], kartlar "AKQJT98..." biçiminde
export type Hand = [string, string, string, string];

export type Board = {
  no: number;
  dealer: Seat;
  vul: "-" | "NS" | "EW" | "Hep";
  hands: Record<Seat, Hand> | null;
  results: BoardResult[];
};

export type TournamentData = {
  version: 1;
  pairs: Pair[];
  boards: Board[];
};

const VUL: Board["vul"][] = ["-", "NS", "EW", "Hep", "NS", "EW", "Hep", "-", "EW", "Hep", "-", "NS", "Hep", "-", "NS", "EW"];

export function dealerOf(board: number): Seat {
  return SEATS[(board - 1) % 4];
}
export function vulOf(board: number): Board["vul"] {
  return VUL[(board - 1) % 16];
}

function clean(v: string | undefined): string {
  if (v === undefined) return "";
  const t = v.trim().replace(/^"(.*)"$/, "$1").trim();
  return t === "-" ? "" : t;
}
const num = (v: string | undefined): number | null => {
  const t = clean(v).replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

// "MURAT GÜNGÖR" -> "Murat GÜNGÖR"; "Hüseyİn Cahİt  MOĞULTAY" -> "Hüseyin Cahit MOĞULTAY"
export function formatName(raw: string): string {
  const words = raw.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length === 0) return "";
  return words
    .map((w, i) =>
      i === words.length - 1
        ? w.toLocaleUpperCase("tr-TR")
        : w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1).toLocaleLowerCase("tr-TR")
    )
    .join(" ");
}

/** Skor programının .txt çıktısını okur. */
export function parseScoreText(text: string): { pairs: Pair[]; results: Map<number, BoardResult[]> } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const pairs: Pair[] = [];
  const results = new Map<number, BoardResult[]>();
  let mode: "pairs" | "boards" | null = null;
  let head: string[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split("\t");
    const first = clean(cols[0]);
    if (first === "PrimaryGrouping" || first === "Board") {
      mode = first === "Board" ? "boards" : "pairs";
      head = cols.map((c) => clean(c));
      continue;
    }
    if (!mode) continue;
    const get = (name: string) => cols[head.indexOf(name)];

    if (mode === "pairs") {
      const dirRaw = clean(get("Direction") ?? get("PrimaryGrouping")).toUpperCase();
      const id = num(get("PairId"));
      if (id === null) continue;
      pairs.push({
        id,
        rank: num(get("Rank")) ?? 0,
        dir: dirRaw.startsWith("E") ? "EW" : "NS",
        table: num(get("Table")),
        names: clean(get("Names"))
          .split(/\s+-\s+/)
          .map(formatName)
          .filter(Boolean),
        mp: num(get("TotalScoreMP")) ?? 0,
        pct: num(get("TotalPercentage")) ?? 0,
        boards: num(get("NrBoards")) ?? 0,
      });
    } else {
      const board = num(get("Board"));
      if (board === null) continue;
      const sNS = clean(get("Score_NS"));
      const sEW = clean(get("Score_EW"));
      const adjusted = /^A/i.test(sNS) ? sNS : /^A/i.test(sEW) ? sEW : null;
      let scoreNS: number | null = null;
      if (!adjusted) {
        if (sNS !== "") scoreNS = Number(sNS);
        else if (sEW !== "") scoreNS = -Number(sEW);
      }
      const decl = clean(get("Declarer")).toUpperCase();
      const r: BoardResult = {
        table: num(get("Table")) ?? 0,
        round: num(get("Round")) ?? 0,
        ns: num(get("PairId_NS")) ?? 0,
        ew: num(get("PairId_EW")) ?? 0,
        contract: clean(get("Contract")).toUpperCase() === "PASS" ? "Pass" : clean(get("Contract")).toUpperCase(),
        declarer: (SEATS as string[]).includes(decl) ? (decl as Seat) : "",
        tricks: num(get("Result")),
        scoreNS: Number.isFinite(scoreNS as number) ? scoreNS : null,
        adjusted,
        mpNS: num(get("MP_NS")) ?? 0,
        mpEW: num(get("MP_EW")) ?? 0,
        pctNS: num(get("Percentage_NS")) ?? 0,
        pctEW: num(get("Percentage_EW")) ?? 0,
      };
      if (!results.has(board)) results.set(board, []);
      results.get(board)!.push(r);
    }
  }
  if (pairs.length === 0 || results.size === 0) {
    throw new Error("Skor dosyasında çift sıralaması ya da board sonuçları bulunamadı.");
  }
  return { pairs, results };
}

const RANKS = "AKQJT98765432";

/**
 * .dup dosyasını okur. Her board 156 baytlık bir kayıttır; ilk 78 karakter
 * N, E ve S ellerindeki 13'er kartın numarasıdır (01-13 ♠ A..2, 14-26 ♥,
 * 27-39 ♦, 40-52 ♣). W eli kalan kartlardır.
 */
export function parseDup(bytes: Uint8Array): Record<Seat, Hand>[] {
  const REC = 156;
  const out: Record<Seat, Hand>[] = [];
  for (let off = 0; off + 78 <= bytes.length; off += REC) {
    const digits = String.fromCharCode(...bytes.slice(off, off + 78));
    if (!/^\d{78}$/.test(digits)) break;
    const seats: number[][] = [0, 1, 2].map((k) =>
      Array.from({ length: 13 }, (_, i) => Number(digits.slice(k * 26 + i * 2, k * 26 + i * 2 + 2)))
    );
    const used = new Set(seats.flat());
    if (used.size !== 39 || [...used].some((n) => n < 1 || n > 52)) break;
    seats.push(Array.from({ length: 52 }, (_, i) => i + 1).filter((n) => !used.has(n)));
    const toHand = (cards: number[]): Hand =>
      [0, 1, 2, 3].map((s) =>
        cards
          .filter((n) => Math.floor((n - 1) / 13) === s)
          .sort((a, b) => a - b)
          .map((n) => RANKS[(n - 1) % 13])
          .join("")
      ) as Hand;
    out.push({ N: toHand(seats[0]), E: toHand(seats[1]), S: toHand(seats[2]), W: toHand(seats[3]) });
  }
  if (out.length === 0) throw new Error(".dup dosyasında el bulunamadı.");
  return out;
}

/** İki dosyayı birleştirip sayfada gösterilecek veriyi üretir. */
export function buildTournament(scoreText: string, dupBytes: Uint8Array | null): TournamentData {
  const { pairs, results } = parseScoreText(scoreText);
  const deals = dupBytes ? parseDup(dupBytes) : [];
  const boardNos = [...results.keys()].sort((a, b) => a - b);
  const boards: Board[] = boardNos.map((no) => ({
    no,
    dealer: dealerOf(no),
    vul: vulOf(no),
    hands: deals[no - 1] ?? null,
    results: results
      .get(no)!
      .sort((a, b) => b.mpNS - a.mpNS || (b.scoreNS ?? 0) - (a.scoreNS ?? 0) || a.table - b.table),
  }));
  pairs.sort((a, b) => (a.dir === b.dir ? a.rank - b.rank : a.dir === "NS" ? -1 : 1));
  return { version: 1, pairs, boards };
}

// ---- Bridge Solver ----

/**
 * Bridge Solver Online (dds.bridgewebs.com) bağlantısı: eller ve oyuncu
 * isimleriyle açılır, kart kart çift kukla oynanabilir.
 */
export function bridgeSolverUrl(board: Board, names?: Partial<Record<Seat, string>>): string | null {
  if (!board.hands) return null;
  const lin = (h: Hand) => "SHDC".split("").map((s, i) => s + h[i]).join("");
  const dealerNo = { S: 1, W: 2, N: 3, E: 4 }[board.dealer];
  const md = `${dealerNo}${lin(board.hands.S)},${lin(board.hands.W)},${lin(board.hands.N)},${lin(board.hands.E)}`;
  const sv = { "-": "o", NS: "n", EW: "e", Hep: "b" }[board.vul];
  const clean = (n?: string) => (n ?? "").replace(/[|,]/g, " ").trim();
  const pn = names ? `pn|${clean(names.S)},${clean(names.W)},${clean(names.N)},${clean(names.E)}|` : "";
  const text = `${pn}md|${md}|rh||ah|Board ${board.no}|sv|${sv}|pg||`;
  return `https://dds.bridgewebs.com/bsol2/ddummy.htm?lin=${encodeURIComponent(text)}`;
}

// ---- Gösterim yardımcıları ----

export const SUIT_SYMBOL: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣", N: "SA" };

/** "4SX" -> { level: "4", suit: "S", dbl: "X" } */
export function splitContract(c: string): { level: string; suit: string; dbl: string } | null {
  const m = /^([1-7])([SHDCN])(X{0,2})$/.exec(c);
  return m ? { level: m[1], suit: m[2], dbl: m[3] } : null;
}

/** Löve sonucu: "=", "+1", "-2" */
export function tricksText(contract: string, tricks: number | null): string {
  const c = splitContract(contract);
  if (!c || tricks === null) return "";
  const diff = tricks - (6 + Number(c.level));
  return diff === 0 ? "=" : diff > 0 ? `+${diff}` : `${diff}`;
}

export function hcp(hand: Hand): number {
  const v: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };
  return hand.join("").split("").reduce((s, c) => s + (v[c] ?? 0), 0);
}

export const fmtNum = (n: number, d = 1) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d });
