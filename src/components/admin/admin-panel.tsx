"use client";

import { useState } from "react";
import { ModerationCard } from "@/components/admin/moderation-card";
import { PostModerationCard } from "@/components/admin/post-moderation-card";
import { SimuladoAdminCard } from "@/components/admin/simulado-admin-card";
import { ToastProvider } from "@/components/ui/toast";
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

export function AdminPanel({
  materials,
  posts,
  simulados,
  facets,
}: AdminPanelProps) {
  const pending = materials.filter((material) => material.status === "pending");
  const [tab, setTab] = useState<Tab>("pending");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "pending", label: "Materiais pendentes", count: pending.length },
    { id: "all", label: "Todos os materiais", count: materials.length },
    { id: "posts", label: "Posts recentes", count: posts.length },
    { id: "simulados", label: "Simulados", count: simulados.length },
  ];

  return (
    <ToastProvider>
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
        {tab === "pending" ? (
          <SectionList
            isEmpty={pending.length === 0}
            emptyText="Nenhum material pendente. Tudo em dia!"
          >
            {pending.map((material) => (
              <ModerationCard key={material.id} material={material} facets={facets} />
            ))}
          </SectionList>
        ) : null}

        {tab === "all" ? (
          <SectionList
            isEmpty={materials.length === 0}
            emptyText="Nenhum material cadastrado ainda."
          >
            {materials.map((material) => (
              <ModerationCard key={material.id} material={material} facets={facets} />
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
    </ToastProvider>
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
