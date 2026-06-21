import Link from "next/link";
import type { Metadata } from "next";
import { BookOpenCheck, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { LibraryFilters } from "@/components/biblioteca/library-filters";
import { MaterialCard } from "@/components/biblioteca/material-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { getLibraryData, type LibraryFilters as Filters } from "@/lib/materials";

export const metadata: Metadata = {
  title: "Biblioteca de materiais para vestibulares de Medicina",
  description:
    "Provas, gabaritos, apostilas, simulados, resumos e redações organizados por universidade, vestibular, ano e matéria. Acervo gratuito para quem vai cursar Medicina.",
  alternates: { canonical: "/biblioteca" },
};

type BibliotecaPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(filters: Filters, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/biblioteca?${qs}` : "/biblioteca";
}

export default async function BibliotecaPage({
  searchParams,
}: BibliotecaPageProps) {
  const params = (await searchParams) ?? {};
  const filters: Filters = {
    search: getParam(params, "search"),
    vestibular: getParam(params, "vestibular"),
    faculdade: getParam(params, "faculdade"),
    year: getParam(params, "year"),
    subject: getParam(params, "subject"),
    materialType: getParam(params, "materialType"),
  };
  const page = Math.max(1, Number(getParam(params, "page")) || 1);
  const { materials, options, isMock, total, totalPages } = await getLibraryData(
    filters,
    page,
  );

  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          eyebrow="Acervo"
          title="Biblioteca"
          description="Encontre provas, gabaritos, simulados, resumos, listas e mapas mentais organizados por vestibular, faculdade, ano e matéria."
        />
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-sky-800 dark:text-sky-400 shadow-sm">
            <BookOpenCheck size={17} />
            {total.toLocaleString("pt-BR")} materiais
          </div>
          <Link
            href="/biblioteca/enviar"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-slate-950 transition hover:bg-slate-800 dark:hover:bg-slate-200"
          >
            <Plus size={17} />
            Enviar material
          </Link>
          <Link
            href="/meus-materiais"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Meus materiais
          </Link>
        </div>
      </div>

      {isMock ? (
        <div className="mb-5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-300">
          Exibindo dados temporários. Configure o Supabase e execute o schema
          para carregar materiais reais.
        </div>
      ) : null}

      <LibraryFilters filters={filters} options={options} />

      {materials.length > 0 ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              className="mt-8 flex items-center justify-between gap-3"
              aria-label="Paginação"
            >
              {page > 1 ? (
                <Link
                  href={pageHref(filters, page - 1)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Página {page} de {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={pageHref(filters, page + 1)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Próxima
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Nenhum material encontrado
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Ajuste os filtros ou busque por outro vestibular, matéria ou tipo de
            material.
          </p>
        </div>
      )}
    </AppShell>
  );
}
