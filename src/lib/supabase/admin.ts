// ATENÇÃO: módulo exclusivamente de servidor. Nunca importe em componentes
// client (a SUPABASE_SERVICE_ROLE_KEY jamais pode ir para o browser).
import { createClient } from "@supabase/supabase-js";

/**
 * Client com SERVICE ROLE — ignora RLS. USO EXCLUSIVO no servidor
 * (webhooks/route handlers). NUNCA importe isto em componentes client.
 * A chave vem de SUPABASE_SERVICE_ROLE_KEY (sem prefixo NEXT_PUBLIC_).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
