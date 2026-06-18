"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bookmark,
  Heart,
  LinkIcon,
  MessageCircle,
  SendHorizonal,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import type { FeedComment, FeedPost } from "@/lib/feed-types";

type PostCardProps = {
  post: FeedPost;
};

function currentUserName(email?: string, name?: string) {
  return name || email?.split("@")[0] || "Você";
}

export function PostCard({ post }: PostCardProps) {
  const { supabase, user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLikedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isSaved, setIsSaved] = useState(post.isSavedByMe);
  const [comments, setComments] = useState<FeedComment[]>(post.comments);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  async function toggleLike() {
    setError("");

    if (!supabase || !user) {
      setError("Entre para curtir posts.");
      return;
    }

    const previousLiked = isLiked;
    setIsLiked(!previousLiked);
    setLikesCount((count) => count + (previousLiked ? -1 : 1));

    const result = previousLiked
      ? await supabase
          .from("likes")
          .delete()
          .eq("target_type", "post")
          .eq("target_id", post.id)
          .eq("user_id", user.id)
      : await supabase.from("likes").upsert(
          {
            target_type: "post",
            target_id: post.id,
            user_id: user.id,
          },
          {
            onConflict: "target_type,target_id,user_id",
          },
        );

    if (result.error) {
      setIsLiked(previousLiked);
      setLikesCount((count) => count + (previousLiked ? 1 : -1));
      setError(result.error.message);
    }
  }

  async function toggleSave() {
    setError("");

    if (!supabase || !user) {
      setError("Entre para salvar posts.");
      return;
    }

    const previousSaved = isSaved;
    setIsSaved(!previousSaved);

    const result = previousSaved
      ? await supabase
          .from("saved_posts")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id)
      : await supabase.from("saved_posts").upsert(
          {
            post_id: post.id,
            user_id: user.id,
          },
          {
            onConflict: "post_id,user_id",
          },
        );

    if (result.error) {
      setIsSaved(previousSaved);
      setError(result.error.message);
    }
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!supabase || !user) {
      setError("Entre para comentar.");
      return;
    }

    const content = commentText.trim();

    if (!content) {
      return;
    }

    setIsCommenting(true);

    try {
      const { data, error: insertError } = await supabase
        .from("comments")
        .insert({
          post_id: post.id,
          author_id: user.id,
          content,
        })
        .select("id,post_id,content,created_at")
        .single();

      if (insertError) {
        throw insertError;
      }

      setComments((current) => [
        ...current,
        {
          id: data.id,
          postId: data.post_id,
          content: data.content,
          createdAt: data.created_at,
          author: {
            id: user.id,
            name: currentUserName(
              user.email,
              user.user_metadata?.full_name as string | undefined,
            ),
            username:
              (user.user_metadata?.username as string | undefined) ?? null,
            avatarUrl:
              (user.user_metadata?.avatar_url as string | undefined) ?? null,
            email: user.email ?? null,
            city: null,
          },
        },
      ]);
      setCommentText("");
    } catch (commentError) {
      setError(
        commentError instanceof Error
          ? commentError.message
          : "Não foi possível comentar agora.",
      );
    } finally {
      setIsCommenting(false);
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {post.author.username ? (
          <Link href={`/perfil/${post.author.username}`} className="shrink-0">
            <ProfileAvatar
              name={post.author.name}
              avatarUrl={post.author.avatarUrl}
              size="md"
            />
          </Link>
        ) : (
          <ProfileAvatar
            name={post.author.name}
            avatarUrl={post.author.avatarUrl}
            size="md"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {post.author.username ? (
                <Link
                  href={`/perfil/${post.author.username}`}
                  className="font-semibold text-slate-950 hover:text-sky-800"
                >
                  {post.author.name}
                </Link>
              ) : (
                <p className="font-semibold text-slate-950">
                  {post.author.name}
                </p>
              )}
              <p className="text-sm text-slate-500">
                {post.author.username ? `@${post.author.username} · ` : ""}
                {post.publishedAt}
                {post.author.city ? ` · ${post.author.city}` : ""}
              </p>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">
            {post.content}
          </p>

          {post.material ? (
            <Link
              href={`/biblioteca/${post.material.id}`}
              className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700">
                <LinkIcon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {post.material.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {post.material.materialType} · {post.material.subject}
                </p>
              </div>
            </Link>
          ) : null}

          {post.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={toggleLike}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-50 ${
                isLiked ? "text-red-600" : "text-slate-600"
              }`}
            >
              <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
              {likesCount}
            </button>
            <span className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600">
              <MessageCircle size={17} />
              {comments.length}
            </span>
            <button
              type="button"
              onClick={toggleSave}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-50 ${
                isSaved ? "text-sky-700" : "text-slate-600"
              }`}
            >
              <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
              {isSaved ? "Salvo" : "Salvar"}
            </button>
          </div>

          {error ? (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-4 space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-950">
                  {comment.author.name}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={submitComment} className="mt-4 flex gap-2">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Escreva um comentário"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
            <button
              disabled={isCommenting}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              aria-label="Enviar comentário"
            >
              <SendHorizonal size={17} />
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
