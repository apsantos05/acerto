import Link from "next/link";
import { ArrowRight, BookOpenCheck, ChevronRight } from "lucide-react";
import { MaterialCard } from "@/components/biblioteca/material-card";
import { queryMaterials, type LibraryFilters } from "@/lib/materials";
import { SITE_URL } from "@/lib/catalog";

type Crumb = { label: string; href: string };

type CatalogCollectionProps = {
  title: string;
  intro: string;
  filters: LibraryFilters;
  breadcrumbs: Crumb[];
  previewCount?: number;
};

// Bloco reutilizável dos hubs de SEO: cabeçalho + grade de materiais filtrados
// + CTA para a biblioteca completa. Lê direto do banco (server-side).
export async function CatalogCollection({
  title,
  intro,
  filters,
  breadcrumbs,
  previewCount = 12,
}: CatalogCollectionProps) {
  let materials: Awaited<ReturnType<typeof queryMaterials>>["materials"] = [];
  let total = 0;
  try {
    const res = await queryMaterials(filters, 1, previewCount);
    materials = res.materials;
    total = res.total;
  } catch {
    materials = [];
    total = 0;
  }

  const libraryHref = `/biblioteca?${new URLSearchParams(
    Object.fromEntries(
      Object.entries(filters).filter(([, v]) => Boolean(v)) as [string, string][],
    ),
  ).toString()}`;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: `${SITE_URL}${c.href}`,
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <nav aria-label="Trilha" className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        {breadcrumbs.map((c, i) => (
          <span key={c.href} className="inline-flex items-center gap-1">
            {i > 0 ? <ChevronRight size={14} className="text-slate-300" /> : null}
            {i < breadcrumbs.length - 1 ? (
              <Link href={c.href} className="hover:text-sky-700">
                {c.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-700">{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">{intro}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-800 shadow-sm">
          <BookOpenCheck size={16} />
          {total.toLocaleString("pt-BR")} materiais disponíveis
        </div>
      </header>

      {materials.length > 0 ? (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
          <div className="mt-8">
            <Link
              href={libraryHref}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Ver todos os materiais
              <ArrowRight size={16} />
            </Link>
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            Materiais a caminho
          </h2>
          <p className="mt-2 text-slate-600">
            Estamos organizando o acervo desta página. Enquanto isso, explore a{" "}
            <Link href="/biblioteca" className="font-semibold text-sky-700">
              biblioteca completa
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
