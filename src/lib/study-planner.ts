import { createClient } from "@/lib/supabase/server";

export type PlannerStatus = "active" | "completed" | "archived";

export type StudyTask = {
  id: string;
  title: string;
  subject: string;
  progress: number;
  status: PlannerStatus;
  completedAt: string | null;
};

export type WeeklyGoal = {
  id: string;
  description: string;
  progress: number;
  status: PlannerStatus;
  completedAt: string | null;
};

export type StudyPlannerData = {
  tasks: StudyTask[];
  goal: WeeklyGoal | null;
};

export type StudyHistoryData = {
  tasks: StudyTask[];
  goals: WeeklyGoal[];
};

type TaskRow = {
  id: string;
  title: string;
  subject: string | null;
  progress: number | null;
  status: string | null;
  completed_at: string | null;
};

type GoalRow = {
  id: string;
  description: string;
  progress: number | null;
  status: string | null;
  completed_at: string | null;
};

const TASK_COLS = "id,title,subject,progress,status,completed_at";
const GOAL_COLS = "id,description,progress,status,completed_at";

function toStatus(value: string | null): PlannerStatus {
  return value === "completed" || value === "archived" ? value : "active";
}

function mapTask(row: TaskRow): StudyTask {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject ?? "",
    progress: row.progress ?? 0,
    status: toStatus(row.status),
    completedAt: row.completed_at,
  };
}

function mapGoal(row: GoalRow): WeeklyGoal {
  return {
    id: row.id,
    description: row.description,
    progress: row.progress ?? 0,
    status: toStatus(row.status),
    completedAt: row.completed_at,
  };
}

export async function getStudyPlanner(): Promise<StudyPlannerData> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { tasks: [], goal: null };

    const [tasksResult, goalResult] = await Promise.all([
      supabase
        .from("study_tasks")
        .select(TASK_COLS)
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: true }),
      supabase
        .from("weekly_goals")
        .select(GOAL_COLS)
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (tasksResult.error) console.error("[study-planner] tarefas:", tasksResult.error);
    if (goalResult.error) console.error("[study-planner] meta:", goalResult.error);

    return {
      tasks: ((tasksResult.data ?? []) as TaskRow[]).map(mapTask),
      goal: goalResult.data ? mapGoal(goalResult.data as GoalRow) : null,
    };
  } catch (plannerError) {
    console.error("[study-planner] exceção:", plannerError);
    return { tasks: [], goal: null };
  }
}

export async function getStudyHistory(): Promise<StudyHistoryData> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { tasks: [], goals: [] };

    const [tasksResult, goalsResult] = await Promise.all([
      supabase
        .from("study_tasks")
        .select(TASK_COLS)
        .eq("user_id", user.id)
        .in("status", ["completed", "archived"])
        .order("completed_at", { ascending: false, nullsFirst: false }),
      supabase
        .from("weekly_goals")
        .select(GOAL_COLS)
        .eq("user_id", user.id)
        .in("status", ["completed", "archived"])
        .order("completed_at", { ascending: false, nullsFirst: false }),
    ]);

    if (tasksResult.error) console.error("[study-history] tarefas:", tasksResult.error);
    if (goalsResult.error) console.error("[study-history] metas:", goalsResult.error);

    return {
      tasks: ((tasksResult.data ?? []) as TaskRow[]).map(mapTask),
      goals: ((goalsResult.data ?? []) as GoalRow[]).map(mapGoal),
    };
  } catch (historyError) {
    console.error("[study-history] exceção:", historyError);
    return { tasks: [], goals: [] };
  }
}
