"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ModerationCard } from "@/components/admin/moderation-card";
import { PostModerationCard } from "@/components/admin/post-moderation-card";
import { SimuladoAdminCard } from "@/components/admin/simulado-admin-card";
import {
  BulkActionBar,
  type BulkField,
} from "@/components/admin/bulk-action-bar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import { reclassifyMaterial } from "@/lib/reclassify";
import { isInvalidTitle, titleFromMetadata } from "@/lib/title";
import type {
  AdminCounts,
  AdminFacets,
  AdminMaterial,
  AdminPost,
  AdminSimulado,
} from "@/lib/admin";

type Tab = "pending" | "all" | "posts" | "simulados";

type AdminPanelProps = {
  tab: Tab;
  page: number;
  pageSize: number;
  materials: AdminMaterial[]; // página atual (apenas abas de material)
  materialsTotal: number; // total da aba de material ativa
  counts: AdminCounts;
  posts: AdminPost[];
  simulados: AdminSimulado[];
  facets: AdminFacets;
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function pageWindow(current: number, total: number): number[] {
  const span = 2;
  const start = Math.max(1, current - span);
  const end = Math.min(total, current + span);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

export function AdminPanel(props: AdminPanelProps) {
  return (
    <ToastProvider>
      <AdminPanelInner {...props} />
    </ToastProvider>
  );
}

function AdminPanelInner({
  tab,
  page,
  pageSize,
  materials,
  materialsTotal,
  counts,
  posts,
  simulados,
  facets,
}: AdminPanelProps) {
  const router = useRouter();
  const { supabase, user } = useAuth();
  const toast = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);

  const isMaterialTab = tab === "pending" || tab === "all";
  const currentIds = materials.map((m) => m.id);
  const allSelected =
    currentIds.length > 0 && currentIds.every((id) => selectedIds.has(id));
  const totalPages = Math.max(1, Math.ceil(materialsTotal / pageSize));

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "pending", label: "Pendentes", count: counts.pending },
    { id: "all", label: "Todos os materiais", count: counts.total },
    { id: "posts", label: "Posts", count: counts.posts },
    { id: "simulados", label: "Simulados", count: counts.simulados },
  ];

  const tabHref = (t: Tab) => `/admin?tab=${t}&page=1`;
  const pageHref = (p: number) => `/admin?tab=${tab}&page=${p}`;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function runUpdate(
    patch: Record<string, unknown>,
    message: (count: number) => string,
  ) {
    if (!supabase || !user) {
      toast("Sessão expirada. Entre novamente.", "error");
      return;
    }
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setWorking(true);
    try {
      for (const part of chunk(ids, 200)) {
        const { error } = await supabase
          .from("materials")
          .update({ ...patch, updated_by: user.id })
          .in("id", part);
        if (error) throw error;
      }
      toast(message(ids.length), "success");
      clearSelection();
      router.refresh();
    } catch (updateError) {
      console.error("[admin] ação em massa falhou:", updateError);
      toast(getSupabaseErrorMessage(updateError, "Falha na ação em massa."), "error");
    } finally {
      setWorking(false);
    }
  }

  function bulkApprove() {
    void runUpdate({ status: "approved" }, (n) => `${n} material(is) aprovado(s).`);
  }
  function bulkReject() {
    void runUpdate({ status: "rejected" }, (n) => `${n} material(is) rejeitado(s).`);
  }
  function bulkApplyField(field: BulkField, value: string) {
    const labels: Record<BulkField, string> = {
      faculdade: "Faculdade",
      subject: "Matéria",
      vestibular: "Vestibular",
      status: "Status",
    };
    void runUpdate({ [field]: value }, (n) => `${labels[field]} alterada em ${n} material(is).`);
  }

  async function bulkDelete() {
    if (!supabase || !user) {
      toast("Sessão expirada. Entre novamente.", "error");
      return;
    }
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setWorking(true);
    try {
      const paths = materials
        .filter((m) => selectedIds.has(m.id) && m.storagePath)
        .map((m) => m.storagePath as string);
      for (const part of chunk(paths, 100)) {
        const { error: removeError } = await supabase.storage.from("materials").remove(part);
        if (removeError) console.warn("[admin] remoção de arquivos (seguindo):", removeError.message);
      }
      let ok = 0;
      let fail = 0;
      for (const part of chunk(ids, 8)) {
        const results = await Promise.all(
          part.map((id) => supabase.rpc("admin_delete_material", { p_material_id: id })),
        );
        for (const result of results) {
          if (result.error) fail++;
          else ok++;
        }
      }
      toast(
        fail ? `${ok} excluído(s), ${fail} falharam.` : `${ok} material(is) excluído(s).`,
        fail ? "error" : "success",
      );
      clearSelection();
      router.refresh();
    } catch (deleteError) {
      console.error("[admin] exclusão em massa falhou:", deleteError);
      toast(getSupabaseErrorMessage(deleteError, "Falha na exclusão em massa."), "error");
    } finally {
      setWorking(false);
    }
  }

  async function runReclassify(targets: AdminMaterial[]) {
    if (!supabase || !user) {
      toast("Sessão expirada. Entre novamente.", "error");
      return;
    }
    const planned = targets
      .map((m) => ({
        m,
        ...reclassifyMaterial({
          id: m.id, title: m.title, description: m.description, summary: m.summary,
          keywords: m.keywords, slug: m.slug, editora: m.editora, faculdade: m.faculdade,
          vestibular: m.vestibular, subject: m.subject, materialType: m.materialType,
          year: m.year, difficulty: m.difficulty, priority: m.priority,
        }),
      }))
      .filter((p) => p.changes.length > 0);
    if (planned.length === 0) {
      toast("Nada a reclassificar — metadados já consistentes.", "success");
      return;
    }
    setWorking(true);
    try {
      let ok = 0;
      let fail = 0;
      for (let i = 0; i < planned.length; i += 8) {
        const batch = planned.slice(i, i + 8);
        const results = await Promise.all(
          batch.map(({ m, patch }) =>
            supabase.from("materials").update({ ...patch, updated_by: user.id }).eq("id", m.id),
          ),
        );
        for (const result of results) {
          if (result.error) fail++;
          else ok++;
        }
      }
      toast(
        fail ? `${ok} reclassificado(s), ${fail} falharam.` : `${ok} material(is) reclassificado(s).`,
        fail ? "error" : "success",
      );
      clearSelection();
      router.refresh();
    } catch (reclassifyError) {
      console.error("[admin] reclassificação falhou:", reclassifyError);
      toast(getSupabaseErrorMessage(reclassifyError, "Falha ao reclassificar."), "error");
    } finally {
      setWorking(false);
    }
  }

  async function runFixTitles(targets: AdminMaterial[]) {
    if (!supabase || !user) {
      toast("Sessão expirada. Entre novamente.", "error");
      return;
    }
    const invalid = targets.filter((m) => isInvalidTitle(m.title));
    if (invalid.length === 0) {
      toast("Nenhum título inválido nesta página.", "success");
      return;
    }
    setWorking(true);
    try {
      let renamed = 0;
      let needPdf = 0;
      let fail = 0;
      const planned: { id: string; patch: Record<string, unknown> }[] = [];
      for (const m of invalid) {
        const newTitle = titleFromMetadata({
          editora: m.editora, subject: m.subject, vestibular: m.vestibular,
          materialType: m.materialType, year: m.year,
        });
        if (!newTitle) {
          needPdf++;
          continue;
        }
        const { patch } = reclassifyMaterial({
          id: m.id, title: newTitle, description: m.description, summary: m.summary,
          keywords: m.keywords, slug: m.slug, editora: m.editora, faculdade: m.faculdade,
          vestibular: m.vestibular, subject: m.subject, materialType: m.materialType,
          year: m.year, difficulty: m.difficulty, priority: m.priority,
        });
        planned.push({ id: m.id, patch: { ...patch, title: newTitle } });
      }
      for (let i = 0; i < planned.length; i += 8) {
        const batch = planned.slice(i, i + 8);
        const results = await Promise.all(
          batch.map((p) =>
            supabase.from("materials").update({ ...p.patch, updated_by: user.id }).eq("id", p.id),
          ),
        );
        for (const result of results) {
          if (result.error) fail++;
          else renamed++;
        }
      }
      toast(
        `${renamed} título(s) corrigido(s)` +
          (needPdf ? `, ${needPdf} precisam do script (PDF/OCR)` : "") +
          (fail ? `, ${fail} falharam` : "") + ".",
        fail ? "error" : "success",
      );
      clearSelection();
      router.refresh();
    } catch (fixError) {
      console.error("[admin] correção de títulos falhou:", fixError);
      toast(getSupabaseErrorMessage(fixError, "Falha ao corrigir títulos."), "error");
    } finally {
      setWorking(false);
    }
  }

  const showBar = isMaterialTab && selectedIds.size > 0;

  return (
    <div className={showBar ? "pb-24" : undefined}>
      {/* Contagens reais do banco */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>
          <b className="text-slate-900">{counts.total.toLocaleString("pt-BR")}</b> no banco
        </span>
        <span>Pendentes: <b className="text-amber-700">{counts.pending.toLocaleString("pt-BR")}</b></span>
        <span>Aprovados: <b className="text-emerald-700">{counts.approved.toLocaleString("pt-BR")}</b></span>
        <span>Rejeitados: <b className="text-red-700">{counts.rejected.toLocaleString("pt-BR")}</b></span>
        {isMaterialTab ? (
          <span className="ml-auto text-slate-500">
            Mostrando {materials.length} · página {page} de {totalPages}
          </span>
        ) : null}
      </div>

      {/* Abas (navegação server-side) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={tabHref(item.id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === item.id
                ? "border-sky-600 text-sky-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {item.label}
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {item.count.toLocaleString("pt-BR")}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {isMaterialTab && materials.length > 0 ? (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <button
              type="button"
              onClick={() =>
                allSelected ? clearSelection() : setSelectedIds(new Set(currentIds))
              }
              className="font-semibold text-sky-700 transition hover:text-sky-900"
            >
              {allSelected ? "Limpar seleção" : "Selecionar página"} ({currentIds.length})
            </button>
            {selectedIds.size > 0 ? (
              <span className="text-slate-500">
                {selectedIds.size} selecionado{selectedIds.size === 1 ? "" : "s"}
              </span>
            ) : null}

            <span className="ml-auto inline-flex flex-wrap items-center gap-2">
              <Sparkles size={15} className="text-amber-500" />
              <span className="font-semibold text-slate-700">Curadoria:</span>
              <button
                type="button"
                disabled={working || selectedIds.size === 0}
                onClick={() => runReclassify(materials.filter((m) => selectedIds.has(m.id)))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Reclassificar selecionados
              </button>
              <button
                type="button"
                disabled={working || materials.length === 0}
                onClick={() => runReclassify(materials)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Reclassificar página
              </button>
              <button
                type="button"
                disabled={working || materials.length === 0}
                onClick={() =>
                  runFixTitles(
                    selectedIds.size > 0
                      ? materials.filter((m) => selectedIds.has(m.id))
                      : materials,
                  )
                }
                title="Corrige títulos UUID/hash/genéricos da página (ou dos selecionados)"
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
              >
                Corrigir títulos inválidos
              </button>
            </span>
          </div>
        ) : null}

        {isMaterialTab ? (
          <SectionList
            isEmpty={materials.length === 0}
            emptyText={
              tab === "pending"
                ? "Nenhum material pendente nesta página."
                : "Nenhum material nesta página."
            }
          >
            {materials.map((material) => (
              <ModerationCard
                key={material.id}
                material={material}
                facets={facets}
                selected={selectedIds.has(material.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </SectionList>
        ) : null}

        {tab === "posts" ? (
          <SectionList isEmpty={posts.length === 0} emptyText="Nenhum post publicado ainda.">
            {posts.map((post) => (
              <PostModerationCard key={post.id} post={post} />
            ))}
          </SectionList>
        ) : null}

        {tab === "simulados" ? (
          <SectionList isEmpty={simulados.length === 0} emptyText="Nenhum simulado cadastrado ainda.">
            {simulados.map((simulado) => (
              <SimuladoAdminCard key={simulado.id} simulado={simulado} />
            ))}
          </SectionList>
        ) : null}

        {/* Paginação (abas de material) */}
        {isMaterialTab && totalPages > 1 ? (
          <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Paginação">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
                Anterior
              </Link>
            ) : null}

            {pageWindow(page, totalPages)[0] > 1 ? (
              <>
                <Link href={pageHref(1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">1</Link>
                <span className="px-1 text-slate-400">…</span>
              </>
            ) : null}

            {pageWindow(page, totalPages).map((p) => (
              <Link
                key={p}
                href={pageHref(p)}
                aria-current={p === page ? "page" : undefined}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  p === page
                    ? "border-sky-600 bg-sky-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {p}
              </Link>
            ))}

            {pageWindow(page, totalPages).slice(-1)[0] < totalPages ? (
              <>
                <span className="px-1 text-slate-400">…</span>
                <Link href={pageHref(totalPages)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">{totalPages}</Link>
              </>
            ) : null}

            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Próxima
                <ChevronRight size={16} />
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>

      {showBar ? (
        <BulkActionBar
          count={selectedIds.size}
          facets={facets}
          working={working}
          onClear={clearSelection}
          onApprove={bulkApprove}
          onReject={bulkReject}
          onDelete={bulkDelete}
          onApplyField={bulkApplyField}
        />
      ) : null}
    </div>
  );
}

function SectionList({
  isEmpty,
  emptyText,
  children,
}: {
  isEmpty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  if (isEmpty) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
        {emptyText}
      </div>
    );
  }
  return <div className="grid gap-4">{children}</div>;
}
