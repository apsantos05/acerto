import { createClient } from "@/lib/supabase/server";

export type SimuladoSummary = {
  id: string;
  title: string;
  description: string;
  vestibular: string;
  faculty: string;
  durationMinutes: number;
  difficulty: string;
  subjects: string[];
  questionCount: number;
  status?: "draft" | "published";
};

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
  difficulty: string | null;
  subjects: string[] | null;
  question_count: number | null;
  status: string | null;
};

const SIM_COLS =
  "id,title,description,vestibular,faculty,duration_minutes,difficulty,subjects,question_count,status";

function mapSimulado(row: SimuladoRow): SimuladoSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    vestibular: row.vestibular ?? "Geral",
    faculty: row.faculty ?? "Medicina",
    durationMinutes: row.duration_minutes ?? 60,
    difficulty: row.difficulty ?? "médio",
    subjects: row.subjects ?? [],
    questionCount: row.question_count ?? 0,
    status: row.status === "draft" ? "draft" : "published",
  };
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
