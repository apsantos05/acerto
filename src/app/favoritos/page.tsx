import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { MaterialCard } from "@/components/biblioteca/material-card";
import { createClient } from "@/lib/supabase/server";
import { getSavedMaterials } from "@/lib/materials";

export const metadata: Metadata = {
  title: "Meus favoritos",
  robots: { index: false, follow: false },
};

export default async function FavoritosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const materials = await getSavedMaterials();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Salvos por você"
        title="Favoritos"
        description="Os materiais que você salvou para estudar depois, reunidos em um só lugar."
      />

      {materials.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {materials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
          <Bookmark className="mx-auto text-slate-400 dark:text-slate-500" />
          <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
            Nenhum material salvo ainda
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Toque em <span className="font-semibold">Salvar</span> em qualquer
            material para guardá-lo aqui.
          </p>
          <Link
            href="/biblioteca"
            className="mt-5 inline-flex rounded-lg bg-slate-950 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-slate-950 transition hover:bg-slate-800 dark:hover:bg-slate-200"
          >
            Explorar a biblioteca
          </Link>
        </div>
      )}
    </AppShell>
  );
}
