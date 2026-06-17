import { createClient } from "@/lib/supabase/server";

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
  isMock?: boolean;
};

export type RankingFilters = {
  subject?: string;
  vestibular?: string;
};

type RankingRow = {
  position: number;
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

const mockRanking: RankingEntry[] = [
  {
    position: 1,
    profileId: "mock-marina",
    username: "marina-lopes",
    fullName: "Marina Lopes",
    avatarUrl: null,
    city: "São Paulo",
    state: "SP",
    dreamFaculty: "USP",
    totalPoints: 8420,
    approvedMaterials: 126,
    materialLikesReceived: 310,
    materialSavesReceived: 244,
    commentsMade: 188,
    postsCreated: 92,
    isMock: true,
  },
  {
    position: 2,
    profileId: "mock-joao",
    username: "joao-martins",
    fullName: "João Martins",
    avatarUrl: null,
    city: "Belo Horizonte",
    state: "MG",
    dreamFaculty: "UFMG",
    totalPoints: 7970,
    approvedMaterials: 111,
    materialLikesReceived: 288,
    materialSavesReceived: 210,
    commentsMade: 160,
    postsCreated: 86,
    isMock: true,
  },
  {
    position: 3,
    profileId: "mock-clara",
    username: "clara-nunes",
    fullName: "Clara Nunes",
    avatarUrl: null,
    city: "Curitiba",
    state: "PR",
    dreamFaculty: "UFPR",
    totalPoints: 7510,
    approvedMaterials: 98,
    materialLikesReceived: 270,
    materialSavesReceived: 190,
    commentsMade: 174,
    postsCreated: 81,
    isMock: true,
  },
  {
    position: 4,
    profileId: "mock-rafael",
    username: "rafael-kim",
    fullName: "Rafael Kim",
    avatarUrl: null,
    city: "Campinas",
    state: "SP",
    dreamFaculty: "Unicamp",
    totalPoints: 7190,
    approvedMaterials: 91,
    materialLikesReceived: 260,
    materialSavesReceived: 184,
    commentsMade: 145,
    postsCreated: 76,
    isMock: true,
  },
];

const fallbackSubjects = ["Biologia", "Química", "Redação"];
const fallbackVestibulares = ["Fuvest", "ENEM", "Unicamp"];

function normalizeRanking(row: RankingRow): RankingEntry {
  return {
    position: Number(row.position),
    profileId: row.profile_id,
    username: row.username ?? row.profile_id,
    fullName: row.full_name || "Estudante Acerte",
    avatarUrl: row.avatar_url,
    city: row.city ?? "",
    state: row.state ?? "",
    dreamFaculty: row.dream_faculty ?? "Medicina",
    totalPoints: row.total_points ?? 0,
    approvedMaterials: row.approved_materials ?? 0,
    materialLikesReceived: row.material_likes_received ?? 0,
    materialSavesReceived: row.material_saves_received ?? 0,
    commentsMade: row.comments_made ?? 0,
    postsCreated: row.posts_created ?? 0,
  };
}

function normalizeMock(entries: RankingEntry[]) {
  return entries.map((entry, index) => ({
    ...entry,
    position: index + 1,
  }));
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
    throw error;
  }

  return ((data ?? []) as RankingRow[]).map(normalizeRanking);
}

async function getRankingOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("subject,vestibular")
    .eq("status", "approved");

  if (error) {
    throw error;
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

  return {
    subjects,
    vestibulares,
  };
}

export async function getRankingPageData(filters: RankingFilters) {
  try {
    const options = await getRankingOptions();
    const activeSubject = filters.subject || options.subjects[0] || "";
    const activeVestibular =
      filters.vestibular || options.vestibulares[0] || "";
    const [general, subjectRanking, vestibularRanking] = await Promise.all([
      getRanking({}, 20),
      activeSubject ? getRanking({ subject: activeSubject }, 20) : [],
      activeVestibular ? getRanking({ vestibular: activeVestibular }, 20) : [],
    ]);

    return {
      general,
      subjectRanking,
      vestibularRanking,
      options,
      activeSubject,
      activeVestibular,
      isMock: false,
    };
  } catch {
    const activeSubject = filters.subject || fallbackSubjects[0];
    const activeVestibular = filters.vestibular || fallbackVestibulares[0];

    return {
      general: normalizeMock(mockRanking),
      subjectRanking: normalizeMock(mockRanking.slice(0, 3)),
      vestibularRanking: normalizeMock(mockRanking.slice(1)),
      options: {
        subjects: fallbackSubjects,
        vestibulares: fallbackVestibulares,
      },
      activeSubject,
      activeVestibular,
      isMock: true,
    };
  }
}

export async function getProfileRankingPosition(profileId: string) {
  try {
    const ranking = await getRanking({}, 10000);
    return ranking.find((entry) => entry.profileId === profileId)?.position ?? null;
  } catch {
    return null;
  }
}

export async function getProfileRankingSnapshot(profileId: string) {
  try {
    const ranking = await getRanking({}, 10000);
    const entry = ranking.find((item) => item.profileId === profileId);

    if (!entry) {
      return {
        position: null,
        totalPoints: 0,
      };
    }

    return {
      position: entry.position,
      totalPoints: entry.totalPoints,
    };
  } catch {
    return {
      position: null,
      totalPoints: 0,
    };
  }
}
