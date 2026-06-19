import { createClient } from "@/lib/supabase/server";
import { normalizePlan, type Plan } from "@/lib/plan";

export type RankingEntry = {
  position: number;
  profileId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  city: string;
  state: string;
  dreamFaculty: string;
  totalPoints: number;
  approvedMaterials: number;
  materialLikesReceived: number;
  materialSavesReceived: number;
  commentsMade: number;
  postsCreated: number;
  plan: Plan;
};

export type RankingFilters = {
  subject?: string;
  vestibular?: string;
};

type RankingRow = {
  rank_position: number;
  profile_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  dream_faculty: string | null;
  total_points: number | null;
  approved_materials: number | null;
  material_likes_received: number | null;
  material_saves_received: number | null;
  comments_made: number | null;
  posts_created: number | null;
};

function normalizeRanking(row: RankingRow): RankingEntry {
  return {
    position: Number(row.rank_position),
    profileId: row.profile_id,
    username: row.username ?? row.profile_id,
    fullName: row.full_name || "Estudante Acerte",
    avatarUrl: row.avatar_url,
    city: row.city ?? "",
    state: row.state ?? "",
    dreamFaculty: row.dream_faculty ?? "Medicina",
    totalPoints: Number(row.total_points ?? 0),
    approvedMaterials: Number(row.approved_materials ?? 0),
    materialLikesReceived: Number(row.material_likes_received ?? 0),
    materialSavesReceived: Number(row.material_saves_received ?? 0),
    commentsMade: Number(row.comments_made ?? 0),
    postsCreated: Number(row.posts_created ?? 0),
    plan: "free",
  };
}

async function getRanking(
  filters: RankingFilters,
  limitCount = 20,
): Promise<RankingEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_reputation_ranking", {
    filter_subject: filters.subject || null,
    filter_vestibular: filters.vestibular || null,
    limit_count: limitCount,
  });

  if (error) {
    console.error("[ranking] falha no get_reputation_ranking:", error);
    return [];
  }

  const entries = ((data ?? []) as RankingRow[]).map(normalizeRanking);

  // A RPC não retorna o plano; busca-os em lote e enriquece.
  const ids = entries.map((entry) => entry.profileId);
  if (ids.length > 0) {
    const { data: planRows } = await supabase
      .from("profiles")
      .select("id,plan")
      .in("id", ids);
    const planById = new Map(
      ((planRows ?? []) as Array<{ id: string; plan: string | null }>).map(
        (row) => [row.id, normalizePlan(row.plan)],
      ),
    );
    for (const entry of entries) {
      entry.plan = planById.get(entry.profileId) ?? "free";
    }
  }

  return entries;
}

async function getRankingOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("subject,vestibular")
    .eq("status", "approved");

  if (error) {
    console.error("[ranking] falha ao carregar opções:", error);
    return { subjects: [] as string[], vestibulares: [] as string[] };
  }

  const rows = (data ?? []) as Array<{
    subject: string | null;
    vestibular: string | null;
  }>;

  const subjects = Array.from(
    new Set(rows.map((row) => row.subject).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const vestibulares = Array.from(
    new Set(rows.map((row) => row.vestibular).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  return { subjects, vestibulares };
}

export async function getRankingPageData(filters: RankingFilters) {
  const options = await getRankingOptions();
  const activeSubject = filters.subject || options.subjects[0] || "";
  const activeVestibular = filters.vestibular || options.vestibulares[0] || "";

  const [general, subjectRanking, vestibularRanking] = await Promise.all([
    getRanking({}, 20),
    activeSubject ? getRanking({ subject: activeSubject }, 20) : Promise.resolve([]),
    activeVestibular
      ? getRanking({ vestibular: activeVestibular }, 20)
      : Promise.resolve([]),
  ]);

  return {
    general,
    subjectRanking,
    vestibularRanking,
    options,
    activeSubject,
    activeVestibular,
  };
}

export async function getProfileRankingSnapshot(profileId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_profile_reputation", {
      p_profile_id: profileId,
    });

    if (error) {
      console.error("[ranking] falha no get_profile_reputation:", error);
      return { position: null as number | null, totalPoints: 0 };
    }

    const row = (data ?? [])[0] as
      | { total_points: number | null; rank_position: number | null }
      | undefined;

    return {
      position: row?.rank_position != null ? Number(row.rank_position) : null,
      totalPoints: row?.total_points != null ? Number(row.total_points) : 0,
    };
  } catch (snapshotError) {
    console.error("[ranking] erro inesperado no snapshot:", snapshotError);
    return { position: null as number | null, totalPoints: 0 };
  }
}
