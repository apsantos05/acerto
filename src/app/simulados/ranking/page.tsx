import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import {
  getSimuladoRanking,
  type SimuladoRankingEntry,
  type SimuladoRankingCategory,
} from "@/lib/simulados";
import { getViewer, viewerIsPremium } from "@/lib/gating";
import { ProfileAvatar } from "@/components/profile/profile-avatar";

export const metadata: Metadata = {
  title: "Ranking de simulados",
  description:
    "Veja os melhores desempenhos nos simulados da AcertaVest por categoria: Geral, ENEM, Medicina, FUVEST e UNICAMP.",
  alternates: { canonical: "/simulados/ranking" },
};

const TABS: { slug: SimuladoRankingCategory; label: string }[] = [
  { slug: "geral", label: "Geral" },
  { slug: "enem", label: "ENEM" },
  { slug: "medicina", label: "Medicina" },
  { slug: "fuvest", label: "FUVEST" },
  { slug: "unicamp", label: "UNICAMP" },
];

const VALID = new Set<SimuladoRankingCategory>(TABS.map((t) => t.slug));

function parseCategory(raw: string | string[] | undefined): SimuladoRankingCategory {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && VALID.has(value as SimuladoRankingCategory)
    ? (value as SimuladoRankingCategory)
    : "geral";
}

function medal(position: number): { ring: string; badge: string } | null {
  if (position === 1)
    return {
      ring: "ring-amber-400/60 bg-amber-50 dark:bg-amber-500/10",
      badge: "bg-amber-400 text-amber-950",
    };
  if (position === 2)
    return {
      ring: "ring-slate-300/60 bg-slate-50 dark:bg-slate-800/40",
      badge: "bg-slate-300 text-slate-800",
    };
  if (position === 3)
    return {
      ring: "ring-orange-400/50 bg-orange-50 dark:bg-orange-500/10",
      badge: "bg-orange-400 text-orange-950",
    };
  return null;
}

function RankRow({ entry }: { entry: SimuladoRankingEntry }) {
  const top = medal(entry.position);
  const nameNode = entry.username ? (
    <Link
      href={`/perfil/${entry.username}`}
      className="font-semibold text-slate-950 hover:text-sky-700 dark:text-white dark:hover:text-sky-400"
    >
      {entry.fullName}
    </Link>
  ) : (
    <span className="font-semibold text-slate-950 dark:text-white">
      {entry.fullName}
    </span>
  );

  return (
    <li
      className={`flex items-center gap-4 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-800 ${
        top ? `ring-1 ${top.ring}` : "bg-white dark:bg-slate-900"
      }`}
    >
      <div className="flex w-10 shrink-0 items-center justify-center">
        {top ? (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${top.badge}`}
          >
            {entry.position}
          </span>
        ) : (
          <span className="text-base font-semibold text-slate-500 dark:text-slate-400">
            #{entry.position}
          </span>
        )}
      </div>

      <ProfileAvatar name={entry.fullName} avatarUrl={entry.avatarUrl} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="truncate">{nameNode}</div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {entry.attempts} {entry.attempts === 1 ? "tentativa" : "tentativas"}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <span className="text-lg font-bold text-sky-700 dark:text-sky-400">
          {entry.bestPercent}%
        </span>
        <p className="text-xs text-slate-500 dark:text-slate-400">melhor</p>
      </div>
    </li>
  );
}

export default async function SimuladoRankingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const category = parseCategory(params.cat);

  const viewer = await getViewer();
  const isPremium = viewerIsPremium(viewer);

  const all = await getSimuladoRanking(category, 20);
  const entries = isPremium ? all : all.slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Simulados"
        title="Ranking de simulados"
        description="Os melhores desempenhos da comunidade AcertaVest, por categoria. Faça simulados para subir no ranking."
      />

      <nav className="mb-6 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((tab) => {
          const active = tab.slug === category;
          return (
            <Link
              key={tab.slug}
              href={`/simulados/ranking?cat=${tab.slug}`}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-sky-600 text-sky-800 dark:text-sky-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-300">
            Ainda não há resultados nesta categoria.
          </p>
        </div>
      ) : (
        <>
          <ol className="space-y-2">
            {entries.map((entry) => (
              <RankRow key={entry.profileId} entry={entry} />
            ))}
          </ol>

          {!isPremium ? (
            <div className="mt-6 rounded-2xl bg-amber-50 px-6 py-5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <p className="font-semibold">Ranking completo é Premium</p>
              <p className="mt-1 text-sm">
                Você está vendo apenas o top 5. Assine o Premium para desbloquear
                o ranking completo (top 20) em todas as categorias.
              </p>
              <Link
                href="/planos"
                className="mt-3 inline-flex items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400"
              >
                Conhecer o Premium
              </Link>
            </div>
          ) : null}
        </>
      )}
    </AppShell>
  );
}
