import { Crown, Sparkles } from "lucide-react";
import { PLAN_LABEL, type Plan } from "@/lib/plan";

type PlanBadgeProps = {
  plan: Plan;
  size?: "sm" | "md";
  // Por padrão só assinantes (premium/premium_med) recebem badge nos contextos
  // inline (feed, comentários, ranking). Use showFree no perfil para exibir todos.
  showFree?: boolean;
};

const STYLES: Record<Plan, string> = {
  free: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  premium: "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30",
  premium_med:
    "bg-gradient-to-r from-amber-300 to-yellow-400 text-amber-950 ring-1 ring-inset ring-amber-400 shadow-sm",
};

export function PlanBadge({ plan, size = "sm", showFree = false }: PlanBadgeProps) {
  if (plan === "free" && !showFree) return null;

  const pad = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  const iconSize = size === "md" ? 15 : 13;

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold ${pad} ${STYLES[plan]}`}
      title={PLAN_LABEL[plan]}
    >
      {plan === "premium_med" ? (
        <Crown size={iconSize} />
      ) : plan === "premium" ? (
        <Sparkles size={iconSize} />
      ) : (
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      )}
      {PLAN_LABEL[plan]}
    </span>
  );
}
