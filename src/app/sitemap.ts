import type { MetadataRoute } from "next";
import {
  SITE_URL,
  UNIVERSITIES,
  SUBJECTS,
  VESTIBULARES,
} from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes = [
    "",
    "/biblioteca",
    "/simulados",
    "/ranking",
    "/feed",
    "/planos",
    "/universidades",
    "/materias",
    "/vestibulares",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const catalogRoutes = [
    ...UNIVERSITIES.map((u) => `/universidades/${u.slug}`),
    ...SUBJECTS.map((s) => `/materias/${s.slug}`),
    ...VESTIBULARES.map((v) => `/vestibulares/${v.slug}`),
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...catalogRoutes];
}
