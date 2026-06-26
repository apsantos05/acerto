"use client";

import Link from "next/link";
import type { AdminEssayData } from "@/lib/redacoes-data";

const EXAM_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "enem", label: "enem" },
  { value: "fuvest", label: "fuvest" },
  { value: "unicamp", label: "unicamp" },
  { value: "tradicional", label: "tradicional" },
];

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "processing", label: "processing" },
  { value: "completed", label: "completed" },
  { value: "failed", label: "failed" },
];

const PLAN_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "free", label: "free" },
  { value: "premium", label: "premium" },
  { value: "premium_med", label: "premium_med" },
];

export function EssaysAdmin({
  data,
  activeExam,
  activeStatus,
  activePlan,
}: {
  data: AdminEssayData;
  activeExam: string;
  activeStatus: string;
  activePlan: string;
}) {
  const hrefWith = (params: { exam?: string; status?: string; plan?: string }) => {
    const exam = params.exam ?? activeExam;
    const status = params.status ?? activeStatus;
    const plan = params.plan ?? activePlan;
    const q = new URLSearchParams({ tab: "redacoes" });
    if (exam) q.set("exam", exam);
    if (status) q.set("status", status);
    if (plan) q.set("plan", plan);
    return `/admin?${q.toString()}`;
  };

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold transition ${
      active
        ? "bg-sky-600 text-white"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    }`;

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className="space-y-6">
      {/* 1. Cards de stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cardClass}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Total de redações
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{data.total}</p>
        </div>

        <div className={cardClass}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Score médio
          </p>
          <p className="mt-2 text-3xl font-bold text-sky-700 dark:text-sky-400">{data.avgScore}</p>
        </div>

        <div className={cardClass}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Por tipo
          </p>
          <ul className="mt-2 space-y-1">
            {Object.keys(data.byType).length === 0 ? (
              <li className="text-sm text-slate-500 dark:text-slate-400">—</li>
            ) : (
              Object.entries(data.byType).map(([type, count]) => (
                <li
                  key={type}
                  className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300"
                >
                  <span>{type}</span>
                  <span className="font-semibold text-slate-950 dark:text-white">{count}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className={cardClass}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Top usuários
          </p>
          <ul className="mt-2 space-y-1">
            {data.topSubmitters.length === 0 ? (
              <li className="text-sm text-slate-500 dark:text-slate-400">—</li>
            ) : (
              data.topSubmitters.map((u) => (
                <li
                  key={u.name}
                  className="flex items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  <span className="truncate">{u.name}</span>
                  <span className="font-semibold text-slate-950 dark:text-white">{u.count}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* 2. Filtros */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tipo de prova:
          </span>
          {EXAM_FILTERS.map((f) => (
            <Link
              key={f.value || "all"}
              href={hrefWith({ exam: f.value })}
              className={chip(activeExam === f.value)}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value || "all"}
              href={hrefWith({ status: f.value })}
              className={chip(activeStatus === f.value)}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Plano:</span>
          {PLAN_FILTERS.map((f) => (
            <Link
              key={f.value || "all"}
              href={hrefWith({ plan: f.value })}
              className={chip(activePlan === f.value)}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Tabela */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Últimas redações</h2>
        </div>

        {data.items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhuma redação encontrada.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Nota</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {item.email ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.examType}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.status}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {item.scoreTotal ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
