import { createClient } from "@/lib/supabase/server";
import { getProfileRankingSnapshot } from "@/lib/ranking";
import { normalizePlan, type Plan } from "@/lib/plan";
import { cleanMaterialTitle } from "@/lib/title";
import {
  buildAchievements,
  type AchievementCategory,
  type AchievementStats,
} from "@/lib/achievements";

export type StudentProfile = {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string;
  objective: string;
  dreamFaculty: string;
  targetExams: string[];
  city: string;
  state: string;
  points: number;
  streakDays: number;
  badges: string[];
  plan: Plan;
};

export type ProfileMaterial = {
  id: string;
  title: string;
  subject: string;
  materialType: string;
  viewsCount: number;
  createdAt: string;
};

export type ProfilePost = {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
};

export type ProfileStats = {
  materialsPublished: number;
  postsCreated: number;
  commentsMade: number;
  simuladosCompleted: number;
  likesReceived: number;
  reputationPoints: number;
  streakDays: number;
  rankingPosition: number | null;
};

export type ActivityType = "material" | "post" | "comment" | "simulado" | "task";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  date: string;
  href: string | null;
};

export type EarnedBadge = {
  code: string;
  earnedAt: string;
};

export type PublicProfileData = {
  profile: StudentProfile;
  materials: ProfileMaterial[];
  posts: ProfilePost[];
  isCurrentUser: boolean;
  stats: ProfileStats;
  achievements: AchievementCategory[];
  earnedBadges: EarnedBadge[];
  activity: ActivityItem[];
};

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  objective: string | null;
  dream_faculty: string | null;
  target_exams: string[] | null;
  city: string | null;
  state: string | null;
  points: number | null;
  streak_days: number | null;
  study_streak: number | null;
  badges: string[] | null;
  plan: string | null;
};

type MaterialRow = {
  id: string;
  title: string;
  subject: string | null;
  material_type: string | null;
  views_count: number | null;
  created_at: string;
};

type PostRow = {
  id: string;
  content: string;
  tags: string[] | null;
  created_at: string;
};

const PROFILE_COLS =
  "id,username,full_name,email,avatar_url,cover_url,bio,objective,dream_faculty,target_exams,city,state,points,streak_days,study_streak,badges,plan";

function normalizeProfile(row: ProfileRow): StudentProfile {
  return {
    id: row.id,
    username: row.username ?? row.id,
    fullName: row.full_name || "Estudante AcertaVest",
    email: row.email,
    avatarUrl: row.avatar_url,
    coverUrl: row.cover_url,
    bio:
      row.bio ??
      "Vestibulando de Medicina organizando estudos, materiais e evolução no AcertaVest.",
    objective: row.objective ?? "Medicina",
    dreamFaculty: row.dream_faculty ?? "Medicina",
    targetExams: row.target_exams ?? [],
    city: row.city ?? "",
    state: row.state ?? "",
    points: row.points ?? 0,
    streakDays: row.study_streak ?? row.streak_days ?? 0,
    badges: row.badges ?? [],
    plan: normalizePlan(row.plan),
  };
}

function normalizeMaterial(row: MaterialRow): ProfileMaterial {
  return {
    id: row.id,
    title: cleanMaterialTitle(row.title),
    subject: row.subject ?? "Interdisciplinar",
    materialType: row.material_type ?? "Material",
    viewsCount: row.views_count ?? 0,
    createdAt: row.created_at,
  };
}

function normalizePost(row: PostRow): ProfilePost {
  return {
    id: row.id,
    content: row.content,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

function truncate(value: string, max = 90): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Histórico completo de atividade do perfil. Tarefas e simulados ficam
// visíveis apenas para o próprio usuário (RLS own-only); para outros perfis
// essas consultas voltam vazias, sem vazar dados privados.
async function getProfileActivity(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ActivityItem[]> {
  const [materials, posts, comments, simulados, tasks] = await Promise.all([
    supabase
      .from("materials")
      .select("id,title,created_at")
      .eq("owner_id", profileId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("posts")
      .select("id,content,created_at")
      .eq("author_id", profileId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("comments")
      .select("id,content,created_at")
      .eq("author_id", profileId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("simulado_attempts")
      .select("id,score,total_questions,finished_at,simulado:simulados(title)")
      .eq("user_id", profileId)
      .eq("status", "completed")
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(40),
    supabase
      .from("study_tasks")
      .select("id,title,completed_at")
      .eq("user_id", profileId)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(40),
  ]);

  const items: ActivityItem[] = [];

  for (const row of (materials.data ?? []) as Array<{
    id: string;
    title: string;
    created_at: string;
  }>) {
    items.push({
      id: `material-${row.id}`,
      type: "material",
      title: cleanMaterialTitle(row.title),
      detail: "Publicou um material",
      date: row.created_at,
      href: `/biblioteca/${row.id}`,
    });
  }

  for (const row of (posts.data ?? []) as Array<{
    id: string;
    content: string;
    created_at: string;
  }>) {
    items.push({
      id: `post-${row.id}`,
      type: "post",
      title: truncate(row.content),
      detail: "Publicou no feed",
      date: row.created_at,
      href: "/feed",
    });
  }

  for (const row of (comments.data ?? []) as Array<{
    id: string;
    content: string;
    created_at: string;
  }>) {
    items.push({
      id: `comment-${row.id}`,
      type: "comment",
      title: truncate(row.content),
      detail: "Comentou em uma publicação",
      date: row.created_at,
      href: "/feed",
    });
  }

  for (const row of (simulados.data ?? []) as Array<{
    id: string;
    score: number | null;
    total_questions: number | null;
    finished_at: string;
    simulado: { title: string } | { title: string }[] | null;
  }>) {
    const sim = Array.isArray(row.simulado) ? row.simulado[0] : row.simulado;
    items.push({
      id: `simulado-${row.id}`,
      type: "simulado",
      title: sim?.title ?? "Simulado",
      detail: `Concluiu um simulado · ${row.score ?? 0}/${row.total_questions ?? 0} acertos`,
      date: row.finished_at,
      href: "/simulados",
    });
  }

  for (const row of (tasks.data ?? []) as Array<{
    id: string;
    title: string;
    completed_at: string;
  }>) {
    items.push({
      id: `task-${row.id}`,
      type: "task",
      title: row.title,
      detail: "Concluiu uma tarefa de estudo",
      date: row.completed_at,
      href: "/dashboard",
    });
  }

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);
}

async function getEarnedBadges(
  supabase: SupabaseClient,
  profileId: string,
): Promise<EarnedBadge[]> {
  try {
    // Concede automaticamente os badges devidos e retorna a lista completa.
    const { data, error } = await supabase.rpc("sync_user_badges", {
      p_profile_id: profileId,
    });

    if (error) {
      console.error("[perfil] falha no sync_user_badges:", error);
      // Fallback: lê os badges já concedidos sem tentar conceder novos.
      const { data: existing } = await supabase
        .from("user_badges")
        .select("badge_code,earned_at")
        .eq("profile_id", profileId);
      return ((existing ?? []) as Array<{ badge_code: string; earned_at: string }>).map(
        (row) => ({ code: row.badge_code, earnedAt: row.earned_at }),
      );
    }

    return ((data ?? []) as Array<{ badge_code: string; earned_at: string }>).map(
      (row) => ({ code: row.badge_code, earnedAt: row.earned_at }),
    );
  } catch (badgeError) {
    console.error("[perfil] exceção em getEarnedBadges:", badgeError);
    return [];
  }
}

export async function getPublicProfile(username: string) {
  try {
    const supabase = await createClient();
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(PROFILE_COLS)
      .eq("username", username)
      .maybeSingle();

    if (profileError || !profileData) {
      return null;
    }

    const profile = normalizeProfile(profileData as ProfileRow);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [
      materialsResult,
      postsResult,
      materialsCountResult,
      postsCountResult,
      commentsCountResult,
      simuladosCountResult,
    ] = await Promise.all([
      supabase
        .from("materials")
        .select("id,title,subject,material_type,views_count,created_at")
        .eq("owner_id", profile.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("posts")
        .select("id,content,tags,created_at")
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("materials")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", profile.id)
        .eq("status", "approved"),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", profile.id),
      supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("author_id", profile.id),
      supabase
        .from("simulado_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("status", "completed"),
    ]);

    const materials = ((materialsResult.data ?? []) as MaterialRow[]).map(
      normalizeMaterial,
    );
    const posts = ((postsResult.data ?? []) as PostRow[]).map(normalizePost);

    const [{ data: allMaterialIds }, { data: allPostIds }] = await Promise.all([
      supabase
        .from("materials")
        .select("id")
        .eq("owner_id", profile.id)
        .eq("status", "approved"),
      supabase.from("posts").select("id").eq("author_id", profile.id),
    ]);
    const materialIds = ((allMaterialIds ?? []) as Array<{ id: string }>).map(
      (material) => material.id,
    );
    const postIds = ((allPostIds ?? []) as Array<{ id: string }>).map(
      (post) => post.id,
    );
    let likesReceived = 0;

    if (postIds.length > 0) {
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("target_type", "post")
        .in("target_id", postIds);

      likesReceived += count ?? 0;
    }

    if (materialIds.length > 0) {
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("target_type", "material")
        .in("target_id", materialIds);

      likesReceived += count ?? 0;
    }

    const [rankingSnapshot, earnedBadges, activity] = await Promise.all([
      getProfileRankingSnapshot(profile.id),
      getEarnedBadges(supabase, profile.id),
      getProfileActivity(supabase, profile.id),
    ]);

    const stats: ProfileStats = {
      materialsPublished: materialsCountResult.count ?? materials.length,
      postsCreated: postsCountResult.count ?? posts.length,
      commentsMade: commentsCountResult.count ?? 0,
      simuladosCompleted: simuladosCountResult.count ?? 0,
      likesReceived,
      reputationPoints: rankingSnapshot.totalPoints,
      streakDays: profile.streakDays,
      rankingPosition: rankingSnapshot.position,
    };

    const achievementStats: AchievementStats = {
      materials: stats.materialsPublished,
      posts: stats.postsCreated,
      comments: stats.commentsMade,
      likes: stats.likesReceived,
      simulados: stats.simuladosCompleted,
      reputation: stats.reputationPoints,
      rank: stats.rankingPosition,
      streak: stats.streakDays,
    };

    const earnedCodes = new Set(earnedBadges.map((badge) => badge.code));
    const achievements = buildAchievements(achievementStats, earnedCodes);

    // Mantém o array legado de badges em sincronia com os códigos conquistados.
    profile.badges = earnedBadges.map((badge) => badge.code);

    return {
      profile,
      materials,
      posts,
      isCurrentUser: user?.id === profile.id,
      stats,
      achievements,
      earnedBadges,
      activity,
    } satisfies PublicProfileData;
  } catch {
    return null;
  }
}

export async function getCurrentProfile() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLS)
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return normalizeProfile(data as ProfileRow);
  } catch {
    return null;
  }
}
