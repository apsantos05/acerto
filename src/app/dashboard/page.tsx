import { CalendarDays, FileUp, Target, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getDashboardData } from "@/lib/dashboard";

export default async function DashboardPage() {
  const { stats, recentMaterials } = await getDashboardData();

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

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">
              Plano da semana
            </h2>
            <CalendarDays className="text-sky-700" />
          </div>
          <div className="mt-6 space-y-4">
            {["Biologia celular", "Física mecânica", "Redação ENEM"].map(
              (task, index) => (
                <div key={task} className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-sm font-semibold text-cyan-800">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-950">{task}</p>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-cyan-400"
                        style={{ width: `${72 - index * 14}%` }}
                      />
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <Target className="text-cyan-300" />
          <h2 className="mt-5 text-xl font-semibold">Meta atual</h2>
          <p className="mt-2 text-slate-300">
            Resolver 240 questões e publicar 2 resumos até domingo.
          </p>
          <div className="mt-6 flex items-center gap-3 text-cyan-300">
            <TrendingUp />
            <span className="font-semibold">64% concluído</span>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <FileUp className="text-sky-700" />
          <h2 className="text-xl font-semibold text-slate-950">
            Materiais recentes
          </h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {recentMaterials.length > 0 ? (
            recentMaterials.map((material) => (
              <div
                key={material.id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <p className="font-semibold text-slate-950">{material.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {material.materialType} · {material.subject}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              Nenhum material aprovado ainda.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
