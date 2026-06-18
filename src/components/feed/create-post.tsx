"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LinkIcon, SendHorizonal, Tags } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

type MaterialOption = {
  id: string;
  title: string;
  subject: string | null;
  material_type: string | null;
};

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function CreatePost() {
  const router = useRouter();
  const { supabase, user, isLoading, error: authError } = useAuth();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase || !user) {
      return;
    }

    let isMounted = true;

    supabase
      .from("materials")
      .select("id,title,subject,material_type")
      .or(`status.eq.approved,owner_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (isMounted) {
          setMaterials((data ?? []) as MaterialOption[]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [supabase, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!supabase || !user) {
      setError("Entre na sua conta para publicar no feed.");
      return;
    }

    if (!content.trim()) {
      setError("Escreva um texto para publicar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertError } = await supabase.from("posts").insert({
        author_id: user.id,
        content: content.trim(),
        material_id: materialId || null,
        tags: parseTags(tags),
      });

      if (insertError) {
        throw insertError;
      }

      setContent("");
      setTags("");
      setMaterialId("");
      setSuccess("Publicação criada.");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível publicar agora.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-cyan-300">
          {(user?.user_metadata?.full_name?.[0] ?? user?.email?.[0] ?? "A")
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
            placeholder="Compartilhe uma dúvida, dica de estudo ou recomendação de material..."
            className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.8fr]">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                <LinkIcon size={15} />
                Material anexado
              </span>
              <select
                value={materialId}
                onChange={(event) => setMaterialId(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Nenhum material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.title} · {material.subject ?? material.material_type}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                <Tags size={15} />
                Tags
              </span>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="biologia, fuvest, revisão"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>
          </div>

          {authError ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {authError}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </p>
          ) : null}

          <div className="mt-4 flex justify-end">
            <button
              disabled={isSubmitting || isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <SendHorizonal size={18} />
              {isSubmitting ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
