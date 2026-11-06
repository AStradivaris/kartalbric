"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

const clean = (s: string) => s.trim().replace(/\s+/g, " ");
const hasTwoWords = (s: string) => clean(s).split(" ").length >= 2;

export default function RegistrationForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [trap, setTrap] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(true);
    setMsg("");

    // Gizli alan botlar içindir; doluysa sessizce başarılıymış gibi davranırız.
    if (trap) {
      setErr(false);
      setMsg("Kaydınız alındı. Teşekkürler!");
      return;
    }

    const a = clean(p1);
    const b = clean(p2);
    if (!hasTwoWords(a) || !hasTwoWords(b)) {
      return setMsg("Her oyuncu için ad ve soyad yazın.");
    }
    if (a.toLowerCase() === b.toLowerCase()) {
      return setMsg("İki oyuncu aynı kişi olamaz.");
    }

    setBusy(true);
    const { error } = await getBrowserSupabase()
      .from("registrations")
      .insert({ event_id: eventId, p1_name: a, p2_name: b });
    setBusy(false);

    if (error) {
      return setMsg(
        error.code === "23505"
          ? "Bu çift bu turnuvaya zaten kayıtlı."
          : "Kayıt yapılamadı. Kayıtlar kapanmış olabilir, lütfen tekrar deneyin."
      );
    }

    setErr(false);
    setP1("");
    setP2("");
    setMsg("Kaydınız alındı. Teşekkürler!");
    router.refresh();
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <h2>Çift olarak kayıt ol</h2>
      <div className="form-field">
        <label htmlFor="p1">1. oyuncu (ad ve soyad)</label>
        <input id="p1" value={p1} onChange={(e) => setP1(e.target.value)} maxLength={80} autoComplete="off" required />
      </div>
      <div className="form-field">
        <label htmlFor="p2">2. oyuncu (ad ve soyad)</label>
        <input id="p2" value={p2} onChange={(e) => setP2(e.target.value)} maxLength={80} autoComplete="off" required />
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="website">Web sitesi</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
      </div>
      <button className="btn-submit" disabled={busy}>
        {busy ? "Gönderiliyor..." : "Kayıt ol"}
      </button>
      {msg && <p className={`form-msg${err ? " err" : ""}`}>{msg}</p>}
    </form>
  );
}
