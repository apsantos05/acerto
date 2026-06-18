import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();

  if (process.env.NODE_ENV !== "production") {
    // Loga só o host e o tamanho da chave — nunca a chave em si.
    console.info(
      "[supabase] client criado para host:",
      new URL(supabaseUrl).host,
      "| key length:",
      supabaseKey.length,
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
