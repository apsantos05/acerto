import Link from "next/link";
import { FileUp, History } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { WeeklyPlan } from "@/components/dashboard/weekly-plan";
import { WeeklyGoalCard } from "@/components/dashboard/weekly-goal-card";
import { getDashboardData } from "@/lib/dashboard";
import { getStudyPlanner } from "@/lib/study-planner";
import { getSimuladoStats, getSimuladoHistory } from "@/lib/simulados";
import { SimuladoCharts } from "@/components/dashboard/simulado-charts";

export default async function DashboardPage() {
  const { stats, recentMaterials } = await getDashboardData();
  const { tasks, goal } = await getStudyPlanner();
  const simStats = await getSimuladoStats();
  const simHistory = await getSimuladoHistory();

  const statCards = [
    { label: "Materiais disponíveis", value: stats.materialsAvailable },
    { label: "Provas e simulados", value: stats.examsAndSimulados },
    { label: "Estudantes cadastrados", value: stats.studentsRegistered },
    { label: "Materiais aprovados", value: stats.materialsApproved },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Painel"
        title="Dashboard"
        description="Acompanhe sua rotina de estudos, materiais salvos e progresso semanal."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value.toLocaleString("pt-BR")}
          />
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Simulados</h2>
          <Link
            href="/simulados"
            className="text-sm font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300"
          >
            Ver simulados
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4">
            <p className="text-2xl font-semibold text-slate-950 dark:text-white">
              {simStats.attempts}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Simulados feitos</p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4">
            <p className="text-2xl font-semibold text-emerald-600">
              {simStats.bestPercent}%
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Melhor pontuação</p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4">
            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
              {simStats.last ? simStats.last.title : "—"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {simStats.last
                ? `${simStats.last.score}/${simStats.last.total} no último`
                : "Nenhum simulado realizado"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SimuladoCharts history={simHistory} />
      </section>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          Plano de estudos
        </h2>
        <Link
          href="/dashboard/historico"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <History size={16} />
          Ver histórico
        </Link>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <WeeklyPlan tasks={tasks} />
        <WeeklyGoalCard goal={goal} />
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <FileUp className="text-sky-700 dark:text-sky-400" />
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            Materiais recentes
          </h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {recentMaterials.length > 0 ? (
            recentMaterials.map((material) => (
              <div
                key={material.id}
                className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4"
              >
                <p className="font-semibold text-slate-950 dark:text-white">{material.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {material.materialType} · {material.subject}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nenhum material aprovado ainda.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
