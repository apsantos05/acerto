import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Crown } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { EssayForm } from "@/components/redacoes/essay-form";
import { createClient } from "@/lib/supabase/server";
import { getViewer, canSubmitEssay } from "@/lib/gating";

export const metadata: Metadata = {
  title: "Nova redação",
  robots: { index: false, follow: false },
};

export default async function NovaRedacaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const viewer = await getViewer();
  const quota = await canSubmitEssay(viewer);

  return (
    <AppShell>
      <Link
        href="/redacoes"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950 dark:text-sky-400 dark:hover:text-sky-300"
      >
        <ArrowLeft size={17} />
        Voltar para redações
      </Link>

      <PageHeader
        eyebrow="Redação com IA"
        title="Nova redação"
        description="Escolha o tipo de prova, cole sua redação e receba a correção em segundos."
      />

      {quota.allowed ? (
        <div className="mt-6">
          <EssayForm />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
          <Crown className="mx-auto text-amber-500" size={28} />
          <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
            Limite de correções atingido
          </h2>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
            Você usou {quota.used}/{quota.limit} correções deste mês. Assine um plano
            superior para liberar mais correções com feedback completo.
          </p>
          <Link
            href="/planos"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <Crown size={16} /> Ver planos
          </Link>
        </div>
      )}
    </AppShell>
  );
}
