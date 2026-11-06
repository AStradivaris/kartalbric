"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { formatDate, type Announcement, type Photo } from "@/lib/data";
import { DEFAULT_RANKING_CURRENT_URL, DEFAULT_RANKING_SEASON_URL } from "@/lib/site";

type Tab = "duyurular" | "kayitlar" | "sonuclar" | "galeri" | "iletisim";

const TABS: { id: Tab; label: string }[] = [
  { id: "duyurular", label: "Duyurular" },
  { id: "kayitlar", label: "Kayıtlar" },
  { id: "sonuclar", label: "Sonuç ve sıralama" },
  { id: "galeri", label: "Galeri" },
  { id: "iletisim", label: "İletişim" },
];

export default function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("duyurular");

  useEffect(() => {
    const sb = getBrowserSupabase();
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <main className="admin">
        <p>Yükleniyor...</p>
      </main>
    );
  }

  if (!session) return <Login />;

  return (
    <main className="admin">
      <div className="admin-top">
        <h1>Kartal Briç Yönetim</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/">Siteyi gör</a>
          <button className="btn-del" onClick={() => getBrowserSupabase().auth.signOut()}>
            Çıkış
          </button>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "duyurular" && <Announcements />}
      {tab === "kayitlar" && <Registrations />}
      {tab === "sonuclar" && <ResultsAndRankings />}
      {tab === "galeri" && <Gallery />}
      {tab === "iletisim" && <ContactSettings />}
    </main>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await getBrowserSupabase().auth.signInWithPassword({ email, password });
    if (error) setError("E-posta veya şifre hatalı.");
    setBusy(false);
  }

  return (
    <main className="admin" style={{ maxWidth: 420 }}>
      <h1 style={{ marginBottom: 20 }}>Yönetici girişi</h1>
      <form className="panel" onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">E-posta</label>
          <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Şifre</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn-admin" disabled={busy}>Giriş yap</button>
        {error && <p className="msg err">{error}</p>}
      </form>
    </main>
  );
}

function Announcements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [address, setAddress] = useState("");
  const [eventId, setEventId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    const sb = getBrowserSupabase();
    const { data } = await sb
      .from("announcements")
      .select("id,title,body,image_url,address,event_id,published_at,sort_order")
      .order("sort_order", { ascending: false })
      .order("published_at", { ascending: false });
    setItems((data as unknown as Announcement[]) ?? []);
    const { data: ev } = await sb
      .from("registration_events")
      .select("id,title,event_date,is_open")
      .order("created_at", { ascending: false });
    setEvents((ev as EventItem[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function reset() {
    setEditing(null);
    setTitle("");
    setBody("");
    setAddress("");
    setEventId("");
    setFile(null);
    setFileKey((k) => k + 1);
    setRemoveImage(false);
  }

  function startEdit(a: Announcement) {
    setEditing(a);
    setTitle(a.title);
    setBody(a.body);
    setAddress(a.address ?? "");
    setEventId(a.event_id ?? "");
    setFile(null);
    setFileKey((k) => k + 1);
    setRemoveImage(false);
    setErr(false);
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setErr(false);
    setMsg("");
    const sb = getBrowserSupabase();
    const wasEditing = !!editing;

    let image_url: string | null = editing?.image_url ?? null;
    const oldPath = editing?.image_url?.split("/gallery/")[1];

    if (file) {
      const blob = await shrink(file);
      const path = `announcements/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error: upError } = await sb.storage
        .from("gallery")
        .upload(path, blob, { contentType: blob.type || "image/jpeg" });
      if (upError) {
        setErr(true);
        setMsg(upError.message);
        setBusy(false);
        return;
      }
      image_url = sb.storage.from("gallery").getPublicUrl(path).data.publicUrl;
    } else if (removeImage) {
      image_url = null;
    }

    const payload = {
      title: title.trim(),
      body: body.trim(),
      image_url,
      event_id: eventId || null,
      address: address.trim() || null,
    };

    // Yeni duyuru listenin en üstüne eklenir.
    const topOrder = items.reduce((m, a) => Math.max(m, a.sort_order ?? 0), 0) + 1;

    const { error } = editing
      ? await sb.from("announcements").update(payload).eq("id", editing.id)
      : await sb.from("announcements").insert({ ...payload, sort_order: topOrder });

    if (error) {
      setErr(true);
      setMsg(error.message);
      setBusy(false);
      return;
    }

    // Fotoğraf değiştirildiyse ya da kaldırıldıysa eskisini depodan sil.
    if (wasEditing && oldPath && (file || removeImage)) {
      await sb.storage.from("gallery").remove([oldPath]);
    }

    reset();
    setMsg(
      wasEditing
        ? "Duyuru güncellendi. Sitede en geç 1 dakika içinde görünür."
        : "Duyuru eklendi. Sitede en geç 1 dakika içinde görünür."
    );
    setBusy(false);
    load();
  }

  const [moving, setMoving] = useState(false);

  // Seçilen duyuruyu bir üste/alta taşır; tüm listeye yukarıdan aşağı azalan sıra numarası verir.
  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const renumbered = next.map((a, i) => ({ ...a, sort_order: next.length - i }));
    const changed = renumbered.filter((a, i) => a.sort_order !== next[i].sort_order || a.id !== items[i].id);

    setItems(renumbered);
    setMoving(true);
    const sb = getBrowserSupabase();
    const results = await Promise.all(
      changed.map((a) => sb.from("announcements").update({ sort_order: a.sort_order }).eq("id", a.id))
    );
    setMoving(false);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      setErr(true);
      setMsg(failed.error.message);
      load();
    }
  }

  async function remove(a: Announcement) {
    if (!confirm("Bu duyuru silinsin mi?")) return;
    const sb = getBrowserSupabase();
    const path = a.image_url?.split("/gallery/")[1];
    if (path) await sb.storage.from("gallery").remove([path]);
    await sb.from("announcements").delete().eq("id", a.id);
    if (editing?.id === a.id) reset();
    load();
  }

  return (
    <>
      <form className="panel" onSubmit={save}>
        <h2>{editing ? "Duyuruyu düzenle" : "Yeni duyuru"}</h2>
        <div className="field">
          <label htmlFor="a-title">Başlık</label>
          <input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="a-body">Metin</label>
          <textarea id="a-body" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>

        {editing?.image_url && !file && (
          <div className="field">
            <label>Şimdiki fotoğraf</label>
            <img
              src={editing.image_url}
              alt=""
              style={{ width: 160, borderRadius: 12, opacity: removeImage ? 0.35 : 1 }}
            />
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={removeImage}
                onChange={(e) => setRemoveImage(e.target.checked)}
                style={{ width: 20, height: 20 }}
              />
              Fotoğrafı kaldır
            </label>
          </div>
        )}
        <div className="field">
          <label htmlFor="a-image">
            {editing?.image_url ? "Yeni fotoğraf (seçerseniz eskisinin yerine geçer)" : "Fotoğraf (isteğe bağlı)"}
          </label>
          <input
            key={fileKey}
            id="a-image"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="field">
          <label htmlFor="a-location">Adres (isteğe bağlı)</label>
          <input
            id="a-location"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Örn. Kartal Briç Spor Kulübü, Kartal, İstanbul"
          />
        </div>
        <p className="hint">
          Adres yazarsanız duyuruda &quot;Adres&quot; düğmesi çıkar ve Google Haritalar&apos;da açılır.
          Mekân adı ve ilçeyi birlikte yazmak doğru yeri bulmayı kolaylaştırır.
        </p>

        <div className="field">
          <label htmlFor="a-event">Kayıt bağlantısı (isteğe bağlı)</label>
          <select id="a-event" value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">Yok</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>
        <p className="hint">
          Bir kayıt seçerseniz duyuruda &quot;Kayıt ol&quot; ve &quot;Kayıt olanlar&quot; düğmeleri çıkar.
          Kayıt oluşturmak için Kayıtlar sekmesini kullanın.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <button className="btn-admin" disabled={busy}>
            {busy ? "Kaydediliyor..." : editing ? "Değişiklikleri kaydet" : "Yayınla"}
          </button>
          {editing && (
            <button type="button" className="tab" onClick={reset} disabled={busy}>
              Vazgeç
            </button>
          )}
        </div>
        {msg && <p className={`msg${err ? " err" : ""}`}>{msg}</p>}
      </form>

      <div className="panel">
        <h2>Yayındaki duyurular</h2>
        {items.length > 1 && (
          <p className="hint" style={{ margin: "-8px 0 16px" }}>
            Oklarla sırayı değiştirin. Sitede bu listedeki sırayla, en üstteki ilk görünür.
          </p>
        )}
        {items.length === 0 ? (
          <p>Henüz duyuru yok.</p>
        ) : (
          <ul className="list">
            {items.map((a, i) => (
              <li key={a.id}>
                <div className="order-btns">
                  <button
                    className="btn-arrow"
                    aria-label={`${a.title}: yukarı taşı`}
                    disabled={i === 0 || moving}
                    onClick={() => move(i, -1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
                  </button>
                  <button
                    className="btn-arrow"
                    aria-label={`${a.title}: aşağı taşı`}
                    disabled={i === items.length - 1 || moving}
                    onClick={() => move(i, 1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                </div>
                {a.image_url && (
                  <img
                    src={a.image_url}
                    alt=""
                    style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
                  />
                )}
                <div className="meta" style={{ flex: 1 }}>
                  <strong>{a.title}</strong>
                  <span>{formatDate(a.published_at)}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button className="btn-edit" onClick={() => startEdit(a)}>Düzenle</button>
                  <button className="btn-del" onClick={() => remove(a)}>Sil</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

type EventItem = { id: string; title: string; event_date: string | null; is_open: boolean };
type Reg = { id: string; event_id: string; p1_name: string; p2_name: string };

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

function Registrations() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [regs, setRegs] = useState<Reg[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    const sb = getBrowserSupabase();
    const [{ data: ev }, { data: rg }] = await Promise.all([
      sb.from("registration_events").select("id,title,event_date,is_open").order("created_at", { ascending: false }),
      sb.from("registrations").select("id,event_id,p1_name,p2_name").order("created_at", { ascending: true }),
    ]);
    setEvents((ev as EventItem[]) ?? []);
    setRegs((rg as Reg[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await getBrowserSupabase()
      .from("registration_events")
      .insert({ title: title.trim(), event_date: date || null });
    setErr(!!error);
    if (error) return setMsg(error.message);
    setTitle("");
    setDate("");
    setMsg("Kayıt oluşturuldu. Duyuru eklerken bu kaydı seçebilirsiniz.");
    load();
  }

  async function toggleOpen(ev: EventItem) {
    await getBrowserSupabase().from("registration_events").update({ is_open: !ev.is_open }).eq("id", ev.id);
    load();
  }

  async function removeEvent(ev: EventItem) {
    if (!confirm(`"${ev.title}" ve tüm kayıtları silinsin mi?`)) return;
    await getBrowserSupabase().from("registration_events").delete().eq("id", ev.id);
    load();
  }

  async function removeReg(r: Reg) {
    if (!confirm(`${r.p1_name} / ${r.p2_name} kaydı silinsin mi?`)) return;
    await getBrowserSupabase().from("registrations").delete().eq("id", r.id);
    load();
  }

  async function copyLink(ev: EventItem) {
    const link = `${window.location.origin}/kayit/${ev.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setErr(false);
      setMsg("Kayıt bağlantısı kopyalandı.");
    } catch {
      setErr(false);
      setMsg(link);
    }
  }

  return (
    <>
      <form className="panel" onSubmit={addEvent}>
        <h2>Yeni kayıt oluştur</h2>
        <div className="field">
          <label htmlFor="e-title">Turnuva adı</label>
          <input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="e-date">Turnuva tarihi (isteğe bağlı)</label>
          <input id="e-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button className="btn-admin">Oluştur</button>
        {msg && <p className={`msg${err ? " err" : ""}`}>{msg}</p>}
      </form>

      {events.length === 0 ? (
        <div className="panel"><p>Henüz kayıt oluşturulmadı.</p></div>
      ) : (
        events.map((ev) => {
          const list = regs.filter((r) => r.event_id === ev.id);
          const counts = new Map<string, number>();
          for (const r of list) {
            for (const n of [norm(r.p1_name), norm(r.p2_name)]) counts.set(n, (counts.get(n) ?? 0) + 1);
          }
          return (
            <div className="panel" key={ev.id}>
              <h2>{ev.title}</h2>
              <p className="hint" style={{ margin: "-8px 0 16px" }}>
                {ev.event_date ? `${formatDate(ev.event_date)} · ` : ""}
                {list.length} çift · kayıt {ev.is_open ? "açık" : "kapalı"}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                <button className="tab" onClick={() => setOpenId(openId === ev.id ? null : ev.id)}>
                  {openId === ev.id ? "Listeyi gizle" : "Kayıtları gör"}
                </button>
                <button className="tab" onClick={() => copyLink(ev)}>Bağlantıyı kopyala</button>
                <button className="tab" onClick={() => toggleOpen(ev)}>
                  {ev.is_open ? "Kaydı kapat" : "Kaydı aç"}
                </button>
                <button className="btn-del" onClick={() => removeEvent(ev)}>Sil</button>
              </div>
              {openId === ev.id &&
                (list.length === 0 ? (
                  <p>Henüz kayıt yok.</p>
                ) : (
                  <ul className="list">
                    {list.map((r, i) => {
                      const dup = (counts.get(norm(r.p1_name)) ?? 0) > 1 || (counts.get(norm(r.p2_name)) ?? 0) > 1;
                      return (
                        <li key={r.id}>
                          <div className="meta" style={{ flex: 1 }}>
                            <strong>
                              {i + 1}. {r.p1_name} / {r.p2_name}
                            </strong>
                            {dup && <span className="badge">Tekrar eden isim, kontrol edin</span>}
                          </div>
                          <button className="btn-del" onClick={() => removeReg(r)}>Sil</button>
                        </li>
                      );
                    })}
                  </ul>
                ))}
            </div>
          );
        })
      )}
    </>
  );
}

type LinkSettingProps = {
  settingKey: string;
  title: string;
  label: string;
  hint: string;
  savedText: string;
  clearedText: string;
  defaultUrl?: string;
};

// Bir site ayarındaki bağlantıyı (site_settings tablosunda) düzenler.
// Kayıt hiç yoksa defaultUrl gösterilir; boş kaydedilirse sitede ilgili düğme gizlenir.
function LinkSetting({ settingKey, title, label, hint, savedText, clearedText, defaultUrl }: LinkSettingProps) {
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    getBrowserSupabase()
      .from("site_settings")
      .select("value")
      .eq("key", settingKey)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as { value: string } | null;
        setUrl(row ? row.value : defaultUrl ?? "");
      });
  }, [settingKey, defaultUrl]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    let value = url.trim();
    if (value && !/^https?:\/\//i.test(value)) value = `https://${value}`;
    const { error } = await getBrowserSupabase()
      .from("site_settings")
      .upsert({ key: settingKey, value });
    setErr(!!error);
    setUrl(value);
    setMsg(error ? error.message : value ? savedText : clearedText);
  }

  const id = `link-${settingKey}`;
  return (
    <form className="panel" onSubmit={save}>
      <h2>{title}</h2>
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type="url"
          inputMode="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <p className="hint">{hint}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <button className="btn-admin">Kaydet</button>
        {url && /^https?:\/\//i.test(url) && (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 700, color: "var(--purple)" }}>
            Bağlantıyı dene
          </a>
        )}
      </div>
      {msg && <p className={`msg${err ? " err" : ""}`}>{msg}</p>}
    </form>
  );
}

function ResultsAndRankings() {
  return (
    <>
      <LinkSetting
        settingKey="results_url"
        title="Sonuç sayfası bağlantısı"
        label="Başka sitedeki sonuç adresi"
        hint={"Üst menüdeki \"Sonuçlar\" ve ana sayfadaki \"Son sonuçlar\" düğmeleri bu adrese gider (yeni sekmede açılır). Boş bırakırsanız ikisi de görünmez."}
        savedText={"Kaydedildi. Sitedeki \"Sonuçlar\" ve \"Son sonuçlar\" bu adrese gider."}
        clearedText="Bağlantı kaldırıldı, sonuç düğmeleri sitede gizlenir."
      />
      <LinkSetting
        settingKey="ranking_current_url"
        title="Kulüp güncel sıralaması"
        label="Federasyon güncel sıralama adresi"
        hint={"Ana sayfadaki \"Kulüp sıralaması\" bölümünde \"Güncel sıralama\" düğmesi bu adrese gider. Boş bırakırsanız düğme görünmez."}
        savedText="Kaydedildi."
        clearedText="Bağlantı kaldırıldı, düğme sitede gizlenir."
        defaultUrl={DEFAULT_RANKING_CURRENT_URL}
      />
      <LinkSetting
        settingKey="ranking_season_url"
        title="Kulüp sezon sıralaması"
        label="Federasyon sezon sıralaması adresi"
        hint={"\"Sezon sıralaması\" düğmesi bu adrese gider. Yeni sezon başlayınca federasyon sayfasından yeni yılın adresini kopyalayıp buraya yapıştırın."}
        savedText="Kaydedildi."
        clearedText="Bağlantı kaldırıldı, düğme sitede gizlenir."
        defaultUrl={DEFAULT_RANKING_SEASON_URL}
      />
    </>
  );
}

// Telefon fotoğraflarını yüklemeden önce küçültür (en uzun kenar 1600 px).
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    const { data } = await getBrowserSupabase()
      .from("photos")
      .select("id,url,caption")
      .order("created_at", { ascending: false });
    setPhotos((data as Photo[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    setErr(false);
    setMsg("");
    const sb = getBrowserSupabase();
    let done = 0;

    for (const file of files) {
      const blob = await shrink(file);
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error } = await sb.storage
        .from("gallery")
        .upload(path, blob, { contentType: blob.type || "image/jpeg" });
      if (error) {
        setErr(true);
        setMsg(error.message);
        break;
      }
      const { data } = sb.storage.from("gallery").getPublicUrl(path);
      const { error: dbError } = await sb.from("photos").insert({ url: data.publicUrl });
      if (dbError) {
        setErr(true);
        setMsg(dbError.message);
        break;
      }
      done += 1;
    }

    if (done > 0 && !err) setMsg(`${done} fotoğraf yüklendi.`);
    e.target.value = "";
    setBusy(false);
    load();
  }

  async function remove(p: Photo) {
    if (!confirm("Bu fotoğraf silinsin mi?")) return;
    const sb = getBrowserSupabase();
    const path = p.url.split("/gallery/")[1];
    if (path) await sb.storage.from("gallery").remove([path]);
    await sb.from("photos").delete().eq("id", p.id);
    load();
  }

  return (
    <>
      <div className="panel">
        <h2>Fotoğraf ekle</h2>
        <div className="field">
          <label htmlFor="g-files">Fotoğraflar (birden fazla seçebilirsiniz)</label>
          <input id="g-files" type="file" accept="image/*" multiple onChange={upload} disabled={busy} />
        </div>
        {busy && <p className="msg">Yükleniyor...</p>}
        {msg && <p className={`msg${err ? " err" : ""}`}>{msg}</p>}
      </div>

      <div className="panel">
        <h2>Galeri</h2>
        {photos.length === 0 ? (
          <p>Henüz fotoğraf yok.</p>
        ) : (
          <div className="thumbs">
            {photos.map((p) => (
              <div key={p.id} className="thumb">
                <img src={p.url} alt={p.caption ?? "Kulüp fotoğrafı"} />
                <button className="btn-del" onClick={() => remove(p)}>Sil</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ContactSettings() {
  const [values, setValues] = useState({ address: "", phone: "", email: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    getBrowserSupabase()
      .from("site_settings")
      .select("key,value")
      .then(({ data }) => {
        const next = { address: "", phone: "", email: "" };
        for (const row of (data as { key: string; value: string }[]) ?? []) {
          if (row.key in next) next[row.key as keyof typeof next] = row.value;
        }
        setValues(next);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await getBrowserSupabase()
      .from("site_settings")
      .upsert(Object.entries(values).map(([key, value]) => ({ key, value: value.trim() })));
    setErr(!!error);
    setMsg(error ? error.message : "Kaydedildi. Sitede en geç 1 dakika içinde görünür.");
  }

  return (
    <form className="panel" onSubmit={save}>
      <h2>İletişim bilgileri</h2>
      <div className="field">
        <label htmlFor="c-address">Adres</label>
        <textarea id="c-address" value={values.address} onChange={(e) => setValues({ ...values, address: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="c-phone">Telefon</label>
        <input id="c-phone" type="tel" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="c-email">E-posta</label>
        <input id="c-email" type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
      </div>
      <button className="btn-admin">Kaydet</button>
      {msg && <p className={`msg${err ? " err" : ""}`}>{msg}</p>}
    </form>
  );
}
