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
  sort_order: number;
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

export type Photo = {
  id: string;
  url: string;
  caption: string | null;
  album_id?: string | null;
  sort_order?: number;
};

export type Album = {
  id: string;
  title: string;
  album_date: string | null;
  sort_order: number;
  photos: Photo[];
};

export type Gallery = { albums: Album[]; loose: Photo[] };

export type Settings = {
  address?: string;
  phone?: string;
  email?: string;
  results_url?: string;
  ranking_current_url?: string;
  ranking_season_url?: string;
  ticker_text?: string;
  ticker_url?: string;
};

export async function getAnnouncements(limit = 6): Promise<Announcement[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from("announcements")
    .select("id,title,body,image_url,address,event_id,published_at,registration_events(is_open)")
    .eq("published", true)
    .order("sort_order", { ascending: false })
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

// Albümler (en üstteki ilk) ve içlerindeki fotoğraflar (yükleme/sıra düzeniyle);
// albüme bağlı olmayan eski fotoğraflar "loose" olarak döner.
export async function getGallery(): Promise<Gallery> {
  const sb = getSupabase();
  if (!sb) return { albums: [], loose: [] };
  const [{ data: albums }, { data: loose }] = await Promise.all([
    sb
      .from("gallery_albums")
      .select("id,title,album_date,sort_order,photos(id,url,caption,sort_order,created_at)")
      .order("sort_order", { ascending: false })
      .order("created_at", { ascending: false }),
    sb
      .from("photos")
      .select("id,url,caption")
      .is("album_id", null)
      .order("created_at", { ascending: false })
      .limit(24),
  ]);
  const sorted = ((albums as unknown as (Album & { photos: (Photo & { created_at: string })[] })[]) ?? []).map(
    (a) => ({
      ...a,
      photos: [...(a.photos ?? [])].sort(
        (x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0) || x.created_at.localeCompare(y.created_at)
      ),
    })
  );
  return { albums: sorted.filter((a) => a.photos.length > 0), loose: (loose as Photo[]) ?? [] };
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
