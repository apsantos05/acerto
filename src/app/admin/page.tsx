import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import {
  getAdminMaterials,
  getAdminSimulados,
  getRecentPosts,
  isCurrentUserAdmin,
} from "@/lib/admin";

export default async function AdminPage() {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    notFound();
  }

  const [materials, posts, simulados] = await Promise.all([
    getAdminMaterials(),
    getRecentPosts(),
    getAdminSimulados(),
  ]);

  const pendingCount = materials.filter(
    (material) => material.status === "pending",
  ).length;

  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          eyebrow="Administração"
          title="Moderação"
          description="Aprove, rejeite ou exclua materiais e posts da comunidade."
        />
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
          <ShieldCheck size={17} />
          {pendingCount} pendente{pendingCount === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-2">
        <AdminPanel materials={materials} posts={posts} simulados={simulados} />
      </div>
    </AppShell>
  );
}
