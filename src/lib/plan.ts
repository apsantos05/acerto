// Plano do usuário (espelha profiles.plan / supabase/plans.sql).
export type Plan = "free" | "premium" | "premium_med";

export function normalizePlan(value: string | null | undefined): Plan {
  return value === "premium" || value === "premium_med" ? value : "free";
}

export const PLAN_LABEL: Record<Plan, string> = {
  free: "Gratuito",
  premium: "Premium",
  premium_med: "Premium Medicina",
};
