import type { MaterialStatus } from "@/lib/material-options";

const statusStyles: Record<MaterialStatus, string> = {
  pending: "bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300",
  approved: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  rejected: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300",
};

const statusLabels: Record<MaterialStatus, string> = {
  pending: "Pendente de aprovação",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

export function MaterialStatusBadge({ status }: { status: MaterialStatus }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
