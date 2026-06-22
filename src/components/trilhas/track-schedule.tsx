"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  Clock,
  ListChecks,
  Lock,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { UpgradeButton } from "@/components/plan/upgrade-modal";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import type { TrackWeek } from "@/lib/tracks";

type TrackScheduleProps = {
  trackId: string;
  weeks: TrackWeek[];
  fullAccess: boolean;
};

const milestones = [25, 50, 75, 100];

export function TrackSchedule({
  trackId,
  weeks,
  fullAccess,
}: TrackScheduleProps) {
  const { supabase, user } = useAuth();

  const allTaskIds = useMemo(
    () => weeks.flatMap((week) => week.tasks.map((task) => task.id)),
    [weeks],
  );
  const totalTasks = allTaskIds.length;

  const [completed, setCompleted] = useState<Set<string>>(
    () =>
      new Set(
        weeks.flatMap((week) =>
          week.tasks.filter((task) => task.completed).map((task) => task.id),
        ),
      ),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);

  const completedCount = completed.size;
  const percent = totalTasks ? Math.round((completedCount / totalTasks) * 100) : 0;
  const totalWeeks = weeks.length;
  const currentWeek =
    weeks.find((week) => week.tasks.some((task) => !completed.has(task.id)))
      ?.weekNumber ??
    weeks[weeks.length - 1]?.weekNumber ??
    0;

  function weekUnlocked(weekNumber: number) {
    return fullAccess || weekNumber <= 1;
  }

  async function toggleTask(taskId: string, isDone: boolean) {
    setError("");
    if (!supabase || !user) {
      setError("Entre na sua conta para salvar o progresso.");
      return;
    }
    setBusyId(taskId);

    // Atualização otimista.
    setCompleted((prev) => {
      const next = new Set(prev);
      if (isDone) next.delete(taskId);
      else next.add(taskId);
      return next;
    });

    try {
      if (isDone) {
        const { error: deleteError } = await supabase
          .from("user_track_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("task_id", taskId);
        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from("user_track_progress")
          .upsert(
            { user_id: user.id, track_id: trackId, task_id: taskId },
            { onConflict: "user_id,task_id" },
          );
        if (insertError) throw insertError;
      }
    } catch (toggleError) {
      // Reverte em caso de falha.
      setCompleted((prev) => {
        const next = new Set(prev);
        if (isDone) next.add(taskId);
        else next.delete(taskId);
        return next;
      });
      setError(
        getSupabaseErrorMessage(toggleError, "Não foi possível salvar o progresso."),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function resetProgress() {
    setError("");
    if (!supabase || !user) {
      setError("Entre na sua conta para resetar o progresso.");
      return;
    }
    if (!window.confirm("Resetar todo o progresso desta trilha?")) return;
    setResetting(true);
    const snapshot = new Set(completed);
    setCompleted(new Set());
    try {
      const { error: rpcError } = await supabase.rpc("reset_track_progress", {
        p_track_id: trackId,
      });
      if (rpcError) throw rpcError;
    } catch (resetError) {
      setCompleted(snapshot);
      setError(
        getSupabaseErrorMessage(resetError, "Não foi possível resetar o progresso."),
      );
    } finally {
      setResetting(false);
    }
  }

  // "Continuar de onde parou": primeira tarefa não concluída em semana liberada.
  const nextTaskId = useMemo(() => {
    for (const week of weeks) {
      if (!weekUnlocked(week.weekNumber)) break;
      for (const task of week.tasks) {
        if (!completed.has(task.id)) return task.id;
      }
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeks, completed, fullAccess]);

  return (
    <div>
      {/* Barra de progresso */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <ListChecks size={18} className="text-sky-700 dark:text-sky-400" />
              Progresso: {completedCount}/{totalTasks} tarefas ({percent}%)
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Semana {currentWeek} de {totalWeeks}
            </p>
          </div>
          {user ? (
            <button
              type="button"
              onClick={resetProgress}
              disabled={resetting || completedCount === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw size={14} />
              {resetting ? "Resetando..." : "Resetar progresso"}
            </button>
          ) : null}
        </div>
        <div className="relative mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all"
            style={{ width: `${percent}%` }}
          />
          {milestones.map((milestone) => (
            <span
              key={milestone}
              className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                percent >= milestone
                  ? "border-cyan-300 bg-slate-950 dark:bg-white"
                  : "border-white bg-slate-300 dark:border-slate-900 dark:bg-slate-600"
              }`}
              style={{ left: `${milestone}%` }}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {milestones.map((milestone) => (
            <span
              key={milestone}
              className={percent >= milestone ? "text-sky-700 dark:text-sky-300" : ""}
            >
              {milestone}%
            </span>
          ))}
        </div>
        {!user ? (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/login" className="font-semibold text-sky-700 underline dark:text-sky-400">
              Entre
            </Link>{" "}
            para marcar tarefas e salvar seu progresso.
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </div>

      {/* Semanas */}
      <div className="mt-5 space-y-5">
        {weeks.map((week) => {
          const unlocked = weekUnlocked(week.weekNumber);
          const weekDone = week.tasks.filter((t) => completed.has(t.id)).length;

          return (
            <section
              key={week.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 items-center rounded-full bg-slate-950 px-3 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                      Semana {week.weekNumber}
                    </span>
                    {!unlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                        <Lock size={12} />
                        Premium
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-slate-950 dark:text-white">
                    {week.title}
                  </h3>
                  {week.description ? (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {week.description}
                    </p>
                  ) : null}
                </div>
                {unlocked ? (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {weekDone}/{week.tasks.length}
                  </span>
                ) : null}
              </div>

              <ul className={`mt-4 space-y-2 ${unlocked ? "" : "pointer-events-none select-none opacity-60"}`}>
                {week.tasks.map((task) => {
                  const isDone = completed.has(task.id);
                  return (
                    <li
                      key={task.id}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                        isDone
                          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                          : "border-slate-200 dark:border-slate-800"
                      } ${task.id === nextTaskId ? "ring-2 ring-sky-300 dark:ring-sky-500/40" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => unlocked && toggleTask(task.id, isDone)}
                        disabled={!unlocked || busyId === task.id}
                        aria-label={isDone ? "Marcar como não concluída" : "Marcar como concluída"}
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition disabled:cursor-not-allowed ${
                          isDone
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 text-transparent hover:border-sky-400 dark:border-slate-600"
                        }`}
                      >
                        <Check size={15} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
                            {task.subject}
                          </span>
                          <span className={`text-sm font-semibold ${isDone ? "text-slate-500 line-through dark:text-slate-400" : "text-slate-950 dark:text-white"}`}>
                            {task.title}
                          </span>
                        </div>
                        {task.description ? (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {task.description}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={13} />
                            {task.estimatedMinutes} min
                          </span>
                          {task.materialId ? (
                            <Link
                              href={`/biblioteca/${task.materialId}`}
                              className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300"
                            >
                              <BookOpen size={13} />
                              Material
                            </Link>
                          ) : null}
                          {task.simuladoId ? (
                            <Link
                              href={`/simulados/${task.simuladoId}`}
                              className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300"
                            >
                              <ListChecks size={13} />
                              Simulado
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {!unlocked ? (
                <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Desbloqueie o cronograma completo desta trilha.
                  </p>
                  <UpgradeButton
                    label="Liberar trilha completa"
                    title="Trilha Premium"
                    message="O cronograma completo, materiais e simulados recomendados desta trilha fazem parte do plano Premium. Assine para liberar todas as semanas."
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  />
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
