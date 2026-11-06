import { getSupabase } from "./supabase";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  address: string | null;
  event_id: string | null;
  registration_events: { is_open: boolean } | null;
  published_at: string;
};

export type EventItem = {
  id: string;
  title: string;
  event_date: string | null;
  is_open: boolean;
};

export type Registration = {
  id: string;
  p1_name: string;
  p2_name: string;
  created_at: string;
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
    .select("id,title,body,image_url,address,event_id,published_at,registration_events(is_open)")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data as unknown as Announcement[]) ?? [];
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

export async function getEvent(id: string): Promise<EventItem | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from("registration_events")
    .select("id,title,event_date,is_open")
    .eq("id", id)
    .maybeSingle();
  return (data as EventItem | null) ?? null;
}

export async function getRegistrations(eventId: string): Promise<Registration[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from("registrations")
    .select("id,p1_name,p2_name,created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return (data as Registration[]) ?? [];
}

// Adresi Google Haritalar'da arama olarak açan bağlantı.
export function mapsUrl(address: string): string {
  const q = address.replace(/\s*\n\s*/g, ", ").trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
