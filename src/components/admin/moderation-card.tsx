"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  GraduationCap,
  LinkIcon,
  School,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import type { AdminMaterial } from "@/lib/admin";

type ModerationCardProps = {
  material: AdminMaterial;
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

export function ModerationCard({ material }: ModerationCardProps) {
  const router = useRouter();
  const { supabase, user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
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
        .update({ status })
        .eq("id", material.id);
      if (updateError) {
        throw updateError;
      }
      setDone(status);
      router.refresh();
    } catch (moderateError) {
      console.error("[admin] falha ao moderar material:", moderateError);
      setError(
        getSupabaseErrorMessage(
          moderateError,
          "Não foi possível atualizar o material.",
        ),
      );
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
      // 1. Arquivo: usar SEMPRE a Storage API (nunca deletar storage.objects
      //    direto). Pular quando for link externo (sem storage_path).
      if (material.storagePath) {
        const { error: removeError } = await supabase.storage
          .from("materials")
          .remove([material.storagePath]);
        if (removeError) {
          // Best-effort: não bloqueia a exclusão do registro.
          console.warn(
            "[admin] falha ao remover arquivo do storage (seguindo):",
            removeError.message,
          );
        } else {
          console.info(
            "[admin] arquivo removido do storage:",
            material.storagePath,
          );
        }
      } else {
        console.info(
          "[admin] material sem storage_path (link externo) — sem remoção de arquivo",
        );
      }

      // 2-5. RPC remove likes, saved_materials, material_ratings e, por fim,
      //      o registro em materials.
      const { error: rpcError } = await supabase.rpc("admin_delete_material", {
        p_material_id: material.id,
      });
      if (rpcError) {
        throw rpcError;
      }

      console.info("[admin] material excluído:", material.id);
      setDone("deleted");
      router.refresh();
    } catch (deleteError) {
      console.error("[admin] falha ao excluir material:", deleteError);
      setError(
        getSupabaseErrorMessage(
          deleteError,
          "Não foi possível excluir o material.",
        ),
      );
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
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[material.status]}`}
            >
              {statusLabels[material.status]}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {material.materialType}
            </span>
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
              Excluir material
            </button>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </article>
  );
}
