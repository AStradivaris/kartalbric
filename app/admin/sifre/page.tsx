"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

// Şifre değiştirme ekranı. İki yoldan açılır:
//  1) Giriş yapmış yönetici, panelden "Şifre değiştir"e basar.
//  2) "Şifremi unuttum" e-postasındaki bağlantı buraya gelir; bağlantıdaki
//     kod oturumu açar (supabase-js adresteki #access_token'ı kendisi okur).
export default function PasswordPage() {
  const [state, setState] = useState<"loading" | "ready" | "nosession" | "done">("loading");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    const sb = getBrowserSupabase();
    let done = false;
    const ready = (mail?: string) => {
      done = true;
      setEmail(mail ?? "");
      setState("ready");
    };
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (session) ready(session.user.email);
    });
    (async () => {
      // PKCE akışında bağlantı ?code= ile gelir
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) await sb.auth.exchangeCodeForSession(code).catch(() => null);
      const { data } = await sb.auth.getSession();
      if (data.session) ready(data.session.user.email);
      // Adresteki anahtar biraz geç işlenebilir; kısa bir süre bekle
      setTimeout(() => {
        if (!done) setState("nosession");
      }, 1500);
    })();
    return () => sub.subscription.unsubscribe();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(false);
    setMsg("");
    if (pw.length < 8) {
      setErr(true);
      setMsg("Şifre en az 8 karakter olmalı.");
      return;
    }
    if (pw !== pw2) {
      setErr(true);
      setMsg("İki şifre aynı değil.");
      return;
    }
    setBusy(true);
    const { error } = await getBrowserSupabase().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setErr(true);
      setMsg(
        error.code === "same_password" || /different from the old/i.test(error.message)
          ? "Yeni şifre eski şifreden farklı olmalı. Başka bir şifre deneyin."
          : error.message
      );
      return;
    }
    // Adres çubuğundaki kodu temizle
    window.history.replaceState(null, "", "/admin/sifre");
    setState("done");
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(false);
    const { error } = await getBrowserSupabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/sifre`,
    });
    setBusy(false);
    if (error) {
      setErr(true);
      setMsg(error.message);
    } else {
      setMsg("Sıfırlama bağlantısı e-postanıza gönderildi. E-postadaki bağlantıya dokunun.");
    }
  }

  return (
    <main className="admin" style={{ maxWidth: 420 }}>
      <h1 style={{ marginBottom: 20 }}>Şifre değiştir</h1>

      {state === "loading" && <p className="hint">Yükleniyor...</p>}

      {state === "ready" && (
        <form className="panel" onSubmit={save}>
          {email && (
            <p className="hint" style={{ margin: "0 0 16px" }}>
              Hesap: <strong>{email}</strong>
            </p>
          )}
          <div className="field">
            <label htmlFor="pw">Yeni şifre</label>
            <input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="pw2">Yeni şifre (tekrar)</label>
            <input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
          </div>
          <button className="btn-admin" disabled={busy}>
            {busy ? "Kaydediliyor..." : "Şifreyi kaydet"}
          </button>
          {msg && <p className={`msg${err ? " err" : ""}`}>{msg}</p>}
        </form>
      )}

      {state === "done" && (
        <div className="panel">
          <p style={{ marginTop: 0 }}>Şifreniz değiştirildi. Bundan sonra yeni şifrenizle giriş yapabilirsiniz.</p>
          <a className="btn-admin" href="/admin" style={{ display: "inline-flex", alignItems: "center" }}>
            Yönetim paneline git
          </a>
        </div>
      )}

      {state === "nosession" && (
        <form className="panel" onSubmit={sendLink}>
          <p className="hint" style={{ margin: "0 0 16px" }}>
            Giriş yapılmamış ya da sıfırlama bağlantısının süresi dolmuş. E-posta adresinizi yazın, yeni bir sıfırlama
            bağlantısı gönderelim.
          </p>
          <div className="field">
            <label htmlFor="mail">E-posta</label>
            <input id="mail" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn-admin" disabled={busy}>
            {busy ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
          </button>
          {msg && <p className={`msg${err ? " err" : ""}`}>{msg}</p>}
          <p className="hint" style={{ marginTop: 16 }}>
            <a href="/admin">‹ Girişe dön</a>
          </p>
        </form>
      )}
    </main>
  );
}
