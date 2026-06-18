"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Flag, X } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import type { SimuladoQuestion, SimuladoSummary } from "@/lib/simulados";

type ResultItem = {
  question_id: string;
  subject: string;
  question_text: string;
  alternatives: Record<string, string>;
  selected: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation: string | null;
};

type SubmitResult = {
  score: number;
  total: number;
  results: ResultItem[];
};

const LETTERS = ["A", "B", "C", "D", "E"];

export function SimuladoRunner({
  simulado,
  questions,
}: {
  simulado: SimuladoSummary;
  questions: SimuladoQuestion[];
}) {
  const { supabase, user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">Entre na sua conta para fazer este simulado.</p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Entrar
        </Link>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
        Este simulado ainda não tem questões.
      </div>
    );
  }

  if (result) {
    const percent = result.total
      ? Math.round((result.score / result.total) * 100)
      : 0;
    const errors = result.total - result.score;
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase text-sky-700">Resultado</p>
          <p className="mt-2 text-5xl font-bold text-slate-950">{percent}%</p>
          <p className="mt-2 text-slate-600">
            {result.score} acertos · {errors} erros · {result.total} questões
          </p>
          <Link
            href="/simulados"
            className="mt-5 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Voltar aos simulados
          </Link>
        </div>

        <div className="space-y-4">
          {result.results.map((item, i) => (
            <article
              key={item.question_id}
              className={`rounded-xl border bg-white p-5 shadow-sm ${
                item.is_correct ? "border-emerald-200" : "border-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  {i + 1}. {item.subject}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${
                    item.is_correct ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {item.is_correct ? <Check size={15} /> : <X size={15} />}
                  {item.is_correct ? "Acertou" : "Errou"}
                </span>
              </div>
              <p className="mt-2 font-medium text-slate-950">{item.question_text}</p>
              <div className="mt-3 space-y-1 text-sm">
                {LETTERS.filter((l) => item.alternatives[l] !== undefined).map((l) => {
                  const isCorrect = l === item.correct_answer;
                  const isSelected = l === item.selected;
                  return (
                    <p
                      key={l}
                      className={`rounded px-2 py-1 ${
                        isCorrect
                          ? "bg-emerald-50 font-semibold text-emerald-800"
                          : isSelected
                            ? "bg-red-50 text-red-700"
                            : "text-slate-600"
                      }`}
                    >
                      {l}) {item.alternatives[l]}
                      {isCorrect ? " ✓" : isSelected ? " (sua resposta)" : ""}
                    </p>
                  );
                })}
              </div>
              {item.explanation ? (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  <span className="font-semibold">Explicação: </span>
                  {item.explanation}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    );
  }

  const question = questions[index];
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / questions.length) * 100);
  const isLast = index === questions.length - 1;

  function select(letter: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: letter }));
  }

  async function finish() {
    setError("");
    if (!supabase || !user) return;
    setSubmitting(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("submit_simulado", {
        p_simulado_id: simulado.id,
        p_answers: answers,
      });
      if (rpcError) throw rpcError;
      setResult(data as SubmitResult);
    } catch (submitError) {
      console.error("[simulado] enviar:", submitError);
      setError(getSupabaseErrorMessage(submitError, "Não foi possível enviar o simulado."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Questão {index + 1} de {questions.length}
        </span>
        <span>{answered} respondidas</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-cyan-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-6 text-xs font-semibold uppercase text-sky-700">
        {question.subject}
      </p>
      <p className="mt-2 text-lg font-medium leading-7 text-slate-950">
        {question.questionText}
      </p>

      <div className="mt-5 space-y-2">
        {LETTERS.filter((l) => question.alternatives[l] !== undefined).map((l) => {
          const selected = answers[question.id] === l;
          return (
            <button
              key={l}
              type="button"
              onClick={() => select(l)}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                selected
                  ? "border-sky-500 bg-sky-50 text-slate-950"
                  : "border-slate-200 hover:border-sky-200 hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  selected ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {l}
              </span>
              <span>{question.alternatives[l]}</span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          Anterior
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={finish}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
          >
            <Flag size={16} />
            {submitting ? "Enviando..." : "Finalizar simulado"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Próxima
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
