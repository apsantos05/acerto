"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, PenLine, Sparkles } from "lucide-react";
import { EXAM_LABELS, EXAM_TYPES, AI_DISCLAIMER, type ExamType } from "@/lib/essay-ai";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-sky-500/30";

export function EssayForm() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>("enem");
  const [theme, setTheme] = useState("");
  const [essay, setEssay] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const wordCount = useMemo(
    () => essay.trim().split(/\s+/).filter(Boolean).length,
    [essay],
  );

  async function submit() {
    setError("");
    if (wordCount < 50) {
      setError("Escreva ao menos 50 palavras.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/redacoes/corrigir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examType, theme, essay }),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error || "Falha ao corrigir.");
      router.push(`/redacoes/${json.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar.");
      setSubmitting(false);
    }
  }

  if (submitting) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="mx-auto animate-spin text-sky-600 dark:text-sky-400" size={36} />
        <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
          Corrigindo sua redação...
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          A IA está analisando estrutura, argumentação e gramática. Isso pode levar
          alguns segundos — não feche a página.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Tipo de prova
          </span>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value as ExamType)}
            className={`mt-1 ${inputClass}`}
          >
            {EXAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {EXAM_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Tema (opcional)
          </span>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Ex.: Desafios da saúde mental no Brasil"
            className={`mt-1 ${inputClass}`}
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Sua redação
        </span>
        <textarea
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          rows={14}
          placeholder="Cole ou escreva sua redação aqui..."
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{wordCount} palavras</span>
        <span>{essay.length}/8000 caracteres</span>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}{" "}
          {/limite/i.test(error) ? (
            <Link href="/planos" className="font-semibold underline">
              Ver planos
            </Link>
          ) : null}
        </p>
      ) : null}

      <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
        <Sparkles size={13} /> {AI_DISCLAIMER}
      </p>

      <div className="mt-5">
        <button
          type="button"
          onClick={submit}
          disabled={wordCount < 50}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <PenLine size={16} />
          Enviar para correção
        </button>
      </div>
    </div>
  );
}
