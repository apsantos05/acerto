// =====================================================================
// Trilhas de estudo (study_tracks). Espelha supabase/study_tracks.sql.
// Leitura pública; progresso é por usuário (RLS own-only).
// =====================================================================

import { createClient } from "@/lib/supabase/server";
import { normalizePlan, type Plan } from "@/lib/plan";
import { cleanMaterialTitle } from "@/lib/title";

export type StudyTrack = {
  id: string;
  slug: string;
  title: string;
  university: string;
  vestibular: string;
  description: string;
  difficulty: string;
  targetCourse: string;
  prioritySubjects: string[];
  isPremium: boolean;
  planRequired: Plan;
  status: "active" | "inactive";
};

export type TrackTask = {
  id: string;
  subject: string;
  title: string;
  description: string;
  materialId: string | null;
  simuladoId: string | null;
  estimatedMinutes: number;
  orderIndex: number;
  completed: boolean;
};

export type TrackWeek = {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  tasks: TrackTask[];
};

export type TrackRecommendation = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type TrackDetail = {
  track: StudyTrack;
  weeks: TrackWeek[];
  totalTasks: number;
  completedTasks: number;
  recommendedMaterials: TrackRecommendation[];
  recommendedSimulados: TrackRecommendation[];
};

type TrackRow = {
  id: string;
  slug: string;
  title: string;
  university: string | null;
  vestibular: string | null;
  description: string | null;
  difficulty: string | null;
  target_course: string | null;
  priority_subjects: string[] | null;
  is_premium: boolean | null;
  plan_required: string | null;
  status: string | null;
};

const TRACK_COLS =
  "id,slug,title,university,vestibular,description,difficulty,target_course,priority_subjects,is_premium,plan_required,status";

function mapTrack(row: TrackRow): StudyTrack {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    university: row.university ?? "",
    vestibular: row.vestibular ?? "",
    description: row.description ?? "",
    difficulty: row.difficulty ?? "médio",
    targetCourse: row.target_course ?? "Medicina",
    prioritySubjects: row.priority_subjects ?? [],
    isPremium: row.is_premium ?? true,
    planRequired: normalizePlan(row.plan_required),
    status: row.status === "inactive" ? "inactive" : "active",
  };
}

/** Lista de trilhas. Por padrão só as ativas (público); admin pede todas. */
export async function getTracks(includeInactive = false): Promise<StudyTrack[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from("study_tracks").select(TRACK_COLS);
    if (!includeInactive) query = query.eq("status", "active");
    const { data, error } = await query.order("created_at", { ascending: true });
    if (error) {
      console.error("[trilhas] lista falhou:", error);
      return [];
    }
    return ((data ?? []) as TrackRow[]).map(mapTrack);
  } catch (listError) {
    console.error("[trilhas] exceção:", listError);
    return [];
  }
}

export async function getTrackBySlug(slug: string): Promise<StudyTrack | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("study_tracks")
      .select(TRACK_COLS)
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (error || !data) return null;
    return mapTrack(data as TrackRow);
  } catch {
    return null;
  }
}

async function getRecommendedMaterials(
  supabase: Awaited<ReturnType<typeof createClient>>,
  track: StudyTrack,
): Promise<TrackRecommendation[]> {
  try {
    const { data } = await supabase
      .from("materials")
      .select("id,title,material_type,subject")
      .eq("status", "approved")
      .eq("faculdade", track.university)
      .order("created_at", { ascending: false })
      .limit(6);
    return ((data ?? []) as Array<{
      id: string;
      title: string;
      material_type: string | null;
      subject: string | null;
    }>).map((row) => ({
      id: row.id,
      title: cleanMaterialTitle(row.title),
      subtitle: [row.material_type, row.subject].filter(Boolean).join(" · "),
      href: `/biblioteca/${row.id}`,
    }));
  } catch {
    return [];
  }
}

async function getRecommendedSimulados(
  supabase: Awaited<ReturnType<typeof createClient>>,
  track: StudyTrack,
): Promise<TrackRecommendation[]> {
  try {
    const { data } = await supabase
      .from("simulados")
      .select("id,title,vestibular,faculty")
      .eq("status", "published")
      .or(`vestibular.eq.${track.vestibular},faculty.ilike.%${track.university}%`)
      .limit(4);
    return ((data ?? []) as Array<{
      id: string;
      title: string;
      vestibular: string | null;
      faculty: string | null;
    }>).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.vestibular ?? row.faculty ?? "Simulado",
      href: `/simulados/${row.id}`,
    }));
  } catch {
    return [];
  }
}

/** Detalhe completo da trilha: semanas, tarefas, progresso e recomendações. */
export async function getTrackDetail(
  slug: string,
): Promise<TrackDetail | null> {
  try {
    const supabase = await createClient();
    const track = await getTrackBySlug(slug);
    if (!track) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [weeksRes, materials, simulados, progressRes] = await Promise.all([
      supabase
        .from("study_track_weeks")
        .select(
          "id,week_number,title,description,study_track_tasks(id,subject,title,description,material_id,simulado_id,estimated_minutes,order_index)",
        )
        .eq("track_id", track.id)
        .order("week_number", { ascending: true }),
      getRecommendedMaterials(supabase, track),
      getRecommendedSimulados(supabase, track),
      user
        ? supabase
            .from("user_track_progress")
            .select("task_id")
            .eq("user_id", user.id)
            .eq("track_id", track.id)
        : Promise.resolve({ data: [] as Array<{ task_id: string }> }),
    ]);

    const completedIds = new Set(
      ((progressRes.data ?? []) as Array<{ task_id: string }>).map(
        (row) => row.task_id,
      ),
    );

    type WeekRow = {
      id: string;
      week_number: number;
      title: string | null;
      description: string | null;
      study_track_tasks: Array<{
        id: string;
        subject: string | null;
        title: string | null;
        description: string | null;
        material_id: string | null;
        simulado_id: string | null;
        estimated_minutes: number | null;
        order_index: number | null;
      }> | null;
    };

    let totalTasks = 0;
    let completedTasks = 0;

    const weeks: TrackWeek[] = ((weeksRes.data ?? []) as WeekRow[]).map(
      (week) => {
        const tasks = (week.study_track_tasks ?? [])
          .slice()
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map((task) => {
            const completed = completedIds.has(task.id);
            totalTasks += 1;
            if (completed) completedTasks += 1;
            return {
              id: task.id,
              subject: task.subject ?? "",
              title: task.title ?? "",
              description: task.description ?? "",
              materialId: task.material_id,
              simuladoId: task.simulado_id,
              estimatedMinutes: task.estimated_minutes ?? 60,
              orderIndex: task.order_index ?? 0,
              completed,
            } satisfies TrackTask;
          });
        return {
          id: week.id,
          weekNumber: week.week_number,
          title: week.title ?? `Semana ${week.week_number}`,
          description: week.description ?? "",
          tasks,
        } satisfies TrackWeek;
      },
    );

    return {
      track,
      weeks,
      totalTasks,
      completedTasks,
      recommendedMaterials: materials,
      recommendedSimulados: simulados,
    } satisfies TrackDetail;
  } catch (detailError) {
    console.error("[trilhas] detalhe exceção:", detailError);
    return null;
  }
}
