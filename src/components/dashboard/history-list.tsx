"use client";

import { useState } from "react";
import { BookOpen, RotateCcw, Target } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import type { StudyTask, WeeklyGoal } from "@/lib/study-planner";

type HistoryListProps = {
  tasks: StudyTask[];
  goals: WeeklyGoal[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function HistoryList({ tasks: initialTasks, goals: initialGoals }: HistoryListProps) {
  const { supabase, user } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[]>(initialTasks);
  const [goals, setGoals] = useState<WeeklyGoal[]>(initialGoals);
  const [error, setError] = useState("");

  async function restore(table: "study_tasks" | "weekly_goals", id: string) {
    setError("");
    if (!supabase || !user) {
      setError("Entre para restaurar.");
      return;
    }
    const prevTasks = tasks;
    const prevGoals = goals;
    if (table === "study_tasks") setTasks((p) => p.filter((t) => t.id !== id));
    else setGoals((p) => p.filter((g) => g.id !== id));
    try {
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: "active", completed_at: null })
        .eq("id", id);
      if (updateError) throw updateError;
    } catch (restoreError) {
      setTasks(prevTasks);
      setGoals(prevGoals);
      console.error("[history] restaurar:", restoreError);
      setError(getSupabaseErrorMessage(restoreError, "Não foi possível restaurar."));
    }
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section>
        <div className="flex items-center gap-2">
          <BookOpen className="text-sky-700" />
          <h2 className="text-xl font-semibold text-slate-950">Tarefas concluídas</h2>
        </div>
        <div className="mt-5 space-y-3">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <article
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {task.subject ? `${task.subject} · ` : ""}
                    {task.progress}% · concluída em {formatDate(task.completedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => restore("study_tasks", task.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw size={15} />
                  Restaurar
                </button>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
              Nenhuma tarefa concluída ainda.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2">
          <Target className="text-sky-700" />
          <h2 className="text-xl font-semibold text-slate-950">Metas concluídas</h2>
        </div>
        <div className="mt-5 space-y-3">
          {goals.length > 0 ? (
            goals.map((goal) => (
              <article
                key={goal.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{goal.description}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {goal.progress}% · concluída em {formatDate(goal.completedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => restore("weekly_goals", goal.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw size={15} />
                  Restaurar
                </button>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
              Nenhuma meta concluída ainda.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
