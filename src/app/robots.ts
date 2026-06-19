import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/catalog";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Áreas privadas / autenticadas não precisam ser indexadas.
      disallow: [
        "/admin",
        "/configuracoes",
        "/dashboard",
        "/meus-materiais",
        "/favoritos",
        "/login",
        "/cadastro",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
