"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
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
import type {
  AdminFacets,
  AdminMaterial,
  AdminPost,
  AdminSimulado,
} from "@/lib/admin";

type AdminPanelProps = {
  materials: AdminMaterial[];
  posts: AdminPost[];
  simulados: AdminSimulado[];
  facets: AdminFacets;
};

type Tab = "pending" | "all" | "posts" | "simulados";

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export function AdminPanel(props: AdminPanelProps) {
  return (
    <ToastProvider>
      <AdminPanelInner {...props} />
    </ToastProvider>
  );
}

function AdminPanelInner({
  materials,
  posts,
  simulados,
  facets,
}: AdminPanelProps) {
  const router = useRouter();
  const { supabase, user } = useAuth();
  const toast = useToast();

  const pending = materials.filter((material) => material.status === "pending");
  const [tab, setTab] = useState<Tab>("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);

  const isMaterialTab = tab === "pending" || tab === "all";
  const currentList = tab === "pending" ? pending : materials;
  const currentIds = currentList.map((material) => material.id);
  const allSelected =
    currentIds.length > 0 && currentIds.every((id) => selectedIds.has(id));

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "pending", label: "Materiais pendentes", count: pending.length },
    { id: "all", label: "Todos os materiais", count: materials.length },
    { id: "posts", label: "Posts recentes", count: posts.length },
    { id: "simulados", label: "Simulados", count: simulados.length },
  ];

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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
      toast(
        getSupabaseErrorMessage(updateError, "Falha na ação em massa."),
        "error",
      );
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
    void runUpdate(
      { [field]: value },
      (n) => `${labels[field]} alterada em ${n} material(is).`,
    );
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
      // Remove arquivos do storage em lote (best-effort).
      const paths = materials
        .filter((m) => selectedIds.has(m.id) && m.storagePath)
        .map((m) => m.storagePath as string);
      for (const part of chunk(paths, 100)) {
        const { error: removeError } = await supabase.storage
          .from("materials")
          .remove(part);
        if (removeError) {
          console.warn("[admin] remoção de arquivos (seguindo):", removeError.message);
        }
      }

      // Remove os registros via RPC (limpa dependências), com concorrência limitada.
      let ok = 0;
      let fail = 0;
      for (const part of chunk(ids, 8)) {
        const results = await Promise.all(
          part.map((id) =>
            supabase.rpc("admin_delete_material", { p_material_id: id }),
          ),
        );
        for (const result of results) {
          if (result.error) fail++;
          else ok++;
        }
      }

      toast(
        fail
          ? `${ok} excluído(s), ${fail} falharam.`
          : `${ok} material(is) excluído(s).`,
        fail ? "error" : "success",
      );
      clearSelection();
      router.refresh();
    } catch (deleteError) {
      console.error("[admin] exclusão em massa falhou:", deleteError);
      toast(
        getSupabaseErrorMessage(deleteError, "Falha na exclusão em massa."),
        "error",
      );
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
          id: m.id,
          title: m.title,
          description: m.description,
          summary: m.summary,
          keywords: m.keywords,
          slug: m.slug,
          editora: m.editora,
          faculdade: m.faculdade,
          vestibular: m.vestibular,
          subject: m.subject,
          materialType: m.materialType,
          year: m.year,
          difficulty: m.difficulty,
          priority: m.priority,
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
            supabase
              .from("materials")
              .update({ ...patch, updated_by: user.id })
              .eq("id", m.id),
          ),
        );
        for (const result of results) {
          if (result.error) fail++;
          else ok++;
        }
      }
      toast(
        fail
          ? `${ok} reclassificado(s), ${fail} falharam.`
          : `${ok} material(is) reclassificado(s).`,
        fail ? "error" : "success",
      );
      clearSelection();
      router.refresh();
    } catch (reclassifyError) {
      console.error("[admin] reclassificação falhou:", reclassifyError);
      toast(
        getSupabaseErrorMessage(reclassifyError, "Falha ao reclassificar."),
        "error",
      );
    } finally {
      setWorking(false);
    }
  }

  const showBar = isMaterialTab && selectedIds.size > 0;

  return (
    <div className={showBar ? "pb-24" : undefined}>
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === item.id
                ? "border-sky-600 text-sky-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {item.label}
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isMaterialTab && materials.length > 0 ? (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
            {currentIds.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  allSelected ? clearSelection() : setSelectedIds(new Set(currentIds))
                }
                className="font-semibold text-sky-700 transition hover:text-sky-900"
              >
                {allSelected ? "Limpar seleção" : "Selecionar todos"} (
                {currentIds.length})
              </button>
            ) : null}
            {selectedIds.size > 0 ? (
              <span className="text-slate-500">
                {selectedIds.size} selecionado{selectedIds.size === 1 ? "" : "s"}
              </span>
            ) : null}

            <span className="ml-auto inline-flex items-center gap-2">
              <Sparkles size={15} className="text-amber-500" />
              <span className="font-semibold text-slate-700">Curadoria:</span>
              <button
                type="button"
                disabled={working || pending.length === 0}
                onClick={() => runReclassify(pending)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Reclassificar pendentes
              </button>
              <button
                type="button"
                disabled={working || selectedIds.size === 0}
                onClick={() =>
                  runReclassify(materials.filter((m) => selectedIds.has(m.id)))
                }
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
                Reclassificar todos
              </button>
            </span>
          </div>
        ) : null}

        {tab === "pending" ? (
          <SectionList
            isEmpty={pending.length === 0}
            emptyText="Nenhum material pendente. Tudo em dia!"
          >
            {pending.map((material) => (
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

        {tab === "all" ? (
          <SectionList
            isEmpty={materials.length === 0}
            emptyText="Nenhum material cadastrado ainda."
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
          <SectionList
            isEmpty={posts.length === 0}
            emptyText="Nenhum post publicado ainda."
          >
            {posts.map((post) => (
              <PostModerationCard key={post.id} post={post} />
            ))}
          </SectionList>
        ) : null}

        {tab === "simulados" ? (
          <SectionList
            isEmpty={simulados.length === 0}
            emptyText="Nenhum simulado cadastrado ainda."
          >
            {simulados.map((simulado) => (
              <SimuladoAdminCard key={simulado.id} simulado={simulado} />
            ))}
          </SectionList>
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
