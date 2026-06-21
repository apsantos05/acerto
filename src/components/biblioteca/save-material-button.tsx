"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { UpgradeModal } from "@/components/plan/upgrade-modal";

type SaveMaterialButtonProps = {
  materialId: string;
  isMock?: boolean;
};

export function SaveMaterialButton({
  materialId,
  isMock,
}: SaveMaterialButtonProps) {
  const { supabase, user, isLoading } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!supabase || !user || isMock) {
      return;
    }

    let isMounted = true;

    supabase
      .from("saved_materials")
      .select("material_id")
      .eq("user_id", user.id)
      .eq("material_id", materialId)
      .maybeSingle()
      .then(({ data }) => {
        if (isMounted) {
          setIsSaved(Boolean(data));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isMock, materialId, supabase, user]);

  async function handleClick() {
    setError("");

    if (isMock) {
      setIsSaved((current) => !current);
      return;
    }

    if (!supabase || !user) {
      setError("Entre para salvar materiais.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSaved) {
        const { error: deleteError } = await supabase
          .from("saved_materials")
          .delete()
          .eq("user_id", user.id)
          .eq("material_id", materialId);

        if (deleteError) {
          throw deleteError;
        }

        setIsSaved(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("saved_materials")
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

      setIsSaved(true);
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar o material.";
      // Limite de favoritos (trigger no banco): abre o modal de upgrade.
      if (/limite de 20 favoritos/i.test(message)) {
        setShowUpgrade(true);
      } else {
        setError(message);
      }
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
          isSaved
            ? "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:hover:bg-cyan-500/25"
            : "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        }`}
      >
        <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
        {isSubmitting ? "Salvando..." : isSaved ? "Salvo" : "Salvar"}
      </button>
      {error ? (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      ) : null}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Limite de favoritos atingido"
        message="O plano Gratuito permite até 20 favoritos. Assine o Premium para favoritos ilimitados."
      />
    </div>
  );
}
