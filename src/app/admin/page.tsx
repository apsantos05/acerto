import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ModerationCard } from "@/components/admin/moderation-card";
import { getPendingMaterials, isCurrentUserAdmin } from "@/lib/admin";

export default async function AdminPage() {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    notFound();
  }

  const pending = await getPendingMaterials();

  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          eyebrow="Administração"
          title="Moderação de materiais"
          description="Aprove ou rejeite os materiais enviados pela comunidade."
        />
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
          <ShieldCheck size={17} />
          {pending.length} pendente{pending.length === 1 ? "" : "s"}
        </div>
      </div>

      {pending.length > 0 ? (
        <div className="grid gap-4">
          {pending.map((material) => (
            <ModerationCard key={material.id} material={material} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <ShieldCheck className="mx-auto text-emerald-600" size={32} />
          <h2 className="mt-3 text-lg font-semibold text-slate-950">
            Nenhum material pendente
          </h2>
          <p className="mt-2 text-slate-600">
            Tudo em dia! Novos envios aparecerão aqui para revisão.
          </p>
        </div>
      )}
    </AppShell>
  );
}
