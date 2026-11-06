import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Yalnızca tarayıcıda (yönetim panelinde) kullanılır; oturum tarayıcıda saklanır.
let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
