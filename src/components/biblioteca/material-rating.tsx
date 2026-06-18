"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";

type MaterialRatingProps = {
  materialId: string;
  average: number;
  count: number;
  isMock?: boolean;
};

export function MaterialRating({
  materialId,
  average,
  count,
  isMock,
}: MaterialRatingProps) {
  const router = useRouter();
  const { supabase, user } = useAuth();
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hover, setHover] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMyRating() {
      if (!supabase || !user || isMock) {
        return;
      }

      const { data } = await supabase
        .from("material_ratings")
        .select("rating")
        .eq("material_id", materialId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (active && data) {
        setMyRating(data.rating as number);
      }
    }

    loadMyRating();
    return () => {
      active = false;
    };
  }, [supabase, user, materialId, isMock]);

  async function submitRating(value: number) {
    setError("");
    setMessage("");

    if (!supabase || !user) {
      setError("Entre para avaliar este material.");
      return;
    }

    const previous = myRating;
    setMyRating(value);
    setIsSaving(true);

    try {
      const { error: upsertError } = await supabase
        .from("material_ratings")
        .upsert(
          { material_id: materialId, user_id: user.id, rating: value },
          { onConflict: "material_id,user_id" },
        );

      if (upsertError) {
        throw upsertError;
      }

      setMessage("Avaliação registrada!");
      router.refresh(); // reflete a nova média/contagem vinda do servidor
    } catch (submitError) {
      setMyRating(previous);
      console.error("[material-rating] falha ao avaliar:", submitError);
      setError(
        getSupabaseErrorMessage(submitError, "Não foi possível avaliar agora."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  const displayValue = hover || myRating || 0;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Star size={18} className="text-amber-500" fill="currentColor" />
          {count > 0 ? (
            <>
              {average.toFixed(1)}
              <span className="font-normal text-slate-500">
                · {count} {count === 1 ? "avaliação" : "avaliações"}
              </span>
            </>
          ) : (
            <span className="font-normal text-slate-500">
              Ainda sem avaliações
            </span>
          )}
        </div>
      </div>

      {isMock ? (
        <p className="mt-3 text-sm text-slate-500">
          Avaliação disponível para materiais reais da comunidade.
        </p>
      ) : user ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700">
            {myRating ? "Sua avaliação" : "Avalie este material"}
          </p>
          <div
            className="mt-2 flex items-center gap-1"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                disabled={isSaving}
                onClick={() => submitRating(value)}
                onMouseEnter={() => setHover(value)}
                aria-label={`Avaliar com ${value} ${value === 1 ? "estrela" : "estrelas"}`}
                className="rounded p-0.5 transition disabled:cursor-not-allowed"
              >
                <Star
                  size={28}
                  className={
                    value <= displayValue ? "text-amber-500" : "text-slate-300"
                  }
                  fill={value <= displayValue ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>
          {message ? (
            <p className="mt-2 text-sm text-emerald-700">{message}</p>
          ) : null}
          {error ? (
            <p className="mt-2 text-sm text-red-700">{error}</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-600">
            Entre para avaliar este material.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Entrar para avaliar
          </Link>
        </div>
      )}
    </div>
  );
}
