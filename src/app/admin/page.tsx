import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import {
  ADMIN_PAGE_SIZE,
  getAdminCounts,
  getAdminFacets,
  getAdminMaterials,
  getAdminSimulados,
  getRecentPosts,
  isCurrentUserAdmin,
} from "@/lib/admin";

type AdminTab = "pending" | "all" | "posts" | "simulados";

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    notFound();
  }

  const sp = (await searchParams) ?? {};
  const tabParam = getParam(sp, "tab") ?? "pending";
  const tab: AdminTab = (["pending", "all", "posts", "simulados"] as const).includes(
    tabParam as AdminTab,
  )
    ? (tabParam as AdminTab)
    : "pending";
  const page = Math.max(1, Number(getParam(sp, "page")) || 1);
  const search = (getParam(sp, "q") ?? "").trim();
  const isMaterialTab = tab === "pending" || tab === "all";

  const [counts, materialsRes, posts, simulados, facets] = await Promise.all([
    getAdminCounts(),
    isMaterialTab
      ? getAdminMaterials(tab, page, ADMIN_PAGE_SIZE, search)
      : Promise.resolve({ materials: [], total: 0 }),
    tab === "posts" ? getRecentPosts() : Promise.resolve([]),
    tab === "simulados" ? getAdminSimulados() : Promise.resolve([]),
    getAdminFacets(),
  ]);

  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          eyebrow="Administração"
          title="Moderação"
          description="Aprove, rejeite, edite ou exclua materiais e posts da comunidade."
        />
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
          <ShieldCheck size={17} />
          {counts.pending} pendente{counts.pending === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-2">
        <AdminPanel
          tab={tab}
          page={page}
          pageSize={ADMIN_PAGE_SIZE}
          search={search}
          materials={materialsRes.materials}
          materialsTotal={materialsRes.total}
          counts={counts}
          posts={posts}
          simulados={simulados}
          facets={facets}
        />
      </div>
    </AppShell>
  );
}
