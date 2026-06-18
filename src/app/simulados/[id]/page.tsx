import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, FileQuestion } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SimuladoRunner } from "@/components/simulados/simulado-runner";
import { getSimulado, getSimuladoQuestions } from "@/lib/simulados";

type SimuladoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SimuladoPage({ params }: SimuladoPageProps) {
  const { id } = await params;
  const simulado = await getSimulado(id);

  if (!simulado) {
    notFound();
  }

  const questions = await getSimuladoQuestions(id);

  return (
    <AppShell>
      <Link
        href="/simulados"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950"
      >
        <ArrowLeft size={17} />
        Voltar aos simulados
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
          {simulado.title}
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">{simulado.description}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <FileQuestion size={16} className="text-sky-700" />
            {simulado.questionCount} questões
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock size={16} className="text-sky-700" />
            {simulado.durationMinutes} min sugeridos
          </span>
        </div>
      </div>

      <SimuladoRunner simulado={simulado} questions={questions} />
    </AppShell>
  );
}
