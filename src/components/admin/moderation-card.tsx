"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  GraduationCap,
  LinkIcon,
  Pencil,
  School,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { MaterialEditModal } from "@/components/admin/material-edit-modal";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import type { AdminFacets, AdminMaterial } from "@/lib/admin";

type ModerationCardProps = {
  material: AdminMaterial;
  facets: AdminFacets;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const statusStyles: Record<AdminMaterial["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

const statusLabels: Record<AdminMaterial["status"], string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

export function ModerationCard({
  material: initialMaterial,
  facets,
  selected = false,
  onToggleSelect,
}: ModerationCardProps) {
  const router = useRouter();
  const { supabase, user } = useAuth();
  const toast = useToast();
  const [material, setMaterial] = useState(initialMaterial);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [done, setDone] = useState<"approved" | "rejected" | "deleted" | null>(
    null,
  );

  async function moderate(status: "approved" | "rejected") {
    setError("");
    if (!supabase || !user) {
      setError("Sessão expirada. Entre novamente.");
      return;
    }
    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("materials")
        .update({ status, updated_by: user.id })
        .eq("id", material.id);
      if (updateError) {
        throw updateError;
      }
      toast(
        status === "approved" ? "Material aprovado." : "Material rejeitado.",
        "success",
      );
      setDone(status);
      router.refresh();
    } catch (moderateError) {
      console.error("[admin] falha ao moderar material:", moderateError);
      const message = getSupabaseErrorMessage(
        moderateError,
        "Não foi possível atualizar o material.",
      );
      setError(message);
      toast(message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteMaterial() {
    setError("");
    if (!supabase || !user) {
      setError("Sessão expirada. Entre novamente.");
      return;
    }
    setIsSaving(true);
    try {
      if (material.storagePath) {
        const { error: removeError } = await supabase.storage
          .from("materials")
          .remove([material.storagePath]);
        if (removeError) {
          console.warn(
            "[admin] falha ao remover arquivo do storage (seguindo):",
            removeError.message,
          );
        }
      }

      const { error: rpcError } = await supabase.rpc("admin_delete_material", {
        p_material_id: material.id,
      });
      if (rpcError) {
        throw rpcError;
      }

      toast("Material excluído.", "success");
      setDone("deleted");
      router.refresh();
    } catch (deleteError) {
      console.error("[admin] falha ao excluir material:", deleteError);
      const message = getSupabaseErrorMessage(
        deleteError,
        "Não foi possível excluir o material.",
      );
      setError(message);
      toast(message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  if (done) {
    const labels = {
      approved: "aprovado ✅",
      rejected: "rejeitado ❌",
      deleted: "excluído 🗑️",
    };
    return (
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-600">
        “{material.title}” foi {labels[done]}.
      </article>
    );
  }

  const fileHref = material.externalUrl ?? material.fileUrl;

  return (
    <article
      className={`rounded-xl border bg-white p-5 shadow-sm transition ${
        selected ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {onToggleSelect ? (
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect(material.id)}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-sky-600 focus:ring-sky-300"
                aria-label={`Selecionar ${material.title}`}
              />
            ) : null}
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[material.status]}`}
            >
              {statusLabels[material.status]}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {material.materialType}
            </span>
            {material.priority === "alta" ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                Prioridade alta
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            {material.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {material.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <GraduationCap size={16} className="text-sky-700" />
              {material.vestibular}
            </span>
            <span className="inline-flex items-center gap-2">
              <School size={16} className="text-sky-700" />
              {material.faculdade}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} className="text-sky-700" />
              {material.year ? `${material.year} · ` : ""}
              {material.subject}
            </span>
          </div>

          {material.author ? (
            <div className="mt-4 text-sm text-slate-600">
              {material.author.username ? (
                <Link
                  href={`/perfil/${material.author.username}`}
                  className="inline-flex items-center gap-2 hover:text-sky-800"
                >
                  <ProfileAvatar
                    name={material.author.fullName}
                    avatarUrl={material.author.avatarUrl}
                    size="sm"
                  />
                  <span className="font-medium">
                    {material.author.fullName} · {formatDate(material.createdAt)}
                  </span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ProfileAvatar
                    name={material.author.fullName}
                    avatarUrl={material.author.avatarUrl}
                    size="sm"
                  />
                  <span className="font-medium">
                    {material.author.fullName} · {formatDate(material.createdAt)}
                  </span>
                </span>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              {formatDate(material.createdAt)}
            </p>
          )}

          {fileHref ? (
            <a
              href={fileHref}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950"
            >
              <LinkIcon size={16} />
              Abrir arquivo enviado
            </a>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
          {material.status === "pending" ? (
            <>
              <button
                type="button"
                onClick={() => moderate("approved")}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Check size={17} />
                Aprovar
              </button>
              <button
                type="button"
                onClick={() => moderate("rejected")}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <X size={17} />
                Rejeitar
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Pencil size={16} />
            Editar
          </button>

          {confirmingDelete ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={deleteMaterial}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {editing ? (
        <MaterialEditModal
          material={material}
          facets={facets}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            setMaterial(updated);
            setEditing(false);
            router.refresh();
          }}
          onApproveSaved={(updated) => {
            setMaterial(updated);
            setEditing(false);
            setDone("approved");
            router.refresh();
          }}
        />
      ) : null}
    </article>
  );
}
