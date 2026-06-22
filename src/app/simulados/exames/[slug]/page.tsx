import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SITE_URL } from "@/lib/catalog";
import {
  OFFICIAL_EXAMS,
  getExam,
  getSimuladosByExam,
  type SimuladoSummary,
} from "@/lib/simulados";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return OFFICIAL_EXAMS.map((exam) => ({ slug: exam.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const exam = getExam(slug);
  if (!exam) {
    return { title: "Simulado não encontrado — AcertaVest" };
  }
  return {
    title: `${exam.name} — Simulado oficial`,
    description: exam.blurb,
    alternates: { canonical: `/simulados/exames/${exam.slug}` },
  };
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) {
    const mm = String(m).padStart(2, "0");
    return `${h}h${mm}`;
  }
  return `${m}min`;
}

function examDayLabel(day: number | null): string | null {
  if (day === null) return null;
  return `${day}º dia`;
}

function PlanBadge({ plan }: { plan: SimuladoSummary["planRequired"] }) {
  if (plan === "premium_med") {
    return (
      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-2.5 py-0.5 text-xs font-semibold text-white">
        Premium Medicina
      </span>
    );
  }
  if (plan === "premium") {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
        Premium
      </span>
    );
  }
  return null;
}

export default async function ExameHubPage({ params }: PageProps) {
  const { slug } = await params;
  const exam = getExam(slug);
  if (!exam) {
    notFound();
  }

  const simulados = await getSimuladosByExam(slug);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Simulados",
        item: `${SITE_URL}/simulados/exames`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: exam.name,
        item: `${SITE_URL}/simulados/exames/${exam.slug}`,
      },
    ],
  };

  return (
    <AppShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <PageHeader
        eyebrow="Simulado oficial"
        title={exam.name}
        description={exam.blurb}
      />

      {simulados.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-base font-semibold text-slate-950 dark:text-white">
            Nenhum simulado disponível ainda
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Em breve teremos simulados oficiais do {exam.name} por aqui.
          </p>
          <Link
            href="/simulados/exames"
            className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Ver outras universidades
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {simulados.map((sim) => {
            const dayLabel = examDayLabel(sim.examDay);
            return (
              <Link
                key={sim.id}
                href={`/simulados/${sim.id}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {dayLabel ? (
                    <span className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
                      {dayLabel}
                    </span>
                  ) : null}
                  <PlanBadge plan={sim.planRequired} />
                </div>

                <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
                  {sim.title}
                </h2>
                {sim.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {sim.description}
                  </p>
                ) : null}

                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">Questões</dt>
                    <dd>{sim.questionCount} questões</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">Duração</dt>
                    <dd>{formatDuration(sim.durationMinutes)}</dd>
                  </div>
                </dl>

                <span className="mt-4 text-sm font-semibold text-sky-700 group-hover:underline dark:text-sky-400">
                  Iniciar simulado →
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
