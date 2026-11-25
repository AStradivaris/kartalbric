// Yönetici kullanıcı adları: girişte e-posta yerine bu adlar yazılabilir.
// Supabase giriş için e-posta istediğinden ad, arka planda e-postaya çevrilir.
const USERNAMES: Record<string, string> = {
  kbsk: "cnkorkmaz90@gmail.com",
};

/** "KBSK" -> e-posta; e-posta yazıldıysa aynen döner */
export function resolveAdminLogin(input: string): string {
  const v = input.trim();
  return USERNAMES[v.toLocaleLowerCase("tr-TR")] ?? v;
}
