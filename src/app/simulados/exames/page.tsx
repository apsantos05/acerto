import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { OFFICIAL_EXAMS } from "@/lib/simulados";

export const metadata: Metadata = {
  title: "Simulados por universidade — AcertaVest",
  description:
    "Escolha o vestibular e faça simulados oficiais com tempo, estrutura e número de questões reais.",
  alternates: { canonical: "/simulados/exames" },
};

export default function ExamesIndexPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Simulados"
        title="Simulados por universidade"
        description="Escolha o vestibular e treine com simulados oficiais que reproduzem o tempo, a estrutura e o número de questões das provas reais."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {OFFICIAL_EXAMS.map((exam) => (
          <Link
            key={exam.slug}
            href={`/simulados/exames/${exam.slug}`}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {exam.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {exam.blurb}
            </p>
            <span className="mt-4 text-sm font-semibold text-sky-700 group-hover:underline dark:text-sky-400">
              Ver simulados →
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
