"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

type LikeMaterialButtonProps = {
  materialId: string;
  isMock?: boolean;
};

export function LikeMaterialButton({
  materialId,
  isMock,
}: LikeMaterialButtonProps) {
  const { supabase, user, isLoading } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase || !user || isMock) {
      return;
    }

    let isMounted = true;

    supabase
      .from("material_likes")
      .select("material_id")
      .eq("user_id", user.id)
      .eq("material_id", materialId)
      .maybeSingle()
      .then(({ data }) => {
        if (isMounted) {
          setIsLiked(Boolean(data));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isMock, materialId, supabase, user]);

  async function handleClick() {
    setError("");

    if (isMock) {
      setIsLiked((current) => !current);
      return;
    }

    if (!supabase || !user) {
      setError("Entre para curtir materiais.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLiked) {
        const { error: deleteError } = await supabase
          .from("material_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("material_id", materialId);

        if (deleteError) {
          throw deleteError;
        }

        setIsLiked(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("material_likes")
        .upsert(
          {
            user_id: user.id,
            material_id: materialId,
          },
          {
            onConflict: "user_id,material_id",
          },
        );

      if (insertError) {
        throw insertError;
      }

      setIsLiked(true);
    } catch (likeError) {
      setError(
        likeError instanceof Error
          ? likeError.message
          : "Não foi possível curtir o material.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
          isLiked
            ? "bg-red-50 text-red-700 hover:bg-red-100"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
        {isSubmitting ? "Curtindo..." : isLiked ? "Curtido" : "Curtir"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
