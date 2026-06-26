// Dados das redações (server-only). Escrita via service role; leitura via RLS.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EssayCorrection, ExamType } from "@/lib/essay-ai";

export type EssayStatus = "processing" | "completed" | "failed";

export type EssaySubmission = {
  id: string;
  userId: string;
  examType: ExamType;
  theme: string;
  essayText: string;
  wordCount: number;
  status: EssayStatus;
  scoreTotal: number | null;
  competencia1: number | null;
  competencia2: number | null;
  competencia3: number | null;
  competencia4: number | null;
  competencia5: number | null;
  feedbackGeneral: string | null;
  feedbackStructure: string | null;
  feedbackGrammar: string | null;
  feedbackArgumentation: string | null;
  feedbackIntervention: string | null;
  strengths: string[];
  weaknesses: string[];
  suggestedRewrite: string | null;
  aiModel: string | null;
  createdAt: string;
};

type Row = Record<string, unknown>;

const COLS =
  "id,user_id,exam_type,theme,essay_text,word_count,status,score_total,score_competencia_1,score_competencia_2,score_competencia_3,score_competencia_4,score_competencia_5,feedback_general,feedback_structure,feedback_grammar,feedback_argumentation,feedback_intervention,strengths,weaknesses,suggested_rewrite,ai_model,created_at";

function mapRow(r: Row): EssaySubmission {
  const s = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : null);
  const ni = (k: string) => (typeof r[k] === "number" ? (r[k] as number) : null);
  const a = (k: string) => (Array.isArray(r[k]) ? (r[k] as string[]) : []);
  return {
    id: r.id as string,
    userId: r.user_id as string,
    examType: (r.exam_type as ExamType) ?? "enem",
    theme: (r.theme as string) ?? "",
    essayText: (r.essay_text as string) ?? "",
    wordCount: (r.word_count as number) ?? 0,
    status: (r.status as EssayStatus) ?? "processing",
    scoreTotal: ni("score_total"),
    competencia1: ni("score_competencia_1"),
    competencia2: ni("score_competencia_2"),
    competencia3: ni("score_competencia_3"),
    competencia4: ni("score_competencia_4"),
    competencia5: ni("score_competencia_5"),
    feedbackGeneral: s("feedback_general"),
    feedbackStructure: s("feedback_structure"),
    feedbackGrammar: s("feedback_grammar"),
    feedbackArgumentation: s("feedback_argumentation"),
    feedbackIntervention: s("feedback_intervention"),
    strengths: a("strengths"),
    weaknesses: a("weaknesses"),
    suggestedRewrite: s("suggested_rewrite"),
    aiModel: s("ai_model"),
    createdAt: r.created_at as string,
  };
}

// ---------------- Escrita (service role) ----------------
export async function createProcessingSubmission(input: {
  userId: string;
  examType: ExamType;
  theme: string;
  essay: string;
  wordCount: number;
}): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("essay_submissions")
      .insert({
        user_id: input.userId,
        exam_type: input.examType,
        theme: input.theme,
        essay_text: input.essay,
        word_count: input.wordCount,
        status: "processing",
      })
      .select("id")
      .single();
    if (error) {
      console.error("[redacoes] insert falhou:", error);
      return null;
    }
    return data.id as string;
  } catch (e) {
    console.error("[redacoes] insert exceção:", e);
    return null;
  }
}

export async function applyCorrection(id: string, c: EssayCorrection): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin
      .from("essay_submissions")
      .update({
        status: "completed",
        score_total: c.scoreTotal,
        score_competencia_1: c.competencia1,
        score_competencia_2: c.competencia2,
        score_competencia_3: c.competencia3,
        score_competencia_4: c.competencia4,
        score_competencia_5: c.competencia5,
        feedback_general: c.feedbackGeneral,
        feedback_structure: c.feedbackStructure,
        feedback_grammar: c.feedbackGrammar,
        feedback_argumentation: c.feedbackArgumentation,
        feedback_intervention: c.feedbackIntervention,
        strengths: c.strengths,
        weaknesses: c.weaknesses,
        suggested_rewrite: c.suggestedRewrite,
        ai_model: c.aiModel,
        ai_raw_response: c.raw,
      })
      .eq("id", id);
  } catch (e) {
    console.error("[redacoes] applyCorrection exceção:", e);
  }
}

export async function markFailed(id: string): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("essay_submissions").update({ status: "failed" }).eq("id", id);
  } catch (e) {
    console.error("[redacoes] markFailed exceção:", e);
  }
}

// ---------------- Leitura (RLS own/admin) ----------------
export async function getMySubmissions(): Promise<EssaySubmission[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("essay_submissions")
      .select(COLS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return [];
    return ((data ?? []) as Row[]).map(mapRow);
  } catch {
    return [];
  }
}

export async function getSubmission(id: string): Promise<EssaySubmission | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("essay_submissions")
      .select(COLS)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as Row);
  } catch {
    return null;
  }
}

// ---------------- Dashboard do aluno ----------------
export type EssayDashboard = {
  count: number;
  avgScore: number;
  recent: { id: string; examType: ExamType; scoreTotal: number | null; createdAt: string }[];
  evolution: { score: number }[];
  topWeakness: string | null;
};

export async function getEssayDashboard(): Promise<EssayDashboard> {
  const empty: EssayDashboard = { count: 0, avgScore: 0, recent: [], evolution: [], topWeakness: null };
  const subs = await getMySubmissions();
  const completed = subs.filter((s) => s.status === "completed" && s.scoreTotal != null);
  if (subs.length === 0) return empty;
  const avg = completed.length
    ? Math.round(completed.reduce((a, s) => a + (s.scoreTotal ?? 0), 0) / completed.length)
    : 0;
  const weaknessCount = new Map<string, number>();
  for (const s of completed) for (const w of s.weaknesses) weaknessCount.set(w, (weaknessCount.get(w) ?? 0) + 1);
  const topWeakness =
    Array.from(weaknessCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    count: subs.length,
    avgScore: avg,
    recent: subs.slice(0, 5).map((s) => ({
      id: s.id,
      examType: s.examType,
      scoreTotal: s.scoreTotal,
      createdAt: s.createdAt,
    })),
    evolution: completed
      .slice()
      .reverse()
      .map((s) => ({ score: s.scoreTotal ?? 0 })),
    topWeakness,
  };
}

// ---------------- Admin ----------------
export type AdminEssayItem = {
  id: string;
  email: string | null;
  examType: string;
  status: string;
  scoreTotal: number | null;
  plan: string;
  createdAt: string;
};

export type AdminEssayData = {
  total: number;
  byType: Record<string, number>;
  avgScore: number;
  topSubmitters: { name: string; count: number }[];
  items: AdminEssayItem[];
};

export async function getAdminEssays(filters: {
  examType?: string;
  status?: string;
  plan?: string;
}): Promise<AdminEssayData> {
  const empty: AdminEssayData = { total: 0, byType: {}, avgScore: 0, topSubmitters: [], items: [] };
  try {
    const supabase = await createClient();
    let query = supabase
      .from("essay_submissions")
      .select("id,user_id,exam_type,status,score_total,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (filters.examType) query = query.eq("exam_type", filters.examType);
    if (filters.status) query = query.eq("status", filters.status);
    const { data, error } = await query;
    if (error) {
      console.error("[redacoes] admin lista falhou:", error);
      return empty;
    }
    const rows = (data ?? []) as Array<{
      id: string;
      user_id: string;
      exam_type: string | null;
      status: string | null;
      score_total: number | null;
      created_at: string;
    }>;

    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const profileById = new Map<string, { email: string | null; full_name: string | null; plan: string | null }>();
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,email,full_name,plan")
        .in("id", userIds);
      for (const p of (profs ?? []) as Array<{ id: string; email: string | null; full_name: string | null; plan: string | null }>) {
        profileById.set(p.id, { email: p.email, full_name: p.full_name, plan: p.plan });
      }
    }

    let items: AdminEssayItem[] = rows.map((r) => {
      const prof = profileById.get(r.user_id);
      return {
        id: r.id,
        email: prof?.email ?? null,
        examType: r.exam_type ?? "—",
        status: r.status ?? "—",
        scoreTotal: r.score_total,
        plan: prof?.plan ?? "free",
        createdAt: r.created_at,
      };
    });
    if (filters.plan) items = items.filter((i) => i.plan === filters.plan);

    const byType: Record<string, number> = {};
    const submitterCount = new Map<string, number>();
    let sum = 0;
    let completedCount = 0;
    for (const r of rows) {
      const prof = profileById.get(r.user_id);
      if (filters.plan && (prof?.plan ?? "free") !== filters.plan) continue;
      byType[r.exam_type ?? "—"] = (byType[r.exam_type ?? "—"] ?? 0) + 1;
      if (r.status === "completed" && r.score_total != null) {
        sum += r.score_total;
        completedCount += 1;
      }
      const name = prof?.email ?? prof?.full_name ?? "—";
      submitterCount.set(name, (submitterCount.get(name) ?? 0) + 1);
    }

    return {
      total: items.length,
      byType,
      avgScore: completedCount ? Math.round(sum / completedCount) : 0,
      topSubmitters: Array.from(submitterCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      items,
    };
  } catch (e) {
    console.error("[redacoes] admin exceção:", e);
    return empty;
  }
}
