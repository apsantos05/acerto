import Link from "next/link";
import { CalendarDays, Eye, FileText, LinkIcon, Plus } from "lucide-react";
import { MaterialStatusBadge } from "@/components/biblioteca/material-status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { getMyMaterials } from "@/lib/materials";

export default async function MeusMateriaisPage() {
  const { materials, error } = await getMyMaterials();

  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          eyebrow="Biblioteca"
          title="Meus materiais"
          description="Acompanhe os materiais que você enviou e o status de aprovação de cada item."
        />
        <Link
          href="/biblioteca/enviar"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 dark:bg-white px-4 py-3 text-sm font-semibold text-white dark:text-slate-950 transition hover:bg-slate-800 dark:hover:bg-slate-200"
        >
          <Plus size={18} />
          Enviar material
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-300">
          {error}
        </div>
      ) : null}

      {materials.length > 0 ? (
        <div className="grid gap-4">
          {materials.map((material) => (
            <article
              key={material.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <MaterialStatusBadge status={material.status} />
                  <h2 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
                    {material.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {material.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/biblioteca/${material.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Ver detalhe
                  </Link>
                  {material.fileUrl || material.externalUrl ? (
                    <a
                      href={material.externalUrl ?? material.fileUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-slate-950 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-slate-950 transition hover:bg-slate-800 dark:hover:bg-slate-200"
                    >
                      Abrir
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-4">
                <span className="inline-flex items-center gap-2">
                  <FileText size={16} className="text-sky-700 dark:text-sky-400" />
                  {material.materialType}
                </span>
                <span className="inline-flex items-center gap-2">
                  {material.uploadKind === "link" ? (
                    <LinkIcon size={16} className="text-sky-700 dark:text-sky-400" />
                  ) : (
                    <FileText size={16} className="text-sky-700 dark:text-sky-400" />
                  )}
                  {material.uploadKind === "link" ? "Link externo" : "Arquivo"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={16} className="text-sky-700 dark:text-sky-400" />
                  {material.year} · {material.subject}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Eye size={16} className="text-sky-700 dark:text-sky-400" />
                  {material.viewsCount.toLocaleString("pt-BR")} visualizações
                </span>
              </div>

              {material.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {material.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Nenhum material enviado
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Quando você enviar um material, ele aparecerá aqui como pendente de
            aprovação.
          </p>
          <Link
            href="/biblioteca/enviar"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 dark:bg-white px-4 py-3 text-sm font-semibold text-white dark:text-slate-950"
          >
            <Plus size={18} />
            Enviar material
          </Link>
        </div>
      )}
    </AppShell>
  );
}
