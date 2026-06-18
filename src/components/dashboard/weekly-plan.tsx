"use client";

import { useState } from "react";
import { CalendarDays, Check, Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import type { StudyTask } from "@/lib/study-planner";

type WeeklyPlanProps = {
  tasks: StudyTask[];
};

function clampProgress(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function WeeklyPlan({ tasks: initialTasks }: WeeklyPlanProps) {
  const { supabase, user } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[]>(initialTasks);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!supabase || !user) {
      setError("Entre para criar tarefas.");
      return;
    }
    if (!title.trim()) return;
    setBusy(true);
    try {
      const { data, error: insertError } = await supabase
        .from("study_tasks")
        .insert({
          user_id: user.id,
          title: title.trim(),
          subject: subject.trim() || null,
          progress: 0,
          status: "active",
        })
        .select("id,title,subject,progress,status,completed_at")
        .single();
      if (insertError) throw insertError;
      setTasks((prev) => [
        ...prev,
        {
          id: data.id as string,
          title: data.title as string,
          subject: (data.subject as string) ?? "",
          progress: (data.progress as number) ?? 0,
          status: "active",
          completedAt: null,
        },
      ]);
      setTitle("");
      setSubject("");
      setIsAdding(false);
    } catch (addError) {
      console.error("[weekly-plan] criar tarefa:", addError);
      setError(getSupabaseErrorMessage(addError, "Não foi possível criar a tarefa."));
    } finally {
      setBusy(false);
    }
  }

  async function setProgress(id: string, progress: number) {
    setError("");
    if (!supabase || !user) return;
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, progress } : t)));
    try {
      const { error: updateError } = await supabase
        .from("study_tasks")
        .update({ progress })
        .eq("id", id);
      if (updateError) throw updateError;
    } catch (updateError) {
      setTasks(previous);
      console.error("[weekly-plan] progresso:", updateError);
      setError(getSupabaseErrorMessage(updateError, "Não foi possível atualizar."));
    }
  }

  async function completeTask(id: string) {
    setError("");
    if (!supabase || !user) return;
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id)); // sai da lista ativa -> histórico
    try {
      const { error: updateError } = await supabase
        .from("study_tasks")
        .update({
          status: "completed",
          progress: 100,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (updateError) throw updateError;
    } catch (completeError) {
      setTasks(previous);
      console.error("[weekly-plan] concluir:", completeError);
      setError(getSupabaseErrorMessage(completeError, "Não foi possível concluir."));
    }
  }

  async function deleteTask(id: string) {
    setError("");
    if (!supabase || !user) return;
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const { error: deleteError } = await supabase
        .from("study_tasks")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
    } catch (deleteError) {
      setTasks(previous);
      console.error("[weekly-plan] excluir:", deleteError);
      setError(getSupabaseErrorMessage(deleteError, "Não foi possível excluir."));
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-950">Plano da semana</h2>
        <div className="flex items-center gap-3">
          <CalendarDays className="text-sky-700" />
          <button
            type="button"
            onClick={() => setIsAdding((open) => !open)}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Adicionar tarefa
          </button>
        </div>
      </div>

      {isAdding ? (
        <form onSubmit={addTask} className="mt-5 grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (ex.: Biologia celular)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Matéria (opcional)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-70 sm:col-span-2"
          >
            <Save size={16} />
            Salvar tarefa
          </button>
        </form>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onProgress={(p) => setProgress(task.id, p)}
              onDone={() => completeTask(task.id)}
              onDelete={() => deleteTask(task.id)}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <p className="text-sm text-slate-600">
              Você ainda não tem tarefas ativas nesta semana.
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Criar tarefa
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function TaskRow({
  task,
  onProgress,
  onDone,
  onDelete,
}: {
  task: StudyTask;
  onProgress: (progress: number) => void;
  onDone: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(String(task.progress));

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-950">{task.title}</p>
          {task.subject ? (
            <p className="text-xs text-slate-500">{task.subject}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onDone}
            title="Concluir"
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            <Check size={14} />
            Concluir
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Excluir"
            className="inline-flex items-center rounded-lg border border-slate-200 px-2 py-1 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-cyan-400 transition-all"
          style={{ width: `${task.progress}%` }}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-sky-400"
        />
        <span className="text-sm text-slate-500">% de progresso</span>
        <button
          type="button"
          onClick={() => onProgress(clampProgress(Number(draft)))}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <Save size={13} />
          Salvar progresso
        </button>
      </div>
    </div>
  );
}
