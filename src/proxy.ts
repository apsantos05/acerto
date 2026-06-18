import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/dashboard/:path*",
    "/biblioteca/enviar",
    "/biblioteca/enviar/:path*",
    "/feed/:path*",
    "/meus-materiais",
    "/meus-materiais/:path*",
    "/perfil",
    "/configuracoes/perfil",
    "/configuracoes/perfil/:path*",
    "/login",
    "/cadastro",
  ],
};
