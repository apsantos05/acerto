import type { Metadata } from "next";
import { Compass, Sparkles, Target, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { DiagnosticForm } from "@/components/diagnostico/diagnostic-form";

export const metadata: Metadata = {
  title: { absolute: "Diagnóstico de Aprovação em Medicina | AcertaVest" },
  description:
    "Saiba seu nível de preparação para Medicina e receba uma trilha personalizada para vestibulares como USP, UNICAMP, FAMERP, UFSC e Einstein.",
  alternates: { canonical: "/diagnostico" },
  openGraph: {
    title: "Diagnóstico de Aprovação em Medicina | AcertaVest",
    description:
      "Responda 10 perguntas e receba seu score de preparação, perfil, riscos e a trilha ideal para a sua aprovação.",
  },
};

export default function DiagnosticoPage() {
  return (
    <AppShell>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-800 p-6 text-white shadow-sm lg:p-10 dark:border-slate-800">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          <Sparkles size={14} />
          Diagnóstico gratuito
        </span>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
          Veja sua chance de aprovação em Medicina
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-sky-50/90">
          Responda 10 perguntas rápidas e receba um <strong>score de preparação</strong>,
          seu perfil de estudante, os principais riscos e a <strong>trilha personalizada</strong>{" "}
          para a sua universidade-alvo.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-sky-50/90">
          <span className="inline-flex items-center gap-2"><Target size={16} /> Score 0–100</span>
          <span className="inline-flex items-center gap-2"><Compass size={16} /> Trilha recomendada</span>
          <span className="inline-flex items-center gap-2"><TrendingUp size={16} /> Plano ideal</span>
        </div>
      </section>

      <div className="mx-auto mt-8 max-w-3xl">
        <DiagnosticForm />
      </div>
    </AppShell>
  );
}
