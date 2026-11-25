// Lehman oyuncu istatistikleri: sitede yayınlanan tüm Lehman turnuvalarından hesaplanır.
import type { LehmanPlayer, Seat, TournamentData } from "./bridge-results";

export type LehmanTournament = { id: string; title: string; played_on: string; data: TournamentData };

export type PlayerMatch = {
  tournamentId: string;
  title: string;
  date: string;
  table: number;
  seat: Seat;
  lehman: number;
  change: number | null; // önceki maça göre Lehman değişimi
  impFor: number;
  impAgainst: number;
  net: number;
  partner: string;
  opponents: string[];
  pairId: number;
};

type PersonStat = { name: string; count: number; changeSum: number; changeCount: number };

export type PlayerStats = {
  name: string;
  matches: PlayerMatch[];
  won: number;
  lost: number;
  up: number;
  down: number;
  avgFor: number;
  avgAgainst: number;
  avgChange: number | null;
  current: number;
  mostPartner: PersonStat | null;
  mostOpponent: PersonStat | null;
  bestPartner: PersonStat | null;
  worstPartner: PersonStat | null;
  bestOpponent: PersonStat | null;
  worstOpponent: PersonStat | null;
};

// ---- Kulübün kendi Lehman hesabı ----
// Herkes 50 ile başlar; her partiden sonra
//   yeni = eski + K × (gerçek% − beklenen%)
//   gerçek%   = 50 + (board başına net IMP × 20/3)
//   beklenen% = çiftin puan toplamı / masadaki dört oyuncunun toplamı × 100
// Her ayın başında herkes yeniden 50'den başlar (aylık Lehman).
// Vugraph'ın verdiği değer "vugraph" alanında saklanır.
export const LEHMAN_START = 50;
export const LEHMAN_K = 0.06;

export function applyClubLehman(list: LehmanTournament[]): LehmanTournament[] {
  const rating = new Map<string, number>();
  let month = "";
  return sorted(list).map((t) => {
    // Yeni ay: puanlar sıfırlanır, herkes LEHMAN_START ile başlar
    if (t.played_on.slice(0, 7) !== month) {
      month = t.played_on.slice(0, 7);
      rating.clear();
    }
    const players = (t.data.players ?? []).map((p) => ({ ...p }));
    const nb = t.data.boards.length || 1;
    const tables = [...new Set(players.map((p) => p.table))];
    const updates = new Map<LehmanPlayer, { lehman: number; delta: number }>();
    for (const tb of tables) {
      const ps = players.filter((p) => p.table === tb);
      const pre = new Map(ps.map((p) => [p, rating.get(nameKey(p.name)) ?? LEHMAN_START]));
      const total = [...pre.values()].reduce((a, b) => a + b, 0);
      for (const p of ps) {
        const side = ps.filter((q) => SIDE_OF[q.seat] === SIDE_OF[p.seat]);
        const own = side.reduce((a, q) => a + pre.get(q)!, 0);
        const expected = total > 0 && ps.length === 4 ? (own / total) * 100 : 50;
        const actual = 50 + (p.imp / nb) * (20 / 3);
        const delta = LEHMAN_K * (actual - expected);
        updates.set(p, { lehman: pre.get(p)! + delta, delta });
      }
    }
    for (const p of players) {
      const u = updates.get(p);
      if (!u) continue;
      p.vugraph = p.lehman;
      p.lehman = Math.round(u.lehman * 100) / 100;
      p.delta = Math.round(u.delta * 100) / 100;
      rating.set(nameKey(p.name), u.lehman);
    }
    return { ...t, data: { ...t.data, players } };
  });
}

/** İsimleri karşılaştırmak için: küçük harf, tek boşluk */
export const nameKey = (n: string) => n.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr-TR");

const SIDE_OF: Record<Seat, "NS" | "EW"> = { N: "NS", S: "NS", E: "EW", W: "EW" };
const PARTNER: Record<Seat, Seat> = { N: "S", S: "N", E: "W", W: "E" };

/** Tüm Lehman turnuvalarındaki oyuncu adları (en güncel Lehman puanıyla) */
export function allLehmanPlayers(list: LehmanTournament[]): { name: string; lehman: number; matches: number }[] {
  const map = new Map<string, { name: string; lehman: number; matches: number; date: string }>();
  for (const t of sorted(list)) {
    for (const p of t.data.players ?? []) {
      const k = nameKey(p.name);
      const prev = map.get(k);
      map.set(k, { name: p.name, lehman: p.lehman, matches: (prev?.matches ?? 0) + 1, date: t.played_on });
    }
  }
  return [...map.values()].sort((a, b) => b.lehman - a.lehman);
}

// Tarihe göre; aynı gün oynanan partiler yüklenme sırasını (listenin gelen sırasını) korur.
function sorted(list: LehmanTournament[]) {
  return list
    .map((t, i) => ({ t, i }))
    .sort((a, b) => a.t.played_on.localeCompare(b.t.played_on) || a.i - b.i)
    .map((x) => x.t);
}

export function playerStats(list: LehmanTournament[], name: string): PlayerStats | null {
  const key = nameKey(name);
  const matches: PlayerMatch[] = [];
  const deltas: (number | undefined)[] = [];
  let shownName = name;

  for (const t of sorted(list)) {
    const players = t.data.players ?? [];
    const me = players.find((p) => nameKey(p.name) === key);
    if (!me) continue;
    shownName = me.name;
    deltas.push(me.delta);
    const atTable = players.filter((p) => p.table === me.table);
    const partner = atTable.find((p) => p.seat === PARTNER[me.seat]);
    const opponents = atTable.filter((p) => SIDE_OF[p.seat] !== SIDE_OF[me.seat]);
    matches.push({
      tournamentId: t.id,
      title: t.title,
      date: t.played_on,
      table: me.table,
      seat: me.seat,
      lehman: me.lehman,
      change: null,
      impFor: me.impFor ?? 0,
      impAgainst: me.impAgainst ?? 0,
      net: me.imp,
      partner: partner?.name ?? "",
      opponents: opponents.map((o: LehmanPlayer) => o.name),
      pairId: SIDE_OF[me.seat] === "NS" ? me.table * 2 - 1 : me.table * 2,
    });
  }
  if (matches.length === 0) return null;

  for (let i = 0; i < matches.length; i++) {
    if (deltas[i] !== undefined) matches[i].change = deltas[i]!;
    else if (i > 0) matches[i].change = Math.round((matches[i].lehman - matches[i - 1].lehman) * 100) / 100;
  }
  const changes = matches.map((m) => m.change).filter((c): c is number => c !== null);

  // Ortak ve rakip sayıları; başarı = o kişiyle oynanan maçlardaki ortalama Lehman değişimi
  const partners = new Map<string, PersonStat>();
  const opps = new Map<string, PersonStat>();
  const add = (map: Map<string, PersonStat>, n: string, change: number | null) => {
    if (!n) return;
    const k = nameKey(n);
    const s = map.get(k) ?? { name: n, count: 0, changeSum: 0, changeCount: 0 };
    s.count++;
    if (change !== null) {
      s.changeSum += change;
      s.changeCount++;
    }
    map.set(k, s);
  };
  for (const m of matches) {
    add(partners, m.partner, m.change);
    for (const o of m.opponents) add(opps, o, m.change);
  }
  const most = (map: Map<string, PersonStat>) =>
    [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr"))[0] ?? null;
  const avg = (s: PersonStat) => s.changeSum / s.changeCount;
  const withChange = (map: Map<string, PersonStat>) => [...map.values()].filter((s) => s.changeCount > 0);
  const best = (map: Map<string, PersonStat>) => withChange(map).sort((a, b) => avg(b) - avg(a))[0] ?? null;
  const worst = (map: Map<string, PersonStat>) => withChange(map).sort((a, b) => avg(a) - avg(b))[0] ?? null;

  const n = matches.length;
  return {
    name: shownName,
    matches,
    won: matches.filter((m) => m.net > 0).length,
    lost: matches.filter((m) => m.net < 0).length,
    up: changes.filter((c) => c > 0).length,
    down: changes.filter((c) => c < 0).length,
    avgFor: matches.reduce((s, m) => s + m.impFor, 0) / n,
    avgAgainst: matches.reduce((s, m) => s + m.impAgainst, 0) / n,
    avgChange: changes.length ? changes.reduce((s, c) => s + c, 0) / changes.length : null,
    current: matches[n - 1].lehman,
    mostPartner: most(partners),
    mostOpponent: most(opps),
    bestPartner: best(partners),
    worstPartner: worst(partners),
    bestOpponent: best(opps),
    worstOpponent: worst(opps),
  };
}

export const personAvg = (s: PersonStat | null) =>
  s && s.changeCount > 0 ? s.changeSum / s.changeCount : null;

export type MonthlyRow = {
  name: string;
  lehman: number; // ay içindeki son Lehman
  change: number | null; // ay başına göre değişim (ay öncesi maçı yoksa ilk maçına göre)
  fromFirst: boolean; // değişim ayın ilk maçından itibaren mi
  matches: number;
  won: number;
  imp: number; // ay içindeki toplam net IMP
};

/** Seçilen ayda Lehman oynamış oyuncuların sıralaması (ay sonundaki puana göre) */
export function monthlyRanking(list: LehmanTournament[], y: number, m: number): MonthlyRow[] {
  const prefix = `${y}-${String(m).padStart(2, "0")}`;
  const before = new Map<string, number>(); // ay öncesindeki son puan
  const rows = new Map<string, MonthlyRow & { first: number; deltaSum?: number }>();
  for (const t of sorted(list)) {
    const inMonth = t.played_on.startsWith(prefix);
    const after = t.played_on.slice(0, 7) > prefix;
    if (after) break;
    for (const p of t.data.players ?? []) {
      const k = nameKey(p.name);
      if (!inMonth) {
        before.set(k, p.lehman);
        continue;
      }
      const r = rows.get(k) ?? { name: p.name, lehman: p.lehman, change: null, fromFirst: false, matches: 0, won: 0, imp: 0, first: p.lehman };
      r.name = p.name;
      r.lehman = p.lehman;
      r.matches++;
      if (p.imp > 0) r.won++;
      r.imp = Math.round((r.imp + p.imp) * 100) / 100;
      if (p.delta !== undefined) r.deltaSum = (r.deltaSum ?? 0) + p.delta;
      rows.set(k, r);
    }
  }
  return [...rows.entries()]
    .map(([k, r]) => {
      const start = before.get(k);
      const base = start ?? (r.matches > 1 ? r.first : null);
      const change =
        r.deltaSum !== undefined
          ? Math.round(r.deltaSum * 100) / 100
          : base === null
            ? null
            : Math.round((r.lehman - base) * 100) / 100;
      return {
        name: r.name,
        lehman: r.lehman,
        change,
        fromFirst: r.deltaSum === undefined && start === undefined,
        matches: r.matches,
        won: r.won,
        imp: r.imp,
      };
    })
    .sort((a, b) => b.lehman - a.lehman);
}

/** Lehman oynanmış ayların listesi ("2026-11" gibi), yeniden eskiye */
export function lehmanMonths(list: LehmanTournament[]): string[] {
  return [...new Set(list.map((t) => t.played_on.slice(0, 7)))].sort().reverse();
}
