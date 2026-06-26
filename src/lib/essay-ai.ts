// Correção de redação por IA (server-only). Modular: OpenAI OU Anthropic via REST.
// Sem SDK (usa fetch). A chave NUNCA vai para o cliente.

export const EXAM_TYPES = ["enem", "fuvest", "unicamp", "tradicional"] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export const EXAM_LABELS: Record<ExamType, string> = {
  enem: "ENEM",
  fuvest: "FUVEST",
  unicamp: "UNICAMP",
  tradicional: "Vestibular tradicional",
};

export const AI_DISCLAIMER =
  "Esta é uma estimativa automática e não substitui correção oficial.";

export function isExamType(value: string): value is ExamType {
  return (EXAM_TYPES as readonly string[]).includes(value);
}

export type EssayCorrection = {
  scoreTotal: number; // ENEM: 0–1000; demais: 0–100
  competencia1: number | null;
  competencia2: number | null;
  competencia3: number | null;
  competencia4: number | null;
  competencia5: number | null;
  feedbackGeneral: string;
  feedbackStructure: string;
  feedbackGrammar: string;
  feedbackArgumentation: string;
  feedbackIntervention: string;
  strengths: string[];
  weaknesses: string[];
  suggestedRewrite: string;
  aiModel: string;
  raw: unknown;
};

function provider(): "openai" | "anthropic" {
  const p = process.env.ESSAY_AI_PROVIDER?.trim().toLowerCase();
  if (p === "openai") return "openai";
  if (p === "anthropic") return "anthropic";
  // Auto: usa a chave que existir (Anthropic primeiro — projeto já usa Claude).
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "anthropic";
}

function buildPrompt(input: { examType: ExamType; theme: string; essay: string }) {
  const isEnem = input.examType === "enem";
  const scale = isEnem
    ? "Escala ENEM: 5 competências de 0 a 200 cada; nota final (score_total) de 0 a 1000 (soma das competências)."
    : "Escala 0 a 100 para a nota final (score_total). As competências (competencia_1..5) devem ser null.";

  const system = `Você é um corretor experiente de redação para ${EXAM_LABELS[input.examType]}.
Avalie a redação do aluno de forma rigorosa, construtiva e em português do Brasil.
${scale}
Competências ENEM: 1) domínio da norma culta; 2) compreensão do tema; 3) seleção/organização de argumentos; 4) coesão e mecanismos linguísticos; 5) proposta de intervenção (só ENEM tem competência 5).
Responda SOMENTE com um objeto JSON válido (sem markdown, sem comentários), exatamente neste formato:
{
  "score_total": number,
  "competencia_1": number | null,
  "competencia_2": number | null,
  "competencia_3": number | null,
  "competencia_4": number | null,
  "competencia_5": number | null,
  "feedback_general": string,
  "feedback_structure": string,
  "feedback_grammar": string,
  "feedback_argumentation": string,
  "feedback_intervention": string,
  "strengths": string[],
  "weaknesses": string[],
  "suggested_rewrite": string
}
"suggested_rewrite" deve ser uma versão melhorada de 1 parágrafo (introdução ou um trecho), não a redação inteira.`;

  const user = `Tipo de prova: ${EXAM_LABELS[input.examType]}
Tema: ${input.theme || "(não informado)"}

Redação do aluno:
"""
${input.essay}
"""`;

  return { system, user };
}

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice) as Record<string, unknown>;
}

async function callAnthropic(
  system: string,
  user: string,
): Promise<{ text: string; model: string }> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) throw new Error("ANTHROPIC_API_KEY não configurada.");
  const model = process.env.ESSAY_AI_MODEL?.trim() || "claude-sonnet-4-6";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic falhou (${res.status}): ${await res.text().catch(() => "")}`);
  }
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content ?? []).map((c) => c.text ?? "").join("");
  return { text, model };
}

async function callOpenAI(
  system: string,
  user: string,
): Promise<{ text: string; model: string }> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OPENAI_API_KEY não configurada.");
  const model = process.env.ESSAY_AI_MODEL?.trim() || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI falhou (${res.status}): ${await res.text().catch(() => "")}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return { text, model };
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/** Corrige a redação. Lança em caso de falha (o chamador marca status 'failed'). */
export async function correctEssay(input: {
  examType: ExamType;
  theme: string;
  essay: string;
}): Promise<EssayCorrection> {
  const { system, user } = buildPrompt(input);
  const { text, model } =
    provider() === "openai"
      ? await callOpenAI(system, user)
      : await callAnthropic(system, user);

  const json = extractJson(text);
  const isEnem = input.examType === "enem";
  const maxTotal = isEnem ? 1000 : 100;
  const clampTotal = Math.max(0, Math.min(maxTotal, num(json.score_total) ?? 0));

  return {
    scoreTotal: clampTotal,
    competencia1: isEnem ? num(json.competencia_1) : null,
    competencia2: isEnem ? num(json.competencia_2) : null,
    competencia3: isEnem ? num(json.competencia_3) : null,
    competencia4: isEnem ? num(json.competencia_4) : null,
    competencia5: isEnem ? num(json.competencia_5) : null,
    feedbackGeneral: str(json.feedback_general),
    feedbackStructure: str(json.feedback_structure),
    feedbackGrammar: str(json.feedback_grammar),
    feedbackArgumentation: str(json.feedback_argumentation),
    feedbackIntervention: str(json.feedback_intervention),
    strengths: arr(json.strengths),
    weaknesses: arr(json.weaknesses),
    suggestedRewrite: str(json.suggested_rewrite),
    aiModel: model,
    raw: json,
  };
}
