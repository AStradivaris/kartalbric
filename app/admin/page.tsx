"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { formatDate, type Announcement, type Photo } from "@/lib/data";

type Tab = "duyurular" | "kayitlar" | "sonuclar" | "galeri" | "iletisim";

const TABS: { id: Tab; label: string }[] = [
  { id: "duyurular", label: "Duyurular" },
  { id: "kayitlar", label: "Kayıtlar" },
  { id: "sonuclar", label: "Sonuçlar" },
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
      {tab === "sonuclar" && (
        <>
          <ResultsLink />
          <Results />
        </>
      )}
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
      .select("id,title,body,image_url,address,event_id,published_at")
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

    const { error } = editing
      ? await sb.from("announcements").update(payload).eq("id", editing.id)
      : await sb.from("announcements").insert(payload);

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
        {items.length === 0 ? (
          <p>Henüz duyuru yok.</p>
        ) : (
          <ul className="list">
            {items.map((a) => (
              <li key={a.id}>
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

function ResultsLink() {
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    getBrowserSupabase()
      .from("site_settings")
      .select("value")
      .eq("key", "results_url")
      .maybeSingle()
      .then(({ data }) => setUrl((data as { value: string } | null)?.value ?? ""));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    let value = url.trim();
    if (value && !/^https?:\/\//i.test(value)) value = `https://${value}`;
    const { error } = await getBrowserSupabase()
      .from("site_settings")
      .upsert({ key: "results_url", value });
    setErr(!!error);
    setUrl(value);
    setMsg(
      error
        ? error.message
        : value
          ? "Kaydedildi. Sitede \"Tüm sonuçlar\" düğmesi bu adrese gider."
          : "Bağlantı kaldırıldı, düğme sitede gizlenir."
    );
  }

  return (
    <form className="panel" onSubmit={save}>
      <h2>Sonuç sayfası bağlantısı</h2>
      <div className="field">
        <label htmlFor="r-url">Başka sitedeki sonuç adresi</label>
        <input
          id="r-url"
          type="url"
          inputMode="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <p className="hint">
        Doldurursanız sitenin sonuçlar bölümünde "Tüm sonuçlar" düğmesi çıkar ve bu adrese gider.
        Boş bırakırsanız düğme görünmez.
      </p>
      <button className="btn-admin">Kaydet</button>
      {msg && <p className={`msg${err ? " err" : ""}`}>{msg}</p>}
    </form>
  );
}

type TournamentItem = { id: string; title: string; played_on: string };

function Results() {
  const [items, setItems] = useState<TournamentItem[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    const { data } = await getBrowserSupabase()
      .from("tournaments")
      .select("id,title,played_on")
      .order("played_on", { ascending: false });
    setItems((data as TournamentItem[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function fail(text: string) {
    setErr(true);
    setMsg(text);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(false);
    setMsg("");

    // Her satır: "Çift adı; skor". Sıra, satırın sırasıdır.
    const parsed = rows
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line, i) => {
        const cut = line.lastIndexOf(";");
        const pair = (cut === -1 ? line : line.slice(0, cut)).trim();
        const raw = cut === -1 ? "" : line.slice(cut + 1).trim().replace(",", ".");
        const score = raw === "" || Number.isNaN(Number(raw)) ? null : Number(raw);
        return { rank: i + 1, pair, score };
      });

    if (parsed.length === 0) return fail("En az bir satır sonuç girin.");

    const sb = getBrowserSupabase();
    const { data: t, error } = await sb
      .from("tournaments")
      .insert({ title: title.trim(), played_on: date })
      .select("id")
      .single();
    if (error || !t) return fail(error?.message ?? "Turnuva eklenemedi.");

    const { error: rowsError } = await sb
      .from("result_rows")
      .insert(parsed.map((r) => ({ ...r, tournament_id: t.id })));
    if (rowsError) {
      await sb.from("tournaments").delete().eq("id", t.id);
      return fail(rowsError.message);
    }

    setTitle("");
    setRows("");
    setMsg("Sonuçlar eklendi. Sitede en son tarihli turnuva gösterilir.");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Bu turnuva ve sonuçları silinsin mi?")) return;
    await getBrowserSupabase().from("tournaments").delete().eq("id", id);
    load();
  }

  return (
    <>
      <form className="panel" onSubmit={add}>
        <h2>Yeni turnuva sonucu</h2>
        <div className="field">
          <label htmlFor="t-title">Turnuva adı</label>
          <input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="t-date">Tarih</label>
          <input id="t-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="t-rows">Sonuçlar</label>
          <textarea
            id="t-rows"
            value={rows}
            onChange={(e) => setRows(e.target.value)}
            placeholder={"Ali Yılmaz / Veli Kaya; 58,40\nAyşe Demir / Fatma Şahin; 55,10"}
            required
          />
        </div>
        <p className="hint">
          Her satıra bir çift yazın: çift adları, noktalı virgül, skor. Birinci satır 1. sıra olur.
        </p>
        <button className="btn-admin">Kaydet</button>
        {msg && <p className={`msg${err ? " err" : ""}`}>{msg}</p>}
      </form>

      <div className="panel">
        <h2>Turnuvalar</h2>
        {items.length === 0 ? (
          <p>Henüz turnuva yok.</p>
        ) : (
          <ul className="list">
            {items.map((t) => (
              <li key={t.id}>
                <div className="meta">
                  <strong>{t.title}</strong>
                  <span>{formatDate(t.played_on)}</span>
                </div>
                <button className="btn-del" onClick={() => remove(t.id)}>Sil</button>
              </li>
            ))}
          </ul>
        )}
      </div>
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
