import { Download, Filter, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { materials } from "@/lib/mock-data";

export default function BibliotecaPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Acervo"
        title="Biblioteca"
        description="Encontre provas, simulados, resumos e listas organizados por disciplina e tipo."
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input
            placeholder="Buscar por material, matéria ou banca"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          <Filter size={18} />
          Filtrar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {materials.map((material) => (
          <article
            key={material.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
                  {material.type}
                </span>
                <h2 className="mt-4 text-lg font-semibold text-slate-950">
                  {material.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {material.subject}
                </p>
              </div>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white"
                aria-label="Baixar material"
              >
                <Download size={18} />
              </button>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
              <span className="text-slate-500">Avaliação</span>
              <span className="font-semibold text-emerald-600">
                {material.score}
              </span>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
