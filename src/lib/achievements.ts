// Catálogo de conquistas/badges do AcertaVest.
// Os códigos e limites espelham public.sync_user_badges em
// supabase/profile_revamp.sql — mantenha os dois lados em sincronia.

export type AchievementMetric =
  | "materials"
  | "posts"
  | "comments"
  | "likes"
  | "simulados"
  | "reputation"
  | "rank"
  | "streak";

export type AchievementKind = "count" | "rank";

export type AchievementDef = {
  code: string;
  category: string;
  title: string;
  description: string;
  target: number;
  metric: AchievementMetric;
  kind: AchievementKind;
};

export type AchievementStats = {
  materials: number;
  posts: number;
  comments: number;
  likes: number;
  simulados: number;
  reputation: number;
  rank: number | null;
  streak: number;
};

export type AchievementProgress = AchievementDef & {
  current: number;
  earned: boolean;
  progress: number; // 0–100
};

export type AchievementCategory = {
  name: string;
  items: AchievementProgress[];
  earnedCount: number;
  total: number;
};

// Ordem de exibição das categorias.
export const ACHIEVEMENT_CATEGORIES = [
  "Materiais",
  "Comunidade",
  "Simulados",
  "Reputação",
  "Consistência",
] as const;

export const ACHIEVEMENTS: AchievementDef[] = [
  // Materiais
  {
    code: "material_1",
    category: "Materiais",
    title: "Primeiro material",
    description: "Publique 1 material aprovado",
    target: 1,
    metric: "materials",
    kind: "count",
  },
  {
    code: "material_5",
    category: "Materiais",
    title: "Colaborador",
    description: "Publique 5 materiais aprovados",
    target: 5,
    metric: "materials",
    kind: "count",
  },
  {
    code: "material_20",
    category: "Materiais",
    title: "Acervo de respeito",
    description: "Publique 20 materiais aprovados",
    target: 20,
    metric: "materials",
    kind: "count",
  },
  // Comunidade
  {
    code: "post_1",
    category: "Comunidade",
    title: "Primeiro post",
    description: "Publique 1 post no feed",
    target: 1,
    metric: "posts",
    kind: "count",
  },
  {
    code: "post_10",
    category: "Comunidade",
    title: "Voz ativa",
    description: "Publique 10 posts no feed",
    target: 10,
    metric: "posts",
    kind: "count",
  },
  {
    code: "comment_10",
    category: "Comunidade",
    title: "Sempre presente",
    description: "Faça 10 comentários",
    target: 10,
    metric: "comments",
    kind: "count",
  },
  {
    code: "likes_50",
    category: "Comunidade",
    title: "Querido pela turma",
    description: "Receba 50 curtidas",
    target: 50,
    metric: "likes",
    kind: "count",
  },
  // Simulados
  {
    code: "simulado_1",
    category: "Simulados",
    title: "Primeiro simulado",
    description: "Conclua 1 simulado",
    target: 1,
    metric: "simulados",
    kind: "count",
  },
  {
    code: "simulado_10",
    category: "Simulados",
    title: "Maratonista",
    description: "Conclua 10 simulados",
    target: 10,
    metric: "simulados",
    kind: "count",
  },
  // Reputação
  {
    code: "rep_100",
    category: "Reputação",
    title: "100 pontos",
    description: "Alcance 100 pontos de reputação",
    target: 100,
    metric: "reputation",
    kind: "count",
  },
  {
    code: "rep_500",
    category: "Reputação",
    title: "500 pontos",
    description: "Alcance 500 pontos de reputação",
    target: 500,
    metric: "reputation",
    kind: "count",
  },
  {
    code: "top_10",
    category: "Reputação",
    title: "Top 10",
    description: "Entre no top 10 do ranking geral",
    target: 10,
    metric: "rank",
    kind: "rank",
  },
  {
    code: "top_3",
    category: "Reputação",
    title: "Top 3",
    description: "Entre no top 3 do ranking geral",
    target: 3,
    metric: "rank",
    kind: "rank",
  },
  // Consistência
  {
    code: "streak_7",
    category: "Consistência",
    title: "7 dias de sequência",
    description: "Mantenha 7 dias seguidos de atividade",
    target: 7,
    metric: "streak",
    kind: "count",
  },
  {
    code: "streak_30",
    category: "Consistência",
    title: "30 dias de sequência",
    description: "Mantenha 30 dias seguidos de atividade",
    target: 30,
    metric: "streak",
    kind: "count",
  },
];

function metricValue(stats: AchievementStats, metric: AchievementMetric): number {
  switch (metric) {
    case "materials":
      return stats.materials;
    case "posts":
      return stats.posts;
    case "comments":
      return stats.comments;
    case "likes":
      return stats.likes;
    case "simulados":
      return stats.simulados;
    case "reputation":
      return stats.reputation;
    case "streak":
      return stats.streak;
    case "rank":
      return stats.rank ?? 0;
  }
}

function evaluate(
  def: AchievementDef,
  stats: AchievementStats,
  earnedCodes: Set<string>,
): AchievementProgress {
  if (def.kind === "rank") {
    const rank = stats.rank;
    const earned = earnedCodes.has(def.code) || (rank != null && rank <= def.target);
    return {
      ...def,
      current: rank ?? 0,
      earned,
      progress: earned ? 100 : 0,
    };
  }

  const current = metricValue(stats, def.metric);
  const earned = earnedCodes.has(def.code) || current >= def.target;
  const progress = Math.min(100, Math.round((current / def.target) * 100));

  return { ...def, current, earned, progress };
}

export function buildAchievements(
  stats: AchievementStats,
  earnedCodes: Set<string> = new Set(),
): AchievementCategory[] {
  return ACHIEVEMENT_CATEGORIES.map((name) => {
    const items = ACHIEVEMENTS.filter((def) => def.category === name).map((def) =>
      evaluate(def, stats, earnedCodes),
    );

    return {
      name,
      items,
      earnedCount: items.filter((item) => item.earned).length,
      total: items.length,
    };
  });
}

export function achievementByCode(code: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((def) => def.code === code);
}

export const ACHIEVEMENT_TOTAL = ACHIEVEMENTS.length;
