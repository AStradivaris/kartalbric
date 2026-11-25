"use client";

import { useEffect } from "react";

// Supabase şifre sıfırlama bağlantısı bazen sitenin ana sayfasına döner
// (#access_token=...&type=recovery). Böyle bir adres hangi sayfaya gelirse
// gelsin şifre ekranına yönlendirilir.
export default function RecoveryRedirect() {
  useEffect(() => {
    const { hash, pathname, search } = window.location;
    const isRecovery = /type=recovery/.test(hash) || /type=recovery/.test(search);
    if (isRecovery && pathname !== "/admin/sifre") {
      window.location.replace(`/admin/sifre${search}${hash}`);
    }
  }, []);
  return null;
}
