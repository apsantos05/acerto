import Link from "next/link";
import { Clock, FileQuestion, GraduationCap, Gauge, Play } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { getSimulados } from "@/lib/simulados";

export default async function SimuladosPage() {
  const simulados = await getSimulados();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Treine"
        title="Simulados"
        description="Simulados autorais inspirados no estilo de cada vestibular. Responda, finalize e veja seu desempenho com explicações."
      />

      {simulados.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {simulados.map((sim) => (
            <article
              key={sim.id}
              className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-sky-200 hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
                    <GraduationCap size={14} />
                    {sim.vestibular}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {sim.faculty}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">
                  {sim.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {sim.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <FileQuestion size={16} className="text-sky-700" />
                    {sim.questionCount} questões
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock size={16} className="text-sky-700" />
                    {sim.durationMinutes} min
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Gauge size={16} className="text-sky-700" />
                    {sim.difficulty}
                  </span>
                </div>

                {sim.subjects.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sim.subjects.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <Link
                href={`/simulados/${sim.id}`}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Play size={16} />
                Começar simulado
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Nenhum simulado publicado ainda.
        </div>
      )}
    </AppShell>
  );
}
