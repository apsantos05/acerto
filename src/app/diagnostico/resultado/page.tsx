import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Crown,
  ListChecks,
  ThumbsUp,
  Trophy,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { getDiagnostico } from "@/lib/diagnostico-data";
import { getViewer, viewerIsPremiumMed } from "@/lib/gating";
import { getTrackBySlug } from "@/lib/tracks";
import { PLAN_LABEL } from "@/lib/plan";

export const metadata: Metadata = {
  title: "Seu Diagnóstico de Aprovação",
  description:
    "Resultado do seu Diagnóstico de Aprovação: score, perfil, riscos e a trilha recomendada para Medicina.",
  robots: { index: false, follow: false },
};

type ResultPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 45) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default async function DiagnosticoResultadoPage({ searchParams }: ResultPageProps) {
  const sp = (await searchParams) ?? {};
  const id = typeof sp.id === "string" ? sp.id : Array.isArray(sp.id) ? sp.id[0] : "";
  if (!id) notFound();

  const diagnostic = await getDiagnostico(id);
  if (!diagnostic) notFound();

  const r = diagnostic.result;
  const [viewer, track] = await Promise.all([
    getViewer(),
    r.recommendedTrackSlug ? getTrackBySlug(r.recommendedTrackSlug) : Promise.resolve(null),
  ]);

  // CTA do plano: se já é premium_med, leva a iniciar a trilha; senão, /planos.
  const alreadyTopPlan = viewerIsPremiumMed(viewer);
  const trackHref = track ? `/trilhas/${track.slug}` : "/trilhas";

  return (
    <AppShell>
      <Link
        href="/diagnostico"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950 dark:text-sky-400 dark:hover:text-sky-300"
      >
        Refazer diagnóstico
      </Link>

      {/* Score + perfil */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">
              Score de preparação
            </p>
            <p className={`mt-1 text-6xl font-bold ${scoreColor(r.preparationScore)}`}>
              {r.preparationScore}
              <span className="text-2xl text-slate-400 dark:text-slate-500">/100</span>
            </p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Trophy size={15} /> {r.studentProfile}
            </p>
          </div>
          <div className="max-w-md rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
            <p className="font-semibold text-slate-950 dark:text-white">Chance estimada de aprovação</p>
            <p className="mt-1">{r.approvalChance}</p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Pontos fortes / fracos */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
            <ThumbsUp size={18} className="text-emerald-600 dark:text-emerald-400" />
            Pontos fortes
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.strongSubjects.length > 0 ? (
              r.strongSubjects.map((s) => (
                <span key={s} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {s}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400">Não informado.</span>
            )}
          </div>
          <h2 className="mt-6 flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
            Pontos fracos
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.weakSubjects.length > 0 ? (
              r.weakSubjects.map((s) => (
                <span key={s} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                  {s}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400">Não informado.</span>
            )}
          </div>
        </div>

        {/* Riscos */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
            <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
            Riscos principais
          </h2>
          {r.risks.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {r.risks.map((risk) => (
                <li key={risk} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  {risk}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Nenhum risco crítico identificado — continue assim!
            </p>
          )}
        </div>
      </div>

      {/* Trilha recomendada */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
          <Compass size={18} className="text-sky-700 dark:text-sky-400" />
          Trilha recomendada
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {track ? (
            <>Com base nas suas respostas, a melhor trilha é a <strong className="text-slate-950 dark:text-white">{track.title}</strong>.</>
          ) : (
            <>Explore as trilhas por universidade para escolher seu caminho.</>
          )}
        </p>
        <Link
          href={trackHref}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          {track ? "Iniciar trilha recomendada" : "Ver trilhas"}
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* Recomendação de plano */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm dark:border-amber-500/30 dark:from-amber-500/10 dark:to-slate-900">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
          <Crown size={18} className="text-amber-500" />
          Plano recomendado: {PLAN_LABEL[r.recommendedPlan]}
        </h2>
        <p className="mt-2 max-w-2xl text-slate-700 dark:text-slate-200">{r.recommendedPlanReason}</p>
        {r.recommendedPlan === "premium_med" ? (
          <ul className="mt-3 grid gap-1 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> Trilhas completas por universidade</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> Simulados oficiais por banca</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> Cronograma personalizado</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> Materiais premium + progresso</li>
          </ul>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {alreadyTopPlan ? (
            <Link href={trackHref} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
              Você já é Premium Medicina — iniciar trilha <ArrowRight size={16} />
            </Link>
          ) : (
            <Link href="/planos" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
              <Crown size={16} /> Ver planos
            </Link>
          )}
          <Link href="/simulados" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <ListChecks size={16} /> Fazer um simulado
          </Link>
        </div>
      </section>

      {/* Próximas ações */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
          <BookOpen size={18} className="text-sky-700 dark:text-sky-400" />
          Próximas ações
        </h2>
        <ul className="mt-3 space-y-2">
          {r.nextActions.map((action) => (
            <li key={action} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
              {action}
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
