import type { MaterialStatus } from "@/lib/material-options";

const statusStyles: Record<MaterialStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
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
