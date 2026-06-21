import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Crown,
  GraduationCap,
  Gauge,
  ListChecks,
  Lock,
  School,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { TrackSchedule } from "@/components/trilhas/track-schedule";
import { getTrackBySlug, getTrackDetail } from "@/lib/tracks";
import { getViewer, canAccessTrack } from "@/lib/gating";
import { PLAN_LABEL } from "@/lib/plan";

type TrackPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: TrackPageProps): Promise<Metadata> {
  const { slug } = await params;
  const track = await getTrackBySlug(slug);
  if (!track) return { title: "Trilha não encontrada" };
  return {
    title: `${track.title} — Trilha de estudos`,
    description: track.description,
    alternates: { canonical: `/trilhas/${slug}` },
    openGraph: { title: track.title, description: track.description },
  };
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { slug } = await params;
  const detail = await getTrackDetail(slug);
  if (!detail) {
    notFound();
  }

  const { track, weeks, totalTasks, completedTasks, recommendedMaterials, recommendedSimulados } =
    detail;
  const viewer = await getViewer();
  const fullAccess = canAccessTrack(track, viewer);
  const isMed = track.planRequired === "premium_med";

  const visibleMaterials = fullAccess
    ? recommendedMaterials
    : recommendedMaterials.slice(0, 2);
  const visibleSimulados = fullAccess
    ? recommendedSimulados
    : recommendedSimulados.slice(0, 1);

  return (
    <AppShell>
      <Link
        href="/trilhas"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950 dark:text-sky-400 dark:hover:text-sky-300"
      >
        <ArrowLeft size={17} />
        Voltar para trilhas
      </Link>

      {/* Cabeçalho */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-800 p-6 text-white shadow-sm lg:p-8 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <GraduationCap size={14} />
            {track.vestibular}
          </span>
          {isMed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-3 py-1 text-xs font-bold shadow-sm">
              <Crown size={12} />
              Premium Medicina
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              Premium
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <Gauge size={12} />
            {track.difficulty}
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{track.title}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-sky-50/90">
          {track.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-sky-50/90">
          <span className="inline-flex items-center gap-2">
            <School size={16} />
            {track.university}
          </span>
          <span className="inline-flex items-center gap-2">
            <Target size={16} />
            {track.targetCourse}
          </span>
          <span className="inline-flex items-center gap-2">
            <ListChecks size={16} />
            {completedTasks}/{totalTasks} concluídas
          </span>
        </div>
      </section>

      {/* Acesso/plano */}
      {!fullAccess ? (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-400" size={20} />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Você está vendo a <strong>prévia</strong> desta trilha (1ª semana liberada).
              O acesso completo exige o plano{" "}
              <strong>{PLAN_LABEL[track.planRequired]}</strong>.
            </p>
          </div>
          <Link
            href="/planos"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <Crown size={16} />
            Ver planos
          </Link>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Cronograma */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-xl font-semibold text-slate-950 dark:text-white">
            Cronograma sugerido
          </h2>
          <TrackSchedule
            trackId={track.id}
            weeks={weeks}
            fullAccess={fullAccess}
          />
        </div>

        {/* Sidebar: matérias + recomendações */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Matérias prioritárias
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {track.prioritySubjects.map((subject) => (
                <span
                  key={subject}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <BookOpen size={15} />
              Materiais recomendados
            </h3>
            {visibleMaterials.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {visibleMaterials.map((rec) => (
                  <li key={rec.id}>
                    <Link
                      href={rec.href}
                      className="group flex items-start justify-between gap-2 rounded-lg border border-slate-200 p-3 transition hover:border-sky-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-sky-500/40 dark:hover:bg-slate-800"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">
                          {rec.title}
                        </span>
                        {rec.subtitle ? (
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                            {rec.subtitle}
                          </span>
                        ) : null}
                      </span>
                      <ArrowRight size={15} className="mt-0.5 shrink-0 text-slate-400 group-hover:text-sky-600 dark:text-slate-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Sem materiais cadastrados para {track.university} ainda.
              </p>
            )}
            {!fullAccess && recommendedMaterials.length > visibleMaterials.length ? (
              <Link href="/planos" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-700 dark:text-sky-400">
                <Lock size={12} /> +{recommendedMaterials.length - visibleMaterials.length} no Premium
              </Link>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <ListChecks size={15} />
              Simulados recomendados
            </h3>
            {visibleSimulados.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {visibleSimulados.map((rec) => (
                  <li key={rec.id}>
                    <Link
                      href={rec.href}
                      className="group flex items-start justify-between gap-2 rounded-lg border border-slate-200 p-3 transition hover:border-sky-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-sky-500/40 dark:hover:bg-slate-800"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">
                          {rec.title}
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          {rec.subtitle}
                        </span>
                      </span>
                      <ArrowRight size={15} className="mt-0.5 shrink-0 text-slate-400 group-hover:text-sky-600 dark:text-slate-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Sem simulados vinculados a {track.vestibular} ainda.
              </p>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
