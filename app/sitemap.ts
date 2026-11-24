import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getSupabase } from "@/lib/supabase";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/fitbridge`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/sonuclar`, changeFrequency: "weekly", priority: 0.8 },
  ];

  // Kayıt sayfaları (açık olanlar) da aranabilsin.
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb
      .from("registration_events")
      .select("id,created_at")
      .eq("is_open", true);
    for (const ev of (data as { id: string; created_at: string }[]) ?? []) {
      pages.push({
        url: `${SITE_URL}/kayit/${ev.id}`,
        lastModified: ev.created_at,
        changeFrequency: "daily",
        priority: 0.6,
      });
    }
  }
  if (sb) {
    const { data } = await sb
      .from("tournaments")
      .select("id,created_at")
      .not("data", "is", null)
      .order("played_on", { ascending: false })
      .limit(200);
    for (const t of (data as { id: string; created_at: string }[]) ?? []) {
      pages.push({ url: `${SITE_URL}/sonuclar/${t.id}`, lastModified: t.created_at, priority: 0.5 });
    }
  }
  return pages;
}
