// =====================================================================
// Diagnóstico de Aprovação — lógica PURA (sem imports de servidor).
// Catálogo das perguntas + cálculo de score/recomendações no servidor.
// Reutilizável no form (client) e na rota /api/diagnostico (server).
// =====================================================================

import type { Plan } from "@/lib/plan";

// ---------------- Opções (valores = o que vai pro banco) ----------------
export const UNIVERSITIES = [
  "USP / FUVEST",
  "UNICAMP",
  "UNESP",
  "FAMERP",
  "UFSC",
  "UFPR",
  "UFMG",
  "UNIFESP",
  "Einstein",
  "Santa Casa",
  "SLMandic",
  "ENEM/SISU",
] as const;

export const COURSES = ["Medicina", "Outro"] as const;

export const STUDY_HOURS = [
  "menos de 1h",
  "1 a 2h",
  "2 a 4h",
  "4 a 6h",
  "mais de 6h",
] as const;

export const PHASES = [
  "ensino médio",
  "cursinho",
  "tentando novamente",
  "faculdade / transferência",
  "outro",
] as const;

export const MOCK_AVERAGES = [
  "ainda não faço simulados",
  "abaixo de 40%",
  "40% a 60%",
  "60% a 75%",
  "acima de 75%",
] as const;

export const SUBJECTS = [
  "Biologia",
  "Química",
  "Física",
  "Matemática",
  "Redação",
  "Português",
  "História",
  "Geografia",
  "Filosofia",
  "Sociologia",
  "Inglês",
] as const;

export const MOCKS_PER_MONTH = ["nenhum", "1", "2", "3 a 4", "5+"] as const;

export const DIFFICULTIES = [
  "falta de organização",
  "falta de materiais",
  "dificuldade em redação",
  "baixo desempenho em exatas",
  "baixo desempenho em humanas",
  "falta de constância",
  "ansiedade na prova",
] as const;

export const TIMELINES = [
  "este ano",
  "próximo ano",
  "daqui 2 anos",
  "ainda não sei",
] as const;

// ---------------- Tipos ----------------
export type DiagnosticAnswers = {
  targetUniversity: string;
  course: string;
  studyHours: string;
  phase: string;
  mockAverage: string;
  strongSubjects: string[];
  weakSubjects: string[];
  mocksPerMonth: string;
  mainDifficulty: string;
  timeline: string;
  email?: string;
};

export type DiagnosticResult = {
  preparationScore: number;
  approvalChance: string;
  studentProfile: string;
  strongSubjects: string[];
  weakSubjects: string[];
  risks: string[];
  recommendedTrackSlug: string | null;
  recommendedPlan: Plan;
  recommendedPlanReason: string;
  nextActions: string[];
};

// ---------------- Mapeamento universidade -> trilha ----------------
export const TRACK_MAP: Record<string, string | null> = {
  "USP / FUVEST": "medicina-usp-fuvest",
  UNICAMP: "medicina-unicamp-comvest",
  UNESP: "medicina-unesp",
  FAMERP: "medicina-famerp",
  UFSC: "medicina-ufsc",
  UFPR: "medicina-ufpr",
  UFMG: "medicina-ufmg",
  UNIFESP: "medicina-unifesp",
  Einstein: "medicina-einstein",
  "Santa Casa": "medicina-santa-casa",
  SLMandic: "medicina-slmandic",
  "ENEM/SISU": null,
};

// ---------------- Pontuações ----------------
const HOURS_POINTS: Record<string, number> = {
  "menos de 1h": 5,
  "1 a 2h": 10,
  "2 a 4h": 18,
  "4 a 6h": 25,
  "mais de 6h": 30,
};
const AVG_POINTS: Record<string, number> = {
  "ainda não faço simulados": 0,
  "abaixo de 40%": 8,
  "40% a 60%": 15,
  "60% a 75%": 25,
  "acima de 75%": 35,
};
const MONTH_POINTS: Record<string, number> = {
  nenhum: 0,
  "1": 5,
  "2": 10,
  "3 a 4": 15,
  "5+": 20,
};

const EXATAS = new Set(["Matemática", "Física", "Química"]);
const HUMANAS = new Set(["História", "Geografia", "Filosofia", "Sociologia"]);

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

function isOneOf<T extends readonly string[]>(
  value: unknown,
  options: T,
): value is T[number] {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

/** Normaliza/sanitiza respostas vindas do cliente (defesa no servidor). */
export function sanitizeAnswers(raw: unknown): DiagnosticAnswers | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const onlyKnown = (arr: unknown) =>
    Array.isArray(arr)
      ? arr.filter((s): s is string => isOneOf(s, SUBJECTS))
      : [];

  if (
    !isOneOf(r.targetUniversity, UNIVERSITIES) ||
    !isOneOf(r.course, COURSES) ||
    !isOneOf(r.studyHours, STUDY_HOURS) ||
    !isOneOf(r.phase, PHASES) ||
    !isOneOf(r.mockAverage, MOCK_AVERAGES) ||
    !isOneOf(r.mocksPerMonth, MOCKS_PER_MONTH) ||
    !isOneOf(r.mainDifficulty, DIFFICULTIES) ||
    !isOneOf(r.timeline, TIMELINES)
  ) {
    return null;
  }

  const email =
    typeof r.email === "string" && r.email.trim().length > 0
      ? r.email.trim().slice(0, 200)
      : undefined;

  return {
    targetUniversity: r.targetUniversity,
    course: r.course,
    studyHours: r.studyHours,
    phase: r.phase,
    mockAverage: r.mockAverage,
    strongSubjects: onlyKnown(r.strongSubjects),
    weakSubjects: onlyKnown(r.weakSubjects),
    mocksPerMonth: r.mocksPerMonth,
    mainDifficulty: r.mainDifficulty,
    timeline: r.timeline,
    email,
  };
}

/** Calcula score (0–100), perfil, riscos e recomendações. SERVER-SIDE. */
export function computeDiagnostic(a: DiagnosticAnswers): DiagnosticResult {
  let raw =
    (HOURS_POINTS[a.studyHours] ?? 0) +
    (AVG_POINTS[a.mockAverage] ?? 0) +
    (MONTH_POINTS[a.mocksPerMonth] ?? 0);

  // Consistência: penaliza falta de constância.
  if (a.mainDifficulty === "falta de constância") raw -= 10;
  // Bônus: muitas horas + simulados frequentes.
  if (
    (a.studyHours === "4 a 6h" || a.studyHours === "mais de 6h") &&
    (a.mocksPerMonth === "3 a 4" || a.mocksPerMonth === "5+")
  ) {
    raw += 10;
  }

  // Normaliza para 0–100 (máximo do núcleo = 85).
  const preparationScore = clamp(Math.round((raw / 85) * 100), 0, 100);
  const isMed = a.course === "Medicina";

  // Perfil
  let studentProfile: string;
  if (preparationScore >= 80)
    studentProfile = isMed ? "Alta performance Medicina" : "Avançado competitivo";
  else if (preparationScore >= 60) studentProfile = "Avançado competitivo";
  else if (preparationScore >= 40) studentProfile = "Intermediário com lacunas";
  else studentProfile = "Iniciante organizado";

  // Chance de aprovação
  let approvalChance: string;
  if (preparationScore >= 80)
    approvalChance =
      "Alta — desempenho forte; mantenha o ritmo e foque em simulados oficiais.";
  else if (preparationScore >= 60)
    approvalChance =
      "Boa — você está competitivo; ajuste seus pontos fracos para subir.";
  else if (preparationScore >= 40)
    approvalChance =
      "Intermediária — você já tem boa base, mas precisa melhorar constância e simulados.";
  else
    approvalChance =
      "Baixa — você está começando; foque em criar rotina e base sólida.";

  // Riscos
  const risks: string[] = [];
  if (a.studyHours === "menos de 1h" || a.studyHours === "1 a 2h")
    risks.push("Poucas horas de estudo por dia");
  if (a.mocksPerMonth === "nenhum" || a.mocksPerMonth === "1")
    risks.push("Poucos simulados por mês");
  if (a.mockAverage === "ainda não faço simulados")
    risks.push("Você ainda não treina com simulados");
  if (a.weakSubjects.some((s) => EXATAS.has(s)) || a.mainDifficulty === "baixo desempenho em exatas")
    risks.push("Baixo desempenho em exatas");
  if (a.weakSubjects.some((s) => HUMANAS.has(s)) || a.mainDifficulty === "baixo desempenho em humanas")
    risks.push("Baixo desempenho em humanas");
  if (a.weakSubjects.includes("Redação") || a.mainDifficulty === "dificuldade em redação")
    risks.push("Sem rotina de redação");
  if (a.mainDifficulty === "falta de constância")
    risks.push("Baixa constância nos estudos");
  if (a.mainDifficulty === "falta de organização")
    risks.push("Falta de organização/rotina");
  if (a.mainDifficulty === "falta de materiais")
    risks.push("Falta de materiais de qualidade");
  if (a.mainDifficulty === "ansiedade na prova")
    risks.push("Ansiedade na prova");

  // Trilha recomendada
  const recommendedTrackSlug = TRACK_MAP[a.targetUniversity] ?? null;

  // Plano recomendado
  let recommendedPlan: Plan;
  let recommendedPlanReason: string;
  const lowConsistency =
    a.mainDifficulty === "falta de constância" ||
    a.mainDifficulty === "falta de organização";
  if (isMed) {
    recommendedPlan = "premium_med";
    if (lowConsistency)
      recommendedPlanReason =
        "Premium Medicina com cronograma personalizado para criar constância e rotina.";
    else if (preparationScore >= 60)
      recommendedPlanReason =
        "Premium Medicina com simulados oficiais por banca para competir de igual para igual.";
    else
      recommendedPlanReason =
        "Premium Medicina: trilha completa, simulados oficiais e materiais premium focados na sua aprovação.";
  } else if (preparationScore < 40) {
    recommendedPlan = "free";
    recommendedPlanReason =
      "Comece no Free para criar rotina; evolua para o Premium quando quiser o acervo completo.";
  } else {
    recommendedPlan = "premium";
    recommendedPlanReason =
      "Premium: acervo completo, simulados ilimitados e estatísticas avançadas.";
  }

  // Próximas ações
  const nextActions: string[] = [
    recommendedTrackSlug
      ? "Iniciar a trilha recomendada para a sua universidade-alvo"
      : "Explorar as trilhas por universidade",
    "Fazer um simulado diagnóstico para medir seu ponto de partida",
    "Favoritar os materiais prioritários das suas matérias",
  ];
  if (a.weakSubjects.length > 0)
    nextActions.push(`Revisar suas matérias fracas: ${a.weakSubjects.join(", ")}`);
  if (a.weakSubjects.includes("Redação") || a.mainDifficulty === "dificuldade em redação")
    nextActions.push("Criar uma rotina semanal de redação");
  if (recommendedPlan === "premium_med")
    nextActions.push("Assinar o Premium Medicina para o plano completo de aprovação");

  return {
    preparationScore,
    approvalChance,
    studentProfile,
    strongSubjects: a.strongSubjects,
    weakSubjects: a.weakSubjects,
    risks,
    recommendedTrackSlug,
    recommendedPlan,
    recommendedPlanReason,
    nextActions,
  };
}
