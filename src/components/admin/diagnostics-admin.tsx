"use client";

import Link from "next/link";
import { Filter, Users } from "lucide-react";
import type { AdminDiagnosticData } from "@/lib/diagnostico-data";

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  premium: "Premium",
  premium_med: "Premium Medicina",
};

export function DiagnosticsAdmin({
  data,
  activeUniversity,
  activePlan,
}: {
  data: AdminDiagnosticData;
  activeUniversity: string;
  activePlan: string;
}) {
  const hrefWith = (params: { uni?: string; plan?: string }) => {
    const uni = params.uni ?? activeUniversity;
    const plan = params.plan ?? activePlan;
    const q = new URLSearchParams({ tab: "diagnosticos" });
    if (uni) q.set("uni", uni);
    if (plan) q.set("plan", plan);
    return `/admin?${q.toString()}`;
  };

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold transition ${
      active
        ? "bg-sky-600 text-white"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    }`;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-semibold text-slate-950 dark:text-white">{data.total}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Diagnósticos</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-semibold text-sky-700 dark:text-sky-400">{data.avgScore}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Score médio</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="inline-flex items-center gap-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            <Users size={20} /> {data.leadsThisWeek}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Leads (7 dias)</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Por plano recomendado</p>
          <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {Object.entries(data.byPlan).length > 0 ? (
              Object.entries(data.byPlan).map(([plan, count]) => (
                <div key={plan} className="flex justify-between">
                  <span>{PLAN_LABELS[plan] ?? plan}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Filter size={14} /> Universidade:
          </span>
          <Link href={hrefWith({ uni: "" })} className={chip(!activeUniversity)}>Todas</Link>
          {data.universities.map((u) => (
            <Link key={u} href={hrefWith({ uni: u })} className={chip(activeUniversity === u)}>
              {u}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Filter size={14} /> Plano:
          </span>
          <Link href={hrefWith({ plan: "" })} className={chip(!activePlan)}>Todos</Link>
          {(["free", "premium", "premium_med"] as const).map((p) => (
            <Link key={p} href={hrefWith({ plan: p })} className={chip(activePlan === p)}>
              {PLAN_LABELS[p]}
            </Link>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Universidade</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.items.length > 0 ? (
              data.items.map((item) => (
                <tr key={item.id} className="bg-white dark:bg-slate-900">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{item.email ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{item.targetUniversity}</td>
                  <td className="px-4 py-3 font-semibold text-slate-950 dark:text-white">{item.score}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{PLAN_LABELS[item.recommendedPlan] ?? item.recommendedPlan}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Nenhum diagnóstico encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
