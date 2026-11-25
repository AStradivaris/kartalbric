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

function sorted(list: LehmanTournament[]) {
  return [...list].sort((a, b) => a.played_on.localeCompare(b.played_on));
}

export function playerStats(list: LehmanTournament[], name: string): PlayerStats | null {
  const key = nameKey(name);
  const matches: PlayerMatch[] = [];
  let shownName = name;

  for (const t of sorted(list)) {
    const players = t.data.players ?? [];
    const me = players.find((p) => nameKey(p.name) === key);
    if (!me) continue;
    shownName = me.name;
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

  for (let i = 1; i < matches.length; i++) {
    matches[i].change = Math.round((matches[i].lehman - matches[i - 1].lehman) * 100) / 100;
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
