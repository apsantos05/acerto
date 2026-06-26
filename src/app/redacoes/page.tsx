import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Crown, FileText, PenLine, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { getViewer, canSubmitEssay } from "@/lib/gating";
import { getMySubmissions } from "@/lib/redacoes-data";
import { EXAM_LABELS } from "@/lib/essay-ai";

export const metadata: Metadata = {
  title: "Correção de redação por IA",
  description:
    "Envie sua redação e receba uma correção automática por IA no estilo ENEM, FUVEST, UNICAMP e vestibulares de Medicina.",
  alternates: { canonical: "/redacoes" },
};

function statusBadge(status: string, score: number | null, examType: string) {
  if (status === "completed") {
    const max = examType === "enem" ? 1000 : 100;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
        {score ?? 0}/{max}
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300">
        Falhou
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
      Corrigindo...
    </span>
  );
}

export default async function RedacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const viewer = await getViewer();
  const [submissions, quota] = await Promise.all([
    getMySubmissions(),
    canSubmitEssay(viewer),
  ]);

  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          eyebrow="Redação com IA"
          title="Suas redações"
          description="Envie sua redação e receba nota estimada, feedback por competência e sugestões — no estilo ENEM e dos vestibulares de Medicina."
        />
        {quota.allowed ? (
          <Link
            href="/redacoes/nova"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <PenLine size={16} />
            Nova redação
          </Link>
        ) : (
          <Link
            href="/planos"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <Crown size={16} />
            Liberar mais correções
          </Link>
        )}
      </div>

      {/* Cota do plano */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
        <Sparkles size={15} />
        {viewer.isAdmin ? (
          <span>Admin — correções ilimitadas.</span>
        ) : (
          <span>
            {quota.used}/{quota.limit} correções usadas este mês.
            {!quota.allowed ? " Faça upgrade para continuar." : ""}
          </span>
        )}
      </div>

      {submissions.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {submissions.map((s) => (
            <Link
              key={s.id}
              href={`/redacoes/${s.id}`}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
                  <FileText size={13} />
                  {EXAM_LABELS[s.examType]}
                </span>
                {statusBadge(s.status, s.scoreTotal, s.examType)}
              </div>
              <p className="line-clamp-2 text-sm font-semibold text-slate-950 dark:text-white">
                {s.theme || "Sem tema informado"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {s.wordCount} palavras · {new Date(s.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <PenLine className="mx-auto text-slate-400 dark:text-slate-500" />
          <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
            Nenhuma redação ainda
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Envie sua primeira redação e receba uma correção em segundos.
          </p>
          {quota.allowed ? (
            <Link
              href="/redacoes/nova"
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Enviar redação
            </Link>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
