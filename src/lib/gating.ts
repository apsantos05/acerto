// =====================================================================
// Gating por plano (server-side).
//
// Fonte da verdade: profiles.plan (free | premium | premium_med) +
// profiles.role ('admin' tem acesso total). Espelha supabase/plans.sql e
// supabase/plan_gating.sql, onde os limites são reforçados no banco
// (RPC start_simulado + trigger de favoritos) — esta camada dá a UX
// (prévia + modal de upgrade) e bloqueio no servidor antes de renderizar.
//
// IMPORTANTE: a biblioteca é pública (SEO). Por isso o metadado do material
// continua público; o que o gating bloqueia é o ACESSO ao conteúdo completo
// (arquivo/link) de materiais premium para quem é Free.
// =====================================================================

import { createClient } from "@/lib/supabase/server";
import { normalizePlan, type Plan } from "@/lib/plan";

export const FREE_FAVORITES_LIMIT = 20;
export const FREE_SIMULADOS_PER_MONTH = 2;

// Materiais premium = acervo das editoras (apostilas e materiais com editora).
// Provas e gabaritos (e materiais sem editora) permanecem liberados no Free.
const PREMIUM_MATERIAL_TYPES = new Set(["Apostila", "Material teórico"]);

export type Viewer = {
  userId: string | null;
  plan: Plan;
  isAdmin: boolean;
};

export const ANON_VIEWER: Viewer = {
  userId: null,
  plan: "free",
  isAdmin: false,
};

/** Lê o usuário atual + plano + papel. Nunca lança: em erro devolve anônimo. */
export async function getViewer(): Promise<Viewer> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return ANON_VIEWER;

    const { data } = await supabase
      .from("profiles")
      .select("plan,role")
      .eq("id", user.id)
      .maybeSingle();

    return {
      userId: user.id,
      plan: normalizePlan(data?.plan as string | null | undefined),
      isAdmin: data?.role === "admin",
    };
  } catch {
    return ANON_VIEWER;
  }
}

// -------- Predicados puros (síncronos) sobre um Viewer já carregado --------

export function viewerIsPremium(viewer: Viewer): boolean {
  return (
    viewer.isAdmin || viewer.plan === "premium" || viewer.plan === "premium_med"
  );
}

export function viewerIsPremiumMed(viewer: Viewer): boolean {
  return viewer.isAdmin || viewer.plan === "premium_med";
}

/** Um material exige Premium? (apostilas / materiais de editora) */
export function isPremiumMaterial(material: {
  materialType?: string | null;
  editora?: string | null;
}): boolean {
  if (material.editora && material.editora.trim().length > 0) return true;
  return PREMIUM_MATERIAL_TYPES.has((material.materialType ?? "").trim());
}

// -------- Helpers assíncronos (resolvem o usuário atual por padrão) --------

/** Usuário atual é Premium ou Premium Medicina (admin conta como premium). */
export async function isPremium(viewer?: Viewer): Promise<boolean> {
  return viewerIsPremium(viewer ?? (await getViewer()));
}

/** Usuário atual é Premium Medicina (admin conta como premium_med). */
export async function isPremiumMed(viewer?: Viewer): Promise<boolean> {
  return viewerIsPremiumMed(viewer ?? (await getViewer()));
}

/** Pode acessar o conteúdo completo deste material? */
export async function canAccessMaterial(
  material: { materialType?: string | null; editora?: string | null },
  viewer?: Viewer,
): Promise<boolean> {
  const v = viewer ?? (await getViewer());
  if (!isPremiumMaterial(material)) return true;
  return viewerIsPremium(v);
}

/** Pode iniciar mais um simulado este mês? (Free: 2/mês; demais: ilimitado) */
export async function canTakeSimulado(viewer?: Viewer): Promise<boolean> {
  const v = viewer ?? (await getViewer());
  if (viewerIsPremium(v)) return true;
  if (!v.userId) return false;

  try {
    const supabase = await createClient();
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("simulado_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", v.userId)
      .gte("started_at", monthStart.toISOString());

    return (count ?? 0) < FREE_SIMULADOS_PER_MONTH;
  } catch {
    // Em erro de leitura, não bloqueia a UI — o banco ainda reforça o limite.
    return true;
  }
}

/** Pode favoritar mais um material? (Free: 20; demais: ilimitado) */
export async function canFavoriteMaterial(viewer?: Viewer): Promise<boolean> {
  const v = viewer ?? (await getViewer());
  if (viewerIsPremium(v)) return true;
  if (!v.userId) return false;

  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("saved_materials")
      .select("*", { count: "exact", head: true })
      .eq("user_id", v.userId);

    return (count ?? 0) < FREE_FAVORITES_LIMIT;
  } catch {
    return true;
  }
}

/** Quantos simulados o usuário Free já iniciou no mês (para exibir na UI). */
export async function simuladosUsedThisMonth(viewer?: Viewer): Promise<number> {
  const v = viewer ?? (await getViewer());
  if (!v.userId) return 0;
  try {
    const supabase = await createClient();
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("simulado_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", v.userId)
      .gte("started_at", monthStart.toISOString());
    return count ?? 0;
  } catch {
    return 0;
  }
}

// -------- Trilhas de estudo --------

export const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  premium: 1,
  premium_med: 2,
};

/** Rank do plano do viewer (admin acima de tudo). */
export function viewerPlanRank(viewer: Viewer): number {
  return viewer.isAdmin ? 99 : PLAN_RANK[viewer.plan];
}

/** Acesso COMPLETO à trilha? (plano do viewer >= plano exigido pela trilha) */
export function canAccessTrack(
  track: { planRequired: Plan },
  viewer: Viewer,
): boolean {
  return viewerPlanRank(viewer) >= PLAN_RANK[track.planRequired];
}

/**
 * Semana liberada? Free/plano insuficiente acessa apenas a 1ª semana (prévia);
 * o restante exige o plano da trilha (ou admin).
 */
export function isTrackWeekUnlocked(
  track: { planRequired: Plan },
  weekNumber: number,
  viewer: Viewer,
): boolean {
  return canAccessTrack(track, viewer) || weekNumber <= 1;
}

/** Quantos favoritos o usuário tem (para exibir na UI). */
export async function favoritesUsed(viewer?: Viewer): Promise<number> {
  const v = viewer ?? (await getViewer());
  if (!v.userId) return 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("saved_materials")
      .select("*", { count: "exact", head: true })
      .eq("user_id", v.userId);
    return count ?? 0;
  } catch {
    return 0;
  }
}
