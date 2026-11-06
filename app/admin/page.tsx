"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { formatDate, type Announcement, type Photo } from "@/lib/data";

type Tab = "duyurular" | "sonuclar" | "galeri" | "iletisim";

const TABS: { id: Tab; label: string }[] = [
  { id: "duyurular", label: "Duyurular" },
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
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data } = await getBrowserSupabase()
      .from("announcements")
      .select("id,title,body,image_url,published_at")
      .order("published_at", { ascending: false });
    setItems((data as Announcement[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const sb = getBrowserSupabase();

    let image_url: string | null = null;
    if (file) {
      const blob = await shrink(file);
      const path = `announcements/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error: upError } = await sb.storage
        .from("gallery")
        .upload(path, blob, { contentType: blob.type || "image/jpeg" });
      if (upError) return setMsg(upError.message);
      image_url = sb.storage.from("gallery").getPublicUrl(path).data.publicUrl;
    }

    const { error } = await sb
      .from("announcements")
      .insert({ title: title.trim(), body: body.trim(), image_url });
    if (error) return setMsg(error.message);
    setTitle("");
    setBody("");
    setFile(null);
    setFileKey((k) => k + 1);
    setMsg("Duyuru eklendi. Sitede en geç 1 dakika içinde görünür.");
    load();
  }

  async function remove(a: Announcement) {
    if (!confirm("Bu duyuru silinsin mi?")) return;
    const sb = getBrowserSupabase();
    const path = a.image_url?.split("/gallery/")[1];
    if (path) await sb.storage.from("gallery").remove([path]);
    await sb.from("announcements").delete().eq("id", a.id);
    load();
  }

  return (
    <>
      <form className="panel" onSubmit={add}>
        <h2>Yeni duyuru</h2>
        <div className="field">
          <label htmlFor="a-title">Başlık</label>
          <input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="a-body">Metin</label>
          <textarea id="a-body" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="a-image">Fotoğraf (isteğe bağlı)</label>
          <input
            key={fileKey}
            id="a-image"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <button className="btn-admin">Yayınla</button>
        {msg && <p className="msg">{msg}</p>}
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
                <button className="btn-del" onClick={() => remove(a)}>Sil</button>
              </li>
            ))}
          </ul>
        )}
      </div>
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
