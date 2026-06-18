"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock, Flag, Play, X } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import type {
  ActiveAttempt,
  SimuladoQuestion,
  SimuladoSummary,
} from "@/lib/simulados";

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
  expired?: boolean;
};

const LETTERS = ["A", "B", "C", "D", "E"];

function fmt(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function SimuladoRunner({
  simulado,
  questions,
  activeAttempt,
}: {
  simulado: SimuladoSummary;
  questions: SimuladoQuestion[];
  activeAttempt: ActiveAttempt | null;
}) {
  const { supabase, user } = useAuth();

  const [phase, setPhase] = useState<"intro" | "running" | "result">(
    activeAttempt ? "running" : "intro",
  );
  const [attemptId, setAttemptId] = useState<string | null>(
    activeAttempt?.attemptId ?? null,
  );
  const startMsRef = useRef<number>(
    activeAttempt ? new Date(activeAttempt.startedAt).getTime() : 0,
  );
  const durationMsRef = useRef<number>(
    (activeAttempt?.durationMinutes ?? simulado.durationMinutes) * 60000,
  );
  const [remaining, setRemaining] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const finishedRef = useRef(false);
  const [usedSeconds, setUsedSeconds] = useState(0);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const finish = useCallback(
    async (expired: boolean) => {
      if (finishedRef.current || !attemptId) return;
      finishedRef.current = true;
      setError("");
      setBusy(true);
      setUsedSeconds(
        Math.min(
          durationMsRef.current,
          Date.now() - startMsRef.current,
        ) / 1000,
      );
      try {
        if (!supabase) throw new Error("Sessão indisponível.");
        const { data, error: rpcError } = await supabase.rpc("finish_simulado", {
          p_attempt_id: attemptId,
          p_answers: answersRef.current,
          p_expired: expired,
        });
        if (rpcError) throw rpcError;
        setResult(data as SubmitResult);
        setPhase("result");
      } catch (finishError) {
        finishedRef.current = false; // permite tentar de novo
        console.error("[simulado] finalizar:", finishError);
        setError(getSupabaseErrorMessage(finishError, "Não foi possível finalizar."));
      } finally {
        setBusy(false);
      }
    },
    [attemptId, supabase],
  );

  // Timer: conta a partir de started_at salvo (sobrevive a reload). Zera -> finaliza.
  useEffect(() => {
    if (phase !== "running" || !attemptId) return;
    const end = startMsRef.current + durationMsRef.current;
    const tick = () => {
      const left = Math.round((end - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) finish(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, attemptId, finish]);

  async function start() {
    setError("");
    if (!supabase || !user) {
      setError("Entre para iniciar o simulado.");
      return;
    }
    setBusy(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("start_simulado", {
        p_simulado_id: simulado.id,
      });
      if (rpcError) throw rpcError;
      const att = data as {
        attempt_id: string;
        started_at: string;
        duration_minutes: number;
      };
      setAttemptId(att.attempt_id);
      startMsRef.current = new Date(att.started_at).getTime();
      durationMsRef.current = att.duration_minutes * 60000;
      finishedRef.current = false;
      setPhase("running");
    } catch (startError) {
      console.error("[simulado] iniciar:", startError);
      setError(getSupabaseErrorMessage(startError, "Não foi possível iniciar."));
    } finally {
      setBusy(false);
    }
  }

  // -------- Não logado --------
  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">Entre na sua conta para fazer este simulado.</p>
        <Link href="/login" className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          Entrar
        </Link>
      </div>
    );
  }

  // -------- Resultado --------
  if (phase === "result" && result) {
    const percent = result.total ? Math.round((result.score / result.total) * 100) : 0;
    const errors = result.total - result.score;
    const officialPace =
      simulado.officialQuestions > 0
        ? (simulado.officialMinutes / simulado.officialQuestions).toFixed(1)
        : null;
    const yourPace = result.total ? (usedSeconds / 60 / result.total).toFixed(1) : "0";
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          {result.expired ? (
            <p className="text-sm font-semibold text-amber-600">Tempo esgotado — finalizado automaticamente</p>
          ) : (
            <p className="text-sm font-semibold uppercase text-sky-700">Resultado</p>
          )}
          <p className="mt-2 text-5xl font-bold text-slate-950">{percent}%</p>
          <p className="mt-2 text-slate-600">
            {result.score} acertos · {errors} erros · {result.total} questões
          </p>
          <p className="mt-1 text-sm text-slate-500">Tempo usado: {fmt(usedSeconds)}</p>
          {officialPace ? (
            <p className="mt-3 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Seu ritmo: ~{yourPace} min/questão · Ritmo oficial {simulado.vestibular}: ~{officialPace} min/questão ({simulado.officialMinutes} min para {simulado.officialQuestions} questões)
            </p>
          ) : null}
          <Link href="/simulados" className="mt-5 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Voltar aos simulados
          </Link>
        </div>

        <div className="space-y-4">
          {result.results.map((item, i) => (
            <article key={item.question_id} className={`rounded-xl border bg-white p-5 shadow-sm ${item.is_correct ? "border-emerald-200" : "border-red-200"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">{i + 1}. {item.subject}</span>
                <span className={`inline-flex items-center gap-1 text-sm font-semibold ${item.is_correct ? "text-emerald-700" : "text-red-700"}`}>
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
                    <p key={l} className={`rounded px-2 py-1 ${isCorrect ? "bg-emerald-50 font-semibold text-emerald-800" : isSelected ? "bg-red-50 text-red-700" : "text-slate-600"}`}>
                      {l}) {item.alternatives[l]}{isCorrect ? " ✓" : isSelected ? " (sua resposta)" : ""}
                    </p>
                  );
                })}
              </div>
              {item.explanation ? (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  <span className="font-semibold">Explicação: </span>{item.explanation}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    );
  }

  // -------- Intro (regras) --------
  if (phase === "intro") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <h2 className="text-lg font-semibold text-slate-950">Regras do {simulado.vestibular}</h2>
        <p className="mt-3 leading-7 text-slate-600">{simulado.rules}</p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2"><Clock size={16} className="text-sky-700" /> {simulado.durationMinutes} min neste simulado</span>
          <span>·</span>
          <span>{simulado.questionCount} questões</span>
          {simulado.officialMinutes > 0 ? (
            <span className="text-slate-500">(formato oficial: {simulado.officialQuestions} questões em {simulado.officialMinutes} min)</span>
          ) : null}
        </div>
        {error ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        <button
          type="button"
          onClick={start}
          disabled={busy}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
        >
          <Play size={16} />
          {busy ? "Iniciando..." : "Iniciar simulado"}
        </button>
        <p className="mt-3 text-xs text-slate-500">O cronômetro começa ao iniciar e continua mesmo se você recarregar a página.</p>
      </div>
    );
  }

  // -------- Running --------
  if (questions.length === 0) {
    return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">Este simulado ainda não tem questões.</div>;
  }

  const question = questions[index];
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / questions.length) * 100);
  const isLast = index === questions.length - 1;
  const timeUp = remaining <= 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-500">Questão {index + 1} de {questions.length} · {answered} respondidas</span>
        <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-bold ${timeUp ? "bg-red-100 text-red-700" : remaining < 60 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
          <Clock size={15} /> {fmt(remaining)}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <p className="mt-6 text-xs font-semibold uppercase text-sky-700">{question.subject}</p>
      <p className="mt-2 text-lg font-medium leading-7 text-slate-950">{question.questionText}</p>

      <div className="mt-5 space-y-2">
        {LETTERS.filter((l) => question.alternatives[l] !== undefined).map((l) => {
          const selected = answers[question.id] === l;
          return (
            <button
              key={l}
              type="button"
              disabled={timeUp || busy}
              onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: l }))}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition disabled:opacity-60 ${selected ? "border-sky-500 bg-sky-50 text-slate-950" : "border-slate-200 hover:border-sky-200 hover:bg-slate-50"}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"}`}>{l}</span>
              <span>{question.alternatives[l]}</span>
            </button>
          );
        })}
      </div>

      {timeUp ? <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Tempo esgotado. Finalizando...</p> : null}
      {error ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 flex items-center justify-between">
        <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
          <ArrowLeft size={16} /> Anterior
        </button>
        {isLast ? (
          <button type="button" onClick={() => finish(false)} disabled={busy || timeUp} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70">
            <Flag size={16} /> {busy ? "Enviando..." : "Finalizar simulado"}
          </button>
        ) : (
          <button type="button" onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            Próxima <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
