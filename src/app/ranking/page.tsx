import { Medal, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ranking } from "@/lib/mock-data";

export default function RankingPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Desempenho"
        title="Ranking"
        description="Veja os estudantes com maior pontuação por contribuição, simulados e constância."
      />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Trophy className="text-amber-500" />
          <h2 className="text-xl font-semibold text-slate-950">
            Ranking geral
          </h2>
        </div>
        <div className="space-y-3">
          {ranking.map((student, index) => (
            <div
              key={student.name}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                  {index < 3 ? <Medal size={18} /> : index + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{student.name}</p>
                  <p className="text-sm text-slate-500">{student.city}</p>
                </div>
              </div>
              <p className="font-semibold text-emerald-600">
                {student.points.toLocaleString("pt-BR")} pts
              </p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
