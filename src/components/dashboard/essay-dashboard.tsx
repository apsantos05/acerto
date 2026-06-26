import type { EssayDashboard } from "@/lib/redacoes-data";
import { EXAM_LABELS } from "@/lib/essay-ai";
import Link from "next/link";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

const primaryButton =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200";

function EvolutionChart({ evolution }: { evolution: { score: number }[] }) {
  const width = 300;
  const height = 100;
  const padX = 6;
  const padY = 8;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const baseY = height - padY;

  const maxScore = Math.max(1, ...evolution.map((e) => e.score));
  const n = evolution.length;

  const points = evolution.map((e, i) => {
    const x = n <= 1 ? width / 2 : padX + (innerW * i) / (n - 1);
    const y = padY + innerH * (1 - e.score / maxScore);
    return { x, y };
  });

  const linePath =
    points.length > 1
      ? points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
      : "";

  return (
    <div className="text-sky-600 dark:text-sky-400">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100"
        preserveAspectRatio="none"
        role="img"
        aria-label="Evolução de nota das redações"
      >
        <line
          x1={padX}
          y1={baseY}
          x2={width - padX}
          y2={baseY}
          className="stroke-slate-200 dark:stroke-slate-800"
          strokeWidth={1}
        />
        {linePath ? (
          <path d={linePath} fill="none" stroke="currentColor" strokeWidth={2} />
        ) : null}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} className="fill-sky-500" />
        ))}
      </svg>
    </div>
  );
}

export function EssayDashboard({ data }: { data: EssayDashboard }) {
  if (data.count === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Redações com IA</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Envie sua primeira redação e receba correção por IA.
        </p>
        <Link href="/redacoes/nova" className={`mt-4 ${primaryButton}`}>
          Enviar redação
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Redações com IA</h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total enviadas</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{data.count}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Média</p>
          <p className="mt-1 text-2xl font-semibold text-sky-600 dark:text-sky-400">{data.avgScore}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Principal ponto fraco</p>
          <p className="mt-1 text-base font-medium text-slate-950 dark:text-white">
            {data.topWeakness ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Evolução de nota</h3>
        <div className="mt-2">
          <EvolutionChart evolution={data.evolution} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Últimas redações</h3>
        <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
          {data.recent.slice(0, 5).map((r) => (
            <li key={r.id}>
              <Link
                href={`/redacoes/${r.id}`}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <span className="font-medium text-slate-950 dark:text-white">
                  {EXAM_LABELS[r.examType as keyof typeof EXAM_LABELS] ?? r.examType}
                </span>
                <span className="text-slate-600 dark:text-slate-300">{r.scoreTotal ?? "—"}</span>
                <span className="text-slate-500 dark:text-slate-400">{formatDate(r.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <Link href="/redacoes/nova" className={primaryButton}>
          Enviar nova redação
        </Link>
      </div>
    </section>
  );
}
