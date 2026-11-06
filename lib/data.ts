import { getSupabase } from "./supabase";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  published_at: string;
};

export type ResultRow = { rank: number; pair: string; score: number | null };

export type Tournament = {
  id: string;
  title: string;
  played_on: string;
  result_rows: ResultRow[];
};

export type Photo = { id: string; url: string; caption: string | null };

export type Settings = {
  address?: string;
  phone?: string;
  email?: string;
  results_url?: string;
};

export async function getAnnouncements(limit = 6): Promise<Announcement[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from("announcements")
    .select("id,title,body,image_url,published_at")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data as Announcement[]) ?? [];
}

export async function getLatestTournament(): Promise<Tournament | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from("tournaments")
    .select("id,title,played_on,result_rows(rank,pair,score)")
    .order("played_on", { ascending: false })
    .limit(1);
  const t = (data as Tournament[] | null)?.[0];
  if (!t) return null;
  return { ...t, result_rows: [...t.result_rows].sort((a, b) => a.rank - b.rank) };
}

export async function getPhotos(limit = 8): Promise<Photo[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from("photos")
    .select("id,url,caption")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Photo[]) ?? [];
}

export async function getSettings(): Promise<Settings> {
  const sb = getSupabase();
  if (!sb) return {};
  const { data } = await sb.from("site_settings").select("key,value");
  const out: Record<string, string> = {};
  for (const row of (data as { key: string; value: string }[]) ?? []) {
    out[row.key] = row.value;
  }
  return out as Settings;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
