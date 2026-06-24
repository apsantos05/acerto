// Acesso a dados do Diagnóstico (server-only). Escrita via service role.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePlan } from "@/lib/plan";
import type { DiagnosticAnswers, DiagnosticResult } from "@/lib/diagnostico";

export type StoredDiagnostic = {
  id: string;
  email: string | null;
  targetUniversity: string;
  targetCourse: string;
  studentPhase: string;
  result: DiagnosticResult;
  createdAt: string;
};

type Row = {
  id: string;
  email: string | null;
  target_university: string | null;
  target_course: string | null;
  student_phase: string | null;
  preparation_score: number | null;
  approval_chance: string | null;
  student_profile: string | null;
  recommended_track_slug: string | null;
  recommended_plan: string | null;
  strong_subjects: string[] | null;
  weak_subjects: string[] | null;
  result: DiagnosticResult | null;
  created_at: string;
};

function mapStored(row: Row): StoredDiagnostic {
  // Prefere o jsonb `result`; cai para os campos escalares se faltar.
  const result: DiagnosticResult =
    row.result && typeof row.result === "object"
      ? row.result
      : {
          preparationScore: row.preparation_score ?? 0,
          approvalChance: row.approval_chance ?? "",
          studentProfile: row.student_profile ?? "",
          strongSubjects: row.strong_subjects ?? [],
          weakSubjects: row.weak_subjects ?? [],
          risks: [],
          recommendedTrackSlug: row.recommended_track_slug,
          recommendedPlan: normalizePlan(row.recommended_plan),
          recommendedPlanReason: "",
          nextActions: [],
        };
  return {
    id: row.id,
    email: row.email,
    targetUniversity: row.target_university ?? "",
    targetCourse: row.target_course ?? "",
    studentPhase: row.student_phase ?? "",
    result,
    createdAt: row.created_at,
  };
}

const STORED_COLS =
  "id,email,target_university,target_course,student_phase,preparation_score,approval_chance,student_profile,recommended_track_slug,recommended_plan,strong_subjects,weak_subjects,result,created_at";

/** Persiste o diagnóstico (service role — o cliente não grava direto). */
export async function saveDiagnostic(
  answers: DiagnosticAnswers,
  result: DiagnosticResult,
  userId: string | null,
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("approval_diagnostics")
      .insert({
        user_id: userId,
        email: answers.email ?? null,
        target_university: answers.targetUniversity,
        target_vestibular: answers.targetUniversity,
        target_course: answers.course,
        study_hours_range: answers.studyHours,
        student_phase: answers.phase,
        mock_exam_average: answers.mockAverage,
        strong_subjects: answers.strongSubjects,
        weak_subjects: answers.weakSubjects,
        mock_exams_per_month: answers.mocksPerMonth,
        main_difficulty: answers.mainDifficulty,
        exam_timeline: answers.timeline,
        preparation_score: result.preparationScore,
        approval_chance: result.approvalChance,
        student_profile: result.studentProfile,
        recommended_track_slug: result.recommendedTrackSlug,
        recommended_plan: result.recommendedPlan,
        result,
      })
      .select("id")
      .single();
    if (error) {
      console.error("[diagnostico] insert falhou:", error);
      return null;
    }
    return data.id as string;
  } catch (saveError) {
    console.error("[diagnostico] exceção ao salvar:", saveError);
    return null;
  }
}

/** Lê um diagnóstico por id (capability URL — id é UUID não-adivinhável). */
export async function getDiagnostico(
  id: string,
): Promise<StoredDiagnostic | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("approval_diagnostics")
      .select(STORED_COLS)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapStored(data as Row);
  } catch {
    return null;
  }
}

// ---------------- Admin ----------------
export type AdminDiagnosticItem = {
  id: string;
  email: string | null;
  targetUniversity: string;
  score: number;
  recommendedPlan: string;
  createdAt: string;
};

export type AdminDiagnosticData = {
  items: AdminDiagnosticItem[];
  total: number;
  avgScore: number;
  leadsThisWeek: number;
  byPlan: Record<string, number>;
  universities: string[];
};

export type DiagnosticFilters = {
  university?: string;
  plan?: string;
  period?: string; // "7d" | "30d" | "" (todos)
};

/** Converte o período em data de corte ISO (ou null para "todos"). */
export function periodCutoffIso(period?: string): string | null {
  if (period === "7d") return new Date(Date.now() - 7 * 86400000).toISOString();
  if (period === "30d") return new Date(Date.now() - 30 * 86400000).toISOString();
  return null;
}

export async function getAdminDiagnostics(
  filters: DiagnosticFilters,
): Promise<AdminDiagnosticData> {
  const empty: AdminDiagnosticData = {
    items: [],
    total: 0,
    avgScore: 0,
    leadsThisWeek: 0,
    byPlan: {},
    universities: [],
  };
  try {
    const supabase = await createClient();
    let query = supabase
      .from("approval_diagnostics")
      .select(
        "id,email,target_university,preparation_score,recommended_plan,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (filters.university) query = query.eq("target_university", filters.university);
    if (filters.plan) query = query.eq("recommended_plan", filters.plan);
    const cutoff = periodCutoffIso(filters.period);
    if (cutoff) query = query.gte("created_at", cutoff);

    const { data, error } = await query;
    if (error) {
      console.error("[diagnostico] admin lista falhou:", error);
      return empty;
    }

    const rows = (data ?? []) as Array<{
      id: string;
      email: string | null;
      target_university: string | null;
      preparation_score: number | null;
      recommended_plan: string | null;
      created_at: string;
    }>;

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const byPlan: Record<string, number> = {};
    const universities = new Set<string>();
    let sum = 0;
    let leadsThisWeek = 0;

    const items: AdminDiagnosticItem[] = rows.map((r) => {
      const plan = r.recommended_plan ?? "—";
      byPlan[plan] = (byPlan[plan] ?? 0) + 1;
      if (r.target_university) universities.add(r.target_university);
      sum += r.preparation_score ?? 0;
      if (new Date(r.created_at).getTime() >= weekAgo) leadsThisWeek += 1;
      return {
        id: r.id,
        email: r.email,
        targetUniversity: r.target_university ?? "—",
        score: r.preparation_score ?? 0,
        recommendedPlan: plan,
        createdAt: r.created_at,
      };
    });

    return {
      items,
      total: items.length,
      avgScore: items.length ? Math.round(sum / items.length) : 0,
      leadsThisWeek,
      byPlan,
      universities: Array.from(universities).sort((a, b) => a.localeCompare(b, "pt-BR")),
    };
  } catch (adminError) {
    console.error("[diagnostico] admin exceção:", adminError);
    return empty;
  }
}

// ---------------- Exportação CSV ----------------
export type DiagnosticExportRow = {
  createdAt: string;
  email: string | null;
  userId: string | null;
  targetUniversity: string | null;
  targetVestibular: string | null;
  targetCourse: string | null;
  studyHours: string | null;
  studentPhase: string | null;
  mockAverage: string | null;
  strongSubjects: string[];
  weakSubjects: string[];
  mocksPerMonth: string | null;
  mainDifficulty: string | null;
  examTimeline: string | null;
  preparationScore: number | null;
  approvalChance: string | null;
  studentProfile: string | null;
  recommendedTrackSlug: string | null;
  recommendedPlan: string | null;
};

const EXPORT_COLS =
  "created_at,email,user_id,target_university,target_vestibular,target_course,study_hours_range,student_phase,mock_exam_average,strong_subjects,weak_subjects,mock_exams_per_month,main_difficulty,exam_timeline,preparation_score,approval_chance,student_profile,recommended_track_slug,recommended_plan";

/** Lê os diagnósticos para exportação (RLS admin). Aplica os mesmos filtros. */
export async function getDiagnosticsForExport(
  filters: DiagnosticFilters,
): Promise<DiagnosticExportRow[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("approval_diagnostics")
      .select(EXPORT_COLS)
      .order("created_at", { ascending: false })
      .limit(10000);
    if (filters.university) query = query.eq("target_university", filters.university);
    if (filters.plan) query = query.eq("recommended_plan", filters.plan);
    const cutoff = periodCutoffIso(filters.period);
    if (cutoff) query = query.gte("created_at", cutoff);

    const { data, error } = await query;
    if (error) {
      console.error("[diagnostico] export falhou:", error);
      return [];
    }
    return (
      (data ?? []) as Array<{
        created_at: string;
        email: string | null;
        user_id: string | null;
        target_university: string | null;
        target_vestibular: string | null;
        target_course: string | null;
        study_hours_range: string | null;
        student_phase: string | null;
        mock_exam_average: string | null;
        strong_subjects: string[] | null;
        weak_subjects: string[] | null;
        mock_exams_per_month: string | null;
        main_difficulty: string | null;
        exam_timeline: string | null;
        preparation_score: number | null;
        approval_chance: string | null;
        student_profile: string | null;
        recommended_track_slug: string | null;
        recommended_plan: string | null;
      }>
    ).map((r) => ({
      createdAt: r.created_at,
      email: r.email,
      userId: r.user_id,
      targetUniversity: r.target_university,
      targetVestibular: r.target_vestibular,
      targetCourse: r.target_course,
      studyHours: r.study_hours_range,
      studentPhase: r.student_phase,
      mockAverage: r.mock_exam_average,
      strongSubjects: r.strong_subjects ?? [],
      weakSubjects: r.weak_subjects ?? [],
      mocksPerMonth: r.mock_exams_per_month,
      mainDifficulty: r.main_difficulty,
      examTimeline: r.exam_timeline,
      preparationScore: r.preparation_score,
      approvalChance: r.approval_chance,
      studentProfile: r.student_profile,
      recommendedTrackSlug: r.recommended_track_slug,
      recommendedPlan: r.recommended_plan,
    }));
  } catch (exportError) {
    console.error("[diagnostico] export exceção:", exportError);
    return [];
  }
}
