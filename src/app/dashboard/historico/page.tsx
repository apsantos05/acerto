import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { HistoryList } from "@/components/dashboard/history-list";
import { getStudyHistory } from "@/lib/study-planner";

export default async function HistoricoPage() {
  const { tasks, goals } = await getStudyHistory();

  return (
    <AppShell>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950"
      >
        <ArrowLeft size={17} />
        Voltar para o dashboard
      </Link>

      <PageHeader
        eyebrow="Plano de estudos"
        title="Histórico"
        description="Tarefas e metas concluídas. Restaure qualquer item para voltar a trabalhar nele."
      />

      <div className="mt-2">
        <HistoryList tasks={tasks} goals={goals} />
      </div>
    </AppShell>
  );
}
