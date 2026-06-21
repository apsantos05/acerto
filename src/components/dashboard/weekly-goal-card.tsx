"use client";

import { useState } from "react";
import { Check, Save, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import type { WeeklyGoal } from "@/lib/study-planner";

type WeeklyGoalCardProps = {
  goal: WeeklyGoal | null;
};

function clampProgress(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function WeeklyGoalCard({ goal: initialGoal }: WeeklyGoalCardProps) {
  const { supabase, user } = useAuth();
  const [goal, setGoal] = useState<WeeklyGoal | null>(initialGoal);
  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState(String(initialGoal?.progress ?? 0));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!supabase || !user) {
      setError("Entre para criar uma meta.");
      return;
    }
    if (!description.trim()) return;
    setBusy(true);
    try {
      const { data, error: insertError } = await supabase
        .from("weekly_goals")
        .insert({
          user_id: user.id,
          description: description.trim(),
          progress: 0,
          status: "active",
        })
        .select("id,description,progress,status")
        .single();
      if (insertError) throw insertError;
      setGoal({
        id: data.id as string,
        description: data.description as string,
        progress: (data.progress as number) ?? 0,
        status: "active",
        completedAt: null,
      });
      setDraft("0");
      setDescription("");
    } catch (createError) {
      console.error("[weekly-goal] criar:", createError);
      setError(getSupabaseErrorMessage(createError, "Não foi possível criar a meta."));
    } finally {
      setBusy(false);
    }
  }

  async function updateProgress(progress: number) {
    setError("");
    if (!supabase || !user || !goal) return;
    const previous = goal;
    setGoal({ ...goal, progress });
    try {
      const { error: updateError } = await supabase
        .from("weekly_goals")
        .update({ progress })
        .eq("id", goal.id);
      if (updateError) throw updateError;
    } catch (updateError) {
      setGoal(previous);
      console.error("[weekly-goal] progresso:", updateError);
      setError(getSupabaseErrorMessage(updateError, "Não foi possível atualizar a meta."));
    }
  }

  async function completeGoal() {
    setError("");
    if (!supabase || !user || !goal) return;
    const previous = goal;
    setGoal(null); // sai da meta ativa -> histórico
    try {
      const { error: updateError } = await supabase
        .from("weekly_goals")
        .update({
          status: "completed",
          progress: 100,
          completed_at: new Date().toISOString(),
        })
        .eq("id", previous.id);
      if (updateError) throw updateError;
    } catch (completeError) {
      setGoal(previous);
      console.error("[weekly-goal] concluir:", completeError);
      setError(getSupabaseErrorMessage(completeError, "Não foi possível concluir a meta."));
    }
  }

  if (!goal) {
    return (
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
        <Target className="text-cyan-300" />
        <h2 className="mt-5 text-xl font-semibold">Meta atual</h2>
        <p className="mt-2 text-slate-300">
          Você ainda não definiu uma meta para esta semana.
        </p>
        <form onSubmit={createGoal} className="mt-5 space-y-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Ex.: Resolver 240 questões e publicar 2 resumos até domingo."
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
          />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-70"
          >
            <Save size={16} />
            Criar meta
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
      <Target className="text-cyan-300" />
      <h2 className="mt-5 text-xl font-semibold">Meta atual</h2>
      <p className="mt-2 text-slate-300">{goal.description}</p>

      <div className="mt-5 h-2 rounded-full bg-slate-800">
        <div
          className="h-2 rounded-full bg-cyan-400 transition-all"
          style={{ width: `${goal.progress}%` }}
        />
      </div>
      <div className="mt-3 flex items-center gap-3 text-cyan-300">
        <TrendingUp size={18} />
        <span className="font-semibold">{goal.progress}% concluído</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white outline-none focus:border-cyan-400"
        />
        <button
          type="button"
          onClick={() => updateProgress(clampProgress(Number(draft)))}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          <Save size={13} />
          Atualizar
        </button>
        <button
          type="button"
          onClick={completeGoal}
          className="ml-auto inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600"
        >
          <Check size={13} />
          Concluir meta
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
