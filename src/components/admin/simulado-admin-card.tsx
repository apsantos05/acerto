"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileQuestion, Trash2 } from "lucide-react";
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
  const [error, setError] = useState("");

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
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-600">
        “{simulado.title}” foi excluído 🗑️
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                status === "published"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {status === "published" ? "Publicado" : "Rascunho"}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
              <FileQuestion size={13} />
              {simulado.questionCount} questões
            </span>
          </div>
          <h3 className="mt-2 font-semibold text-slate-950">{simulado.title}</h3>
          <p className="text-sm text-slate-500">
            {simulado.vestibular} · {simulado.faculty}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={toggleStatus}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
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
                className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-70"
            >
              <Trash2 size={15} />
              Excluir
            </button>
          )}
        </div>
      </div>
      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </article>
  );
}
