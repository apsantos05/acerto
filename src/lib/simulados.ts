import { createClient } from "@/lib/supabase/server";
import { normalizePlan, type Plan } from "@/lib/plan";

export type SimuladoKind = "rapido" | "oficial";

export type SimuladoSummary = {
  id: string;
  title: string;
  description: string;
  vestibular: string;
  faculty: string;
  durationMinutes: number;
  officialMinutes: number;
  officialQuestions: number;
  rules: string;
  difficulty: string;
  subjects: string[];
  questionCount: number;
  status?: "draft" | "published";
  kind: SimuladoKind;
  examSlug: string | null;
  examDay: number | null;
  planRequired: Plan;
  officialSubjects: string[];
};

export type ActiveAttempt = {
  attemptId: string;
  startedAt: string;
  durationMinutes: number;
  totalQuestions: number;
  draftAnswers: Record<string, string>;
  flagged: string[];
  timeRemaining: number | null;
};

// Catálogo das provas oficiais (para os hubs de SEO e a navegação).
export const OFFICIAL_EXAMS: {
  slug: string;
  name: string;
  blurb: string;
}[] = [
  { slug: "enem", name: "ENEM", blurb: "Simulado oficial do ENEM (1º e 2º dia) com tempo e estrutura reais." },
  { slug: "fuvest", name: "FUVEST", blurb: "Simulado oficial da 1ª fase da FUVEST (USP)." },
  { slug: "unicamp", name: "UNICAMP", blurb: "Simulado oficial da 1ª fase da UNICAMP (Comvest)." },
  { slug: "unesp", name: "UNESP", blurb: "Simulado oficial da UNESP (VUNESP)." },
  { slug: "ufsc", name: "UFSC", blurb: "Simulado oficial da UFSC." },
  { slug: "famerp", name: "FAMERP", blurb: "Simulado oficial da FAMERP — Medicina (Premium Medicina)." },
  { slug: "einstein", name: "Albert Einstein", blurb: "Simulado oficial do Einstein — Medicina (Premium Medicina)." },
  { slug: "santacasa", name: "Santa Casa", blurb: "Simulado oficial da Santa Casa — Medicina (Premium Medicina)." },
  { slug: "slmandic", name: "SLMandic", blurb: "Simulado oficial da SLMandic — Medicina (Premium Medicina)." },
];

export function getExam(slug: string) {
  return OFFICIAL_EXAMS.find((e) => e.slug === slug);
}

export type SimuladoQuestion = {
  id: string;
  subject: string;
  questionText: string;
  alternatives: Record<string, string>;
  difficulty: string;
  orderIndex: number;
};

export type SimuladoStats = {
  attempts: number;
  bestPercent: number;
  last: { title: string; score: number; total: number } | null;
};

type SimuladoRow = {
  id: string;
  title: string;
  description: string | null;
  vestibular: string | null;
  faculty: string | null;
  duration_minutes: number | null;
  official_minutes: number | null;
  official_questions: number | null;
  rules: string | null;
  difficulty: string | null;
  subjects: string[] | null;
  question_count: number | null;
  status: string | null;
  kind: string | null;
  exam_slug: string | null;
  exam_day: number | null;
  plan_required: string | null;
  official_subjects: string[] | null;
};

const SIM_COLS =
  "id,title,description,vestibular,faculty,duration_minutes,official_minutes,official_questions,rules,difficulty,subjects,question_count,status,kind,exam_slug,exam_day,plan_required,official_subjects";

function mapSimulado(row: SimuladoRow): SimuladoSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    vestibular: row.vestibular ?? "Geral",
    faculty: row.faculty ?? "Medicina",
    durationMinutes: row.duration_minutes ?? 60,
    officialMinutes: row.official_minutes ?? 0,
    officialQuestions: row.official_questions ?? 0,
    rules: row.rules ?? "",
    difficulty: row.difficulty ?? "médio",
    subjects: row.subjects ?? [],
    questionCount: row.question_count ?? 0,
    status: row.status === "draft" ? "draft" : "published",
    kind: row.kind === "oficial" ? "oficial" : "rapido",
    examSlug: row.exam_slug,
    examDay: row.exam_day,
    planRequired: normalizePlan(row.plan_required),
    officialSubjects: row.official_subjects ?? [],
  };
}

export async function getActiveAttempt(
  simuladoId: string,
): Promise<ActiveAttempt | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("simulado_attempts")
      .select("id,started_at,duration_minutes,total_questions,draft_answers,flagged,time_remaining")
      .eq("simulado_id", simuladoId)
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return {
      attemptId: data.id as string,
      startedAt: data.started_at as string,
      durationMinutes: (data.duration_minutes as number) ?? 60,
      totalQuestions: (data.total_questions as number) ?? 0,
      draftAnswers: (data.draft_answers as Record<string, string>) ?? {},
      flagged: (data.flagged as string[]) ?? [],
      timeRemaining: (data.time_remaining as number | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function getSimulados(): Promise<SimuladoSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("simulados")
      .select(SIM_COLS)
      .eq("status", "published")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[simulados] lista falhou:", error);
      return [];
    }
    return ((data ?? []) as SimuladoRow[]).map(mapSimulado);
  } catch (listError) {
    console.error("[simulados] exceção:", listError);
    return [];
  }
}

export async function getSimulado(id: string): Promise<SimuladoSummary | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("simulados")
      .select(SIM_COLS)
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return mapSimulado(data as SimuladoRow);
  } catch {
    return null;
  }
}

export async function getSimuladoQuestions(
  id: string,
): Promise<SimuladoQuestion[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_simulado_questions", {
      p_simulado_id: id,
    });
    if (error) {
      console.error("[simulados] questões falharam:", error);
      return [];
    }
    return (
      (data ?? []) as Array<{
        id: string;
        subject: string;
        question_text: string;
        alternatives: Record<string, string>;
        difficulty: string;
        order_index: number;
      }>
    ).map((q) => ({
      id: q.id,
      subject: q.subject,
      questionText: q.question_text,
      alternatives: q.alternatives,
      difficulty: q.difficulty,
      orderIndex: q.order_index,
    }));
  } catch {
    return [];
  }
}

export async function getSimuladoStats(): Promise<SimuladoStats> {
  const empty: SimuladoStats = { attempts: 0, bestPercent: 0, last: null };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return empty;

    const { data, error } = await supabase
      .from("simulado_attempts")
      .select("score,total_questions,finished_at,simulado:simulados(title)")
      .eq("user_id", user.id)
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false });

    if (error) {
      console.error("[simulados] stats falharam:", error);
      return empty;
    }

    const rows = (data ?? []) as Array<{
      score: number | null;
      total_questions: number | null;
      simulado: { title: string } | { title: string }[] | null;
    }>;
    if (rows.length === 0) return empty;

    const bestPercent = Math.round(
      Math.max(
        ...rows.map((r) =>
          r.total_questions ? ((r.score ?? 0) / r.total_questions) * 100 : 0,
        ),
      ),
    );
    const lastRow = rows[0];
    const lastSim = Array.isArray(lastRow.simulado)
      ? lastRow.simulado[0]
      : lastRow.simulado;

    return {
      attempts: rows.length,
      bestPercent,
      last: {
        title: lastSim?.title ?? "Simulado",
        score: lastRow.score ?? 0,
        total: lastRow.total_questions ?? 0,
      },
    };
  } catch (statsError) {
    console.error("[simulados] stats exceção:", statsError);
    return empty;
  }
}

// -------- Simulados por categoria --------

async function listByKind(kind: SimuladoKind): Promise<SimuladoSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("simulados")
      .select(SIM_COLS)
      .eq("status", "published")
      .eq("kind", kind)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[simulados] lista por tipo falhou:", error);
      return [];
    }
    return ((data ?? []) as SimuladoRow[]).map(mapSimulado);
  } catch (listError) {
    console.error("[simulados] exceção lista por tipo:", listError);
    return [];
  }
}

export function getQuickSimulados() {
  return listByKind("rapido");
}

export function getOfficialSimulados() {
  return listByKind("oficial");
}

export async function getSimuladosByExam(
  examSlug: string,
): Promise<SimuladoSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("simulados")
      .select(SIM_COLS)
      .eq("status", "published")
      .eq("kind", "oficial")
      .eq("exam_slug", examSlug)
      .order("exam_day", { ascending: true });
    if (error) return [];
    return ((data ?? []) as SimuladoRow[]).map(mapSimulado);
  } catch {
    return [];
  }
}

// -------- Histórico do usuário --------

export type SubjectScore = { correct: number; total: number; percent: number };

export type SimuladoHistoryItem = {
  attemptId: string;
  simuladoId: string;
  title: string;
  examSlug: string | null;
  kind: SimuladoKind;
  score: number;
  total: number;
  percent: number;
  durationMinutes: number;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  subjectScores: Record<string, SubjectScore>;
  triScores: Record<string, number>;
};

export async function getSimuladoHistory(): Promise<SimuladoHistoryItem[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("simulado_attempts")
      .select(
        "id,simulado_id,score,total_questions,duration_minutes,started_at,finished_at,status,subject_scores,tri_scores,simulado:simulados(title,exam_slug,kind)",
      )
      .eq("user_id", user.id)
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[simulados] histórico falhou:", error);
      return [];
    }

    return (
      (data ?? []) as Array<{
        id: string;
        simulado_id: string;
        score: number | null;
        total_questions: number | null;
        duration_minutes: number | null;
        started_at: string;
        finished_at: string | null;
        status: string | null;
        subject_scores: Record<string, SubjectScore> | null;
        tri_scores: Record<string, number> | null;
        simulado:
          | { title: string; exam_slug: string | null; kind: string | null }
          | { title: string; exam_slug: string | null; kind: string | null }[]
          | null;
      }>
    ).map((row) => {
      const sim = Array.isArray(row.simulado) ? row.simulado[0] : row.simulado;
      const total = row.total_questions ?? 0;
      const score = row.score ?? 0;
      return {
        attemptId: row.id,
        simuladoId: row.simulado_id,
        title: sim?.title ?? "Simulado",
        examSlug: sim?.exam_slug ?? null,
        kind: sim?.kind === "oficial" ? "oficial" : "rapido",
        score,
        total,
        percent: total ? Math.round((score / total) * 100) : 0,
        durationMinutes: row.duration_minutes ?? 0,
        startedAt: row.started_at,
        finishedAt: row.finished_at,
        status: row.status ?? "completed",
        subjectScores: row.subject_scores ?? {},
        triScores: row.tri_scores ?? {},
      } satisfies SimuladoHistoryItem;
    });
  } catch (historyError) {
    console.error("[simulados] histórico exceção:", historyError);
    return [];
  }
}

// -------- Ranking de simulados --------

export type SimuladoRankingCategory =
  | "geral"
  | "enem"
  | "medicina"
  | "fuvest"
  | "unicamp";

export type SimuladoRankingEntry = {
  position: number;
  profileId: string;
  username: string | null;
  fullName: string;
  avatarUrl: string | null;
  bestPercent: number;
  attempts: number;
};

export async function getSimuladoRanking(
  category: SimuladoRankingCategory,
  limit = 20,
): Promise<SimuladoRankingEntry[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_simulado_ranking", {
      p_category: category,
      p_limit: limit,
    });
    if (error) {
      console.error("[simulados] ranking falhou:", error);
      return [];
    }
    return (
      (data ?? []) as Array<{
        rank_position: number;
        profile_id: string;
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
        best_percent: number | null;
        attempts: number | null;
      }>
    ).map((row) => ({
      position: Number(row.rank_position),
      profileId: row.profile_id,
      username: row.username,
      fullName: row.full_name || "Estudante AcertaVest",
      avatarUrl: row.avatar_url,
      bestPercent: Number(row.best_percent ?? 0),
      attempts: Number(row.attempts ?? 0),
    }));
  } catch {
    return [];
  }
}
