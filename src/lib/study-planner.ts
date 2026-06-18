import { createClient } from "@/lib/supabase/server";

export type StudyTask = {
  id: string;
  title: string;
  subject: string;
  progress: number;
  status: "pending" | "done";
};

export type WeeklyGoal = {
  id: string;
  description: string;
  progress: number;
  status: "active" | "done";
};

export type StudyPlannerData = {
  tasks: StudyTask[];
  goal: WeeklyGoal | null;
};

export async function getStudyPlanner(): Promise<StudyPlannerData> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { tasks: [], goal: null };
    }

    const [tasksResult, goalResult] = await Promise.all([
      supabase
        .from("study_tasks")
        .select("id,title,subject,progress,status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("weekly_goals")
        .select("id,description,progress,status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (tasksResult.error) {
      console.error("[study-planner] tarefas falharam:", tasksResult.error);
    }
    if (goalResult.error) {
      console.error("[study-planner] meta falhou:", goalResult.error);
    }

    const tasks = ((tasksResult.data ?? []) as Array<{
      id: string;
      title: string;
      subject: string | null;
      progress: number | null;
      status: string | null;
    }>).map((row) => ({
      id: row.id,
      title: row.title,
      subject: row.subject ?? "",
      progress: row.progress ?? 0,
      status: row.status === "done" ? ("done" as const) : ("pending" as const),
    }));

    const goalRow = goalResult.data as
      | { id: string; description: string; progress: number | null; status: string | null }
      | null;
    const goal: WeeklyGoal | null = goalRow
      ? {
          id: goalRow.id,
          description: goalRow.description,
          progress: goalRow.progress ?? 0,
          status: goalRow.status === "done" ? "done" : "active",
        }
      : null;

    return { tasks, goal };
  } catch (plannerError) {
    console.error("[study-planner] exceção inesperada:", plannerError);
    return { tasks: [], goal: null };
  }
}
