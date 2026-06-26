import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Crown,
  Lock,
  PenLine,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { getSubmission } from "@/lib/redacoes-data";
import { getViewer, viewerIsPremium } from "@/lib/gating";
import { EXAM_LABELS, AI_DISCLAIMER } from "@/lib/essay-ai";

export const metadata: Metadata = {
  title: "Resultado da redação",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ id: string }> };

const COMPETENCIAS = [
  "Competência 1 — Norma culta",
  "Competência 2 — Compreensão do tema",
  "Competência 3 — Argumentação",
  "Competência 4 — Coesão",
  "Competência 5 — Proposta de intervenção",
];

function scoreColor(pct: number) {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export default async function RedacaoResultadoPage({ params }: PageProps) {
  const { id } = await params;
  const sub = await getSubmission(id);
  if (!sub) notFound();

  const viewer = await getViewer();
  const full = viewerIsPremium(viewer); // premium, premium_med ou admin
  const isEnem = sub.examType === "enem";
  const max = isEnem ? 1000 : 100;
  const comps = [sub.competencia1, sub.competencia2, sub.competencia3, sub.competencia4, sub.competencia5];

  return (
    <AppShell>
      <Link
        href="/redacoes"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950 dark:text-sky-400 dark:hover:text-sky-300"
      >
        <ArrowLeft size={17} />
        Voltar para redações
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
          {EXAM_LABELS[sub.examType]}
        </span>
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">
          {sub.theme || "Redação"}
        </h1>
      </div>

      {sub.status === "processing" ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Sua redação está sendo corrigida. Recarregue a página em instantes.
          </p>
        </div>
      ) : sub.status === "failed" ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <AlertTriangle className="mx-auto text-red-600 dark:text-red-400" size={28} />
          <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
            Não foi possível corrigir desta vez
          </h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            Tivemos um problema ao processar sua redação. Tente enviar novamente — não
            descontamos da sua cota por falhas.
          </p>
          <Link
            href="/redacoes/nova"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <PenLine size={16} /> Tentar de novo
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Nota */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">
              Nota estimada
            </p>
            <p className="mt-1 text-5xl font-bold text-slate-950 dark:text-white">
              {sub.scoreTotal ?? 0}
              <span className="text-2xl text-slate-400 dark:text-slate-500">/{max}</span>
            </p>
            {sub.feedbackGeneral ? (
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {sub.feedbackGeneral}
              </p>
            ) : null}
            <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Sparkles size={12} /> {AI_DISCLAIMER}
            </p>
          </section>

          {/* Competências (ENEM) */}
          {isEnem && comps.some((c) => c != null) ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Competências</h2>
              <div className="mt-4 space-y-3">
                {COMPETENCIAS.map((label, i) => {
                  const v = comps[i] ?? 0;
                  const pctv = (v / 200) * 100;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
                        <span className="font-semibold text-slate-950 dark:text-white">{v}/200</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-2 rounded-full ${scoreColor(pctv)}`} style={{ width: `${pctv}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {full ? (
            <>
              {/* Feedback detalhado */}
              <section className="grid gap-4 md:grid-cols-2">
                {[
                  ["Estrutura", sub.feedbackStructure],
                  ["Gramática", sub.feedbackGrammar],
                  ["Argumentação", sub.feedbackArgumentation],
                  ...(isEnem ? [["Proposta de intervenção", sub.feedbackIntervention] as const] : []),
                ].map(([title, body]) =>
                  body ? (
                    <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{body}</p>
                    </div>
                  ) : null,
                )}
              </section>

              {/* Fortes / fracos */}
              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                    <ThumbsUp size={16} className="text-emerald-600 dark:text-emerald-400" /> Pontos fortes
                  </h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-200">
                    {sub.strengths.length > 0 ? sub.strengths.map((x) => (
                      <li key={x} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{x}</li>
                    )) : <li className="text-slate-500 dark:text-slate-400">—</li>}
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" /> Pontos a melhorar
                  </h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-200">
                    {sub.weaknesses.length > 0 ? sub.weaknesses.map((x) => (
                      <li key={x} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{x}</li>
                    )) : <li className="text-slate-500 dark:text-slate-400">—</li>}
                  </ul>
                </div>
              </section>

              {/* Reescrita sugerida */}
              {sub.suggestedRewrite ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Sugestão de reescrita</h2>
                  <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                    {sub.suggestedRewrite}
                  </p>
                </section>
              ) : null}
            </>
          ) : (
            /* Prévia limitada (Free) */
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                <Lock size={18} className="text-amber-600 dark:text-amber-400" /> Feedback completo é Premium
              </h2>
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
                Você está vendo a <strong>prévia</strong>: nota e resumo geral. O feedback
                detalhado por competência, pontos fortes/fracos e a sugestão de reescrita
                fazem parte do Premium.
              </p>
              <Link
                href="/planos"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                <Crown size={16} /> Liberar feedback completo
              </Link>
            </section>
          )}

          <Link
            href="/redacoes/nova"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <PenLine size={16} /> Corrigir outra redação
          </Link>
        </div>
      )}
    </AppShell>
  );
}
