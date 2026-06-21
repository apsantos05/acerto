"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Heart, MessageCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import type { AdminPost } from "@/lib/admin";

type PostModerationCardProps = {
  post: AdminPost;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function PostModerationCard({ post }: PostModerationCardProps) {
  const router = useRouter();
  const { supabase, user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function deletePost() {
    setError("");
    if (!supabase || !user) {
      setError("Sessão expirada. Entre novamente.");
      return;
    }
    setIsDeleting(true);
    try {
      const { error: rpcError } = await supabase.rpc("admin_delete_post", {
        p_post_id: post.id,
      });
      if (rpcError) {
        throw rpcError;
      }
      setDone(true);
      router.refresh();
    } catch (deleteError) {
      console.error("[admin] falha ao excluir post:", deleteError);
      setError(
        getSupabaseErrorMessage(
          deleteError,
          "Não foi possível excluir o post.",
        ),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (done) {
    return (
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
        Post excluído 🗑️
      </article>
    );
  }

  const authorName = post.author?.fullName ?? "Estudante Acerte";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <ProfileAvatar
          name={authorName}
          avatarUrl={post.author?.avatarUrl ?? null}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {post.author?.username ? (
                <Link
                  href={`/perfil/${post.author.username}`}
                  className="font-semibold text-slate-950 hover:text-sky-800 dark:text-white dark:hover:text-sky-300"
                >
                  {authorName}
                  <span className="ml-1 text-sm font-normal text-slate-500 dark:text-slate-400">
                    @{post.author.username}
                  </span>
                </Link>
              ) : (
                <p className="font-semibold text-slate-950 dark:text-white">{authorName}</p>
              )}
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <CalendarDays size={13} />
                {formatDate(post.createdAt)}
              </p>
            </div>

            {confirming ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={deletePost}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-70 dark:border-slate-800 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              >
                <Trash2 size={16} />
                Excluir post
              </button>
            )}
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
            {post.content}
          </p>

          <div className="mt-4 flex gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Heart size={15} />
              {post.likesCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={15} />
              {post.commentsCount}
            </span>
          </div>

          {error ? (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
