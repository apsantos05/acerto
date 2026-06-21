"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileQuestion, Pencil, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import type { AdminSimulado } from "@/lib/admin";

export function SimuladoAdminCard({ simulado }: { simulado: AdminSimulado }) {
  const router = useRouter();
  const { supabase, user } = useAuth();
  const [status, setStatus] = useState(simulado.status);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [duration, setDuration] = useState(String(simulado.durationMinutes));
  const [rules, setRules] = useState(simulado.rules);
  const [error, setError] = useState("");

  async function saveEdit() {
    setError("");
    if (!supabase || !user) return;
    setBusy(true);
    try {
      const minutes = Math.max(1, Math.min(600, Math.round(Number(duration)) || 1));
      const { error: updateError } = await supabase
        .from("simulados")
        .update({ duration_minutes: minutes, rules: rules.trim() })
        .eq("id", simulado.id);
      if (updateError) throw updateError;
      setDuration(String(minutes));
      setEditing(false);
      router.refresh();
    } catch (saveError) {
      console.error("[admin] editar simulado:", saveError);
      setError(getSupabaseErrorMessage(saveError, "Não foi possível salvar."));
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus() {
    setError("");
    if (!supabase || !user) return;
    const next = status === "published" ? "draft" : "published";
    setBusy(true);
    try {
      const { error: updateError } = await supabase
        .from("simulados")
        .update({ status: next })
        .eq("id", simulado.id);
      if (updateError) throw updateError;
      setStatus(next);
      router.refresh();
    } catch (toggleError) {
      console.error("[admin] publicar simulado:", toggleError);
      setError(getSupabaseErrorMessage(toggleError, "Não foi possível atualizar."));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError("");
    if (!supabase || !user) return;
    setBusy(true);
    try {
      const { error: deleteError } = await supabase
        .from("simulados")
        .delete()
        .eq("id", simulado.id);
      if (deleteError) throw deleteError;
      setRemoved(true);
      router.refresh();
    } catch (deleteError) {
      console.error("[admin] excluir simulado:", deleteError);
      setError(getSupabaseErrorMessage(deleteError, "Não foi possível excluir."));
    } finally {
      setBusy(false);
    }
  }

  if (removed) {
    return (
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
        “{simulado.title}” foi excluído 🗑️
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                status === "published"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {status === "published" ? "Publicado" : "Rascunho"}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <FileQuestion size={13} />
              {simulado.questionCount} questões
            </span>
          </div>
          <h3 className="mt-2 font-semibold text-slate-950 dark:text-white">{simulado.title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {simulado.vestibular} · {simulado.faculty}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Pencil size={15} />
            Editar
          </button>
          <button
            type="button"
            onClick={toggleStatus}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {status === "published" ? <EyeOff size={15} /> : <Eye size={15} />}
            {status === "published" ? "Despublicar" : "Publicar"}
          </button>
          {confirming ? (
            <>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-70 dark:border-slate-800 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            >
              <Trash2 size={15} />
              Excluir
            </button>
          )}
        </div>
      </div>
      {editing ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Tempo do simulado (minutos)
            </span>
            <input
              type="number"
              min={1}
              max={600}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-1 w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Regras exibidas
            </span>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={4}
              className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </label>
          <button
            type="button"
            onClick={saveEdit}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-70"
          >
            <Save size={15} />
            Salvar alterações
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </article>
  );
}
