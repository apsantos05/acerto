"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  COURSES,
  DIFFICULTIES,
  MOCK_AVERAGES,
  MOCKS_PER_MONTH,
  PHASES,
  STUDY_HOURS,
  SUBJECTS,
  TIMELINES,
  UNIVERSITIES,
  type DiagnosticAnswers,
} from "@/lib/diagnostico";

type StepKey =
  | "targetUniversity"
  | "course"
  | "studyHours"
  | "phase"
  | "mockAverage"
  | "strongSubjects"
  | "weakSubjects"
  | "mocksPerMonth"
  | "mainDifficulty"
  | "timeline";

type Step = {
  key: StepKey;
  title: string;
  options: readonly string[];
  multi?: boolean;
};

const STEPS: Step[] = [
  { key: "targetUniversity", title: "Qual vestibular/universidade você quer?", options: UNIVERSITIES },
  { key: "course", title: "Qual curso?", options: COURSES },
  { key: "studyHours", title: "Quantas horas você estuda por dia?", options: STUDY_HOURS },
  { key: "phase", title: "Em que fase você está?", options: PHASES },
  { key: "mockAverage", title: "Qual sua média em simulados?", options: MOCK_AVERAGES },
  { key: "strongSubjects", title: "Quais matérias são seus pontos fortes?", options: SUBJECTS, multi: true },
  { key: "weakSubjects", title: "Quais matérias são seus pontos fracos?", options: SUBJECTS, multi: true },
  { key: "mocksPerMonth", title: "Quantos simulados você faz por mês?", options: MOCKS_PER_MONTH },
  { key: "mainDifficulty", title: "Qual sua maior dificuldade hoje?", options: DIFFICULTIES },
  { key: "timeline", title: "Quando pretende prestar o vestibular?", options: TIMELINES },
];

const EMPTY: DiagnosticAnswers = {
  targetUniversity: "",
  course: "",
  studyHours: "",
  phase: "",
  mockAverage: "",
  strongSubjects: [],
  weakSubjects: [],
  mocksPerMonth: "",
  mainDifficulty: "",
  timeline: "",
};

export function DiagnosticForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<DiagnosticAnswers>(EMPTY);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Passo extra de e-mail (opcional) só para quem não está logado.
  const emailStepIndex = STEPS.length;
  const isEmailStep = step === emailStepIndex && !user;
  const totalSteps = user ? STEPS.length : STEPS.length + 1;
  const progress = Math.round(((step + (isEmailStep ? 1 : 0)) / totalSteps) * 100);

  const current = STEPS[step];

  const selectedSingle = useMemo(
    () => (current && !current.multi ? (answers[current.key] as string) : ""),
    [current, answers],
  );

  async function submit(final: DiagnosticAnswers) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...final, email: email.trim() || undefined }),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error || "Falha ao gerar diagnóstico.");
      router.push(`/diagnostico/resultado?id=${json.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao enviar.");
      setSubmitting(false);
    }
  }

  function goNextAfterSingle(key: StepKey, value: string) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else if (user) {
      submit(next);
    } else {
      setStep(emailStepIndex);
    }
  }

  function toggleMulti(key: StepKey, value: string) {
    setAnswers((prev) => {
      const arr = prev[key] as string[];
      const next = arr.includes(value)
        ? arr.filter((s) => s !== value)
        : [...arr, value];
      return { ...prev, [key]: next };
    });
  }

  function nextFromMulti() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else if (user) submit(answers);
    else setStep(emailStepIndex);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8 dark:border-slate-800 dark:bg-slate-900">
      {/* Progresso */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>
          Etapa {Math.min(step + 1, totalSteps)} de {totalSteps}
        </span>
        <span>{progress}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {isEmailStep ? (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            Quase lá! Para onde enviamos seu diagnóstico?
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Seu e-mail é opcional — você verá o resultado na próxima tela de qualquer forma.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com (opcional)"
            className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-sky-500/30"
          />
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(STEPS.length - 1)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <button
              type="button"
              onClick={() => submit(answers)}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {submitting ? "Gerando..." : "Ver meu diagnóstico"}
            </button>
          </div>
        </div>
      ) : current ? (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            {current.title}
          </h2>
          {current.multi ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Selecione quantas quiser.
            </p>
          ) : null}

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {current.options.map((opt) => {
              const isSelected = current.multi
                ? (answers[current.key] as string[]).includes(opt)
                : selectedSingle === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() =>
                    current.multi
                      ? toggleMulti(current.key, opt)
                      : goNextAfterSingle(current.key, opt)
                  }
                  className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    isSelected
                      ? "border-sky-500 bg-sky-50 text-slate-950 dark:border-sky-500 dark:bg-sky-500/10 dark:text-white"
                      : "border-slate-200 text-slate-700 hover:border-sky-200 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-sky-500/50 dark:hover:bg-slate-800"
                  }`}
                >
                  {opt}
                  {isSelected ? <Check size={16} className="shrink-0 text-sky-600 dark:text-sky-400" /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            {current.multi ? (
              <button
                type="button"
                onClick={nextFromMulti}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Continuar <ArrowRight size={16} />
              </button>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Toque numa opção para avançar
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
