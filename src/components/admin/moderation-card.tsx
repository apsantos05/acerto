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
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import type { PendingMaterial } from "@/lib/admin";

type ModerationCardProps = {
  material: PendingMaterial;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function ModerationCard({ material }: ModerationCardProps) {
  const router = useRouter();
  const { supabase, user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

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

  if (done) {
    return (
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-600">
        “{material.title}” foi{" "}
        {done === "approved" ? "aprovado ✅" : "rejeitado ❌"}.
      </article>
    );
  }

  const fileHref = material.externalUrl ?? material.fileUrl;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Pendente · {material.materialType}
          </span>
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
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
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

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => moderate("approved")}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Check size={17} />
            Aprovar
          </button>
          <button
            type="button"
            onClick={() => moderate("rejected")}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <X size={17} />
            Rejeitar
          </button>
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
