import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import {
  getSimuladoHistory,
  type SimuladoHistoryItem,
} from "@/lib/simulados";
import { getViewer, viewerIsPremium } from "@/lib/gating";

export const metadata: Metadata = {
  title: "Histórico de simulados",
  robots: { index: false },
};

const FREE_LIMIT = 3;

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return m > 0 ? `${h}h/${m}min` : `${h}h`;
  return `${m}min`;
}

function pct(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function barFill(percent: number): string {
  if (percent >= 70) return "bg-emerald-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function ProgressBar({ percent }: { percent: number }) {
  const p = pct(percent);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className={`h-full rounded-full ${barFill(p)}`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

function HistoryCard({ item }: { item: SimuladoHistoryItem }) {
  const overallPercent = pct(
    item.total > 0 ? (item.score / item.total) * 100 : 0,
  );
  const subjects = Object.entries(item.subjectScores);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-950 dark:text-white">
            {item.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {formatDate(item.finishedAt)} · {formatDuration(item.durationMinutes)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-slate-950 dark:text-white">
            {overallPercent}%
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {item.score}/{item.total} acertos
          </p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar percent={overallPercent} />
      </div>

      {subjects.length > 0 ? (
        <div className="mt-5 space-y-3">
          {subjects.map(([subject, sub]) => {
            const subPercent = pct(sub.percent);
            return (
              <div key={subject}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">
                    {subject}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {subPercent}%
                  </span>
                </div>
                <ProgressBar percent={subPercent} />
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

export default async function SimuladoHistoricoPage() {
  const viewer = await getViewer();
  if (!viewer.userId) {
    redirect("/login");
  }

  const history = await getSimuladoHistory();
  const unlocked = viewerIsPremium(viewer) || viewer.isAdmin;
  const visible = unlocked ? history : history.slice(0, FREE_LIMIT);
  const hiddenCount = history.length - visible.length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Simulados"
        title="Histórico de simulados"
        description="Acompanhe sua evolução: pontuação geral, tempo e desempenho por matéria em cada simulado concluído."
      />

      {history.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-lg font-semibold text-slate-950 dark:text-white">
            Você ainda não concluiu nenhum simulado
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Faça um simulado para começar a acompanhar sua evolução por aqui.
          </p>
          <Link
            href="/simulados"
            className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
          >
            Ver simulados
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {visible.map((item) => (
            <HistoryCard key={item.attemptId} item={item} />
          ))}

          {!unlocked && hiddenCount > 0 ? (
            <div className="rounded-2xl bg-amber-50 p-6 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <p className="text-base font-semibold">
                Histórico completo é Premium
              </p>
              <p className="mt-1 text-sm">
                No plano gratuito você vê apenas os {FREE_LIMIT} simulados mais
                recentes. Você tem mais {hiddenCount}{" "}
                {hiddenCount === 1 ? "simulado" : "simulados"} no histórico.
                Faça upgrade para acessar tudo e acompanhar sua evolução
                completa.
              </p>
              <Link
                href="/planos"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
              >
                Conhecer o Premium
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
