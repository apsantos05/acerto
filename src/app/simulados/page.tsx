import Link from "next/link";
import type { Metadata } from "next";
import {
  Clock,
  Crown,
  FileQuestion,
  GraduationCap,
  History,
  Play,
  Trophy,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import {
  getOfficialSimulados,
  getQuickSimulados,
  type SimuladoSummary,
} from "@/lib/simulados";

export const metadata: Metadata = {
  title: "Simulados — oficiais e rápidos",
  description:
    "Simulados oficiais que reproduzem ENEM, FUVEST, UNICAMP, UNESP, UFSC, FAMERP, Einstein, Santa Casa e SLMandic, com cronômetro real, desempenho por matéria e TRI estimado.",
  alternates: { canonical: "/simulados" },
};

function planBadge(plan: SimuladoSummary["planRequired"]) {
  if (plan === "premium_med")
    return { label: "Premium Medicina", cls: "bg-gradient-to-r from-amber-400 to-amber-600 text-white" };
  if (plan === "premium")
    return { label: "Premium", cls: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" };
  return null;
}

function hhmm(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}` : `${m}min`;
}

function SimuladoCard({ sim }: { sim: SimuladoSummary }) {
  const badge = sim.kind === "oficial" ? planBadge(sim.planRequired) : null;
  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500/40">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
            <GraduationCap size={14} />
            {sim.vestibular}
            {sim.examDay ? ` · ${sim.examDay}º dia` : ""}
          </span>
          {badge ? (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${badge.cls}`}>
              <Crown size={11} />
              {badge.label}
            </span>
          ) : null}
        </div>
        <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">{sim.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{sim.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-2">
            <FileQuestion size={16} className="text-sky-700 dark:text-sky-400" />
            {sim.officialQuestions || sim.questionCount} questões
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock size={16} className="text-sky-700 dark:text-sky-400" />
            {hhmm(sim.durationMinutes)}
          </span>
        </div>
      </div>
      <Link
        href={`/simulados/${sim.id}`}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
      >
        <Play size={16} />
        Começar
      </Link>
    </article>
  );
}

export default async function SimuladosPage() {
  const [oficiais, rapidos] = await Promise.all([
    getOfficialSimulados(),
    getQuickSimulados(),
  ]);

  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          eyebrow="Treine"
          title="Simulados"
          description="Provas oficiais com cronômetro real, desempenho por matéria e TRI estimado — além dos simulados rápidos para o dia a dia."
        />
        <div className="flex flex-wrap gap-2">
          <Link
            href="/simulados/ranking"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Trophy size={16} />
            Ranking
          </Link>
          <Link
            href="/simulados/historico"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <History size={16} />
            Histórico
          </Link>
        </div>
      </div>

      {/* Oficiais */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-amber-500" />
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Simulados Oficiais</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Reproduzem fielmente os vestibulares (tempo e estrutura oficiais).{" "}
          <Link href="/simulados/exames" className="font-semibold text-sky-700 dark:text-sky-400">
            Ver por universidade
          </Link>
          .
        </p>
        {oficiais.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {oficiais.map((sim) => (
              <SimuladoCard key={sim.id} sim={sim} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Nenhum simulado oficial publicado ainda. Rode <code>supabase/simulados_oficiais.sql</code>.
          </div>
        )}
      </section>

      {/* Rápidos */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Simulados rápidos</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Treinos curtos e autorais para revisar no dia a dia.
        </p>
        {rapidos.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rapidos.map((sim) => (
              <SimuladoCard key={sim.id} sim={sim} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Nenhum simulado rápido publicado ainda.
          </div>
        )}
      </section>
    </AppShell>
  );
}
