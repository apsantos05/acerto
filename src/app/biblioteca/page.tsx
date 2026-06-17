import Link from "next/link";
import { BookOpenCheck, Plus } from "lucide-react";
import { LibraryFilters } from "@/components/biblioteca/library-filters";
import { MaterialCard } from "@/components/biblioteca/material-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { getLibraryData, type LibraryFilters as Filters } from "@/lib/materials";

type BibliotecaPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: keyof Filters,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
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
  const { materials, options, isMock } = await getLibraryData(filters);

  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          eyebrow="Acervo"
          title="Biblioteca"
          description="Encontre provas, gabaritos, simulados, resumos, listas e mapas mentais organizados por vestibular, faculdade, ano e matéria."
        />
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-800 shadow-sm">
            <BookOpenCheck size={17} />
            {materials.length} materiais
          </div>
          <Link
            href="/biblioteca/enviar"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={17} />
            Enviar material
          </Link>
          <Link
            href="/meus-materiais"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Meus materiais
          </Link>
        </div>
      </div>

      {isMock ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Exibindo dados temporários. Configure o Supabase e execute o schema
          para carregar materiais reais.
        </div>
      ) : null}

      <LibraryFilters filters={filters} options={options} />

      {materials.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {materials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            Nenhum material encontrado
          </h2>
          <p className="mt-2 text-slate-600">
            Ajuste os filtros ou busque por outro vestibular, matéria ou tipo de
            material.
          </p>
        </div>
      )}
    </AppShell>
  );
}
