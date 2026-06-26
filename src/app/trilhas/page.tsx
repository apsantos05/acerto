import Link from "next/link";
import type { Metadata } from "next";
import { Compass, Crown } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { TrackCard } from "@/components/trilhas/track-card";
import { getTracks } from "@/lib/tracks";

export const metadata: Metadata = {
  title: "Trilhas de Medicina por universidade",
  description:
    "Trilhas de estudo por universidade (USP, Unicamp, Unesp, Famerp, Einstein...) com cronograma semanal, materiais e simulados recomendados para Medicina.",
  alternates: { canonical: "/trilhas" },
};

export default async function TrilhasPage() {
  const tracks = await getTracks();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Trilhas por universidade"
        title="Trilhas por universidade"
        description="Cronogramas guiados para a sua universidade-alvo de Medicina: matérias prioritárias, materiais e simulados recomendados, semana a semana."
      />

      <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        <Crown size={16} />
        <span>
          A 1ª semana de cada trilha é aberta como prévia. O acesso completo é{" "}
          <Link href="/planos" className="font-semibold underline underline-offset-2">
            Premium
          </Link>
          .
        </span>
      </div>

      <div className="mt-3 flex flex-col items-start justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm sm:flex-row sm:items-center dark:border-sky-500/30 dark:bg-sky-500/10">
        <span className="text-slate-700 dark:text-slate-200">
          <strong className="text-slate-950 dark:text-white">Não sabe qual trilha seguir?</strong>{" "}
          O Diagnóstico de Aprovação recomenda a ideal para você.
        </span>
        <Link
          href="/diagnostico"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-sky-300 bg-white px-4 py-2 font-semibold text-sky-800 transition hover:bg-sky-50 dark:border-sky-500/40 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800"
        >
          Fazer diagnóstico
        </Link>
      </div>

      {tracks.length > 0 ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <Compass className="mx-auto text-slate-400 dark:text-slate-500" />
          <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
            Trilhas chegando
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            As trilhas de estudo estão sendo preparadas. Volte em breve.
          </p>
        </div>
      )}
    </AppShell>
  );
}
