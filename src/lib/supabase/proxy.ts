import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

const exactPrivateRoutes = [
  "/perfil",
  "/configuracoes/perfil",
];

const privateRoutes = [
  "/admin",
  "/dashboard",
  "/biblioteca/enviar",
  "/feed",
  "/meus-materiais",
];

const authRoutes = ["/login", "/cadastro"];

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function isRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function applySupabaseCookies(response: NextResponse, cookies: CookieToSet[]) {
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPrivateRoute =
    exactPrivateRoutes.includes(pathname) || isRoute(pathname, privateRoutes);
  const isAuthRoute = isRoute(pathname, authRoutes);
  let supabaseConfig: ReturnType<typeof getSupabaseConfig>;

  try {
    supabaseConfig = getSupabaseConfig();
  } catch {
    if (isPrivateRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("authConfig", "missing");

      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next({ request });
  }

  const cookiesToSet: CookieToSet[] = [];
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseConfig.supabaseUrl,
    supabaseConfig.supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(nextCookies) {
          cookiesToSet.splice(0, cookiesToSet.length, ...nextCookies);

          nextCookies.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          nextCookies.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub) && !error;

  if (isPrivateRoute && !isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);

    return applySupabaseCookies(
      NextResponse.redirect(redirectUrl),
      cookiesToSet,
    );
  }

  if (isAuthRoute && isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";

    return applySupabaseCookies(
      NextResponse.redirect(redirectUrl),
      cookiesToSet,
    );
  }

  return supabaseResponse;
}
