import { createClient } from "@/lib/supabase/server";
import { getProfileRankingSnapshot } from "@/lib/ranking";

export type StudentProfile = {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  bio: string;
  objective: string;
  dreamFaculty: string;
  targetExams: string[];
  city: string;
  state: string;
  points: number;
  streakDays: number;
  badges: string[];
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

export type PublicProfileData = {
  profile: StudentProfile;
  materials: ProfileMaterial[];
  posts: ProfilePost[];
  isCurrentUser: boolean;
  stats: {
    materialsPublished: number;
    postsCreated: number;
    reputationPoints: number;
    likesReceived: number;
    streakDays: number;
    rankingPosition: number | null;
  };
};

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  objective: string | null;
  dream_faculty: string | null;
  target_exams: string[] | null;
  city: string | null;
  state: string | null;
  points: number | null;
  streak_days: number | null;
  badges: string[] | null;
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

function computeBadges(stats: {
  materialsPublished: number;
  postsCreated: number;
  reputationPoints: number;
  rankingPosition: number | null;
}): string[] {
  const badges: string[] = [];

  if (stats.materialsPublished > 0) {
    badges.push("Primeiro material");
  }
  if (stats.postsCreated > 0) {
    badges.push("Primeiro post");
  }
  if (stats.reputationPoints >= 100) {
    badges.push("100 pontos");
  }
  if (stats.rankingPosition != null && stats.rankingPosition <= 3) {
    badges.push("Top 3");
  } else if (stats.rankingPosition != null && stats.rankingPosition <= 10) {
    badges.push("Top 10");
  }

  return badges;
}

function normalizeProfile(row: ProfileRow): StudentProfile {
  return {
    id: row.id,
    username: row.username ?? row.id,
    fullName: row.full_name || "Estudante Acerte",
    email: row.email,
    avatarUrl: row.avatar_url,
    bio:
      row.bio ??
      "Vestibulando de Medicina organizando estudos, materiais e evolução no Acerte.",
    objective: row.objective ?? "Medicina",
    dreamFaculty: row.dream_faculty ?? "Medicina",
    targetExams: row.target_exams ?? [],
    city: row.city ?? "",
    state: row.state ?? "",
    points: row.points ?? 0,
    streakDays: row.streak_days ?? 0,
    badges: row.badges ?? [],
  };
}

function normalizeMaterial(row: MaterialRow): ProfileMaterial {
  return {
    id: row.id,
    title: row.title,
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

export async function getPublicProfile(username: string) {
  try {
    const supabase = await createClient();
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id,username,full_name,email,avatar_url,bio,objective,dream_faculty,target_exams,city,state,points,streak_days,badges",
      )
      .eq("username", username)
      .maybeSingle();

    if (profileError || !profileData) {
      return null;
    }

    const profile = normalizeProfile(profileData as ProfileRow);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [materialsResult, postsResult, materialsCountResult, postsCountResult] =
      await Promise.all([
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
      supabase
        .from("posts")
        .select("id")
        .eq("author_id", profile.id),
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

    const rankingSnapshot = await getProfileRankingSnapshot(profile.id);

    const stats = {
      materialsPublished: materialsCountResult.count ?? materials.length,
      postsCreated: postsCountResult.count ?? posts.length,
      reputationPoints: rankingSnapshot.totalPoints,
      likesReceived,
      streakDays: profile.streakDays,
      rankingPosition: rankingSnapshot.position,
    };

    // Badges detectados automaticamente a partir dos dados reais.
    profile.badges = computeBadges(stats);

    return {
      profile,
      materials,
      posts,
      isCurrentUser: user?.id === profile.id,
      stats,
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
      .select(
        "id,username,full_name,email,avatar_url,bio,objective,dream_faculty,target_exams,city,state,points,streak_days,badges",
      )
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
