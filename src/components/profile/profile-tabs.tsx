"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Flame,
  ListChecks,
  Lock,
  MessageSquareText,
  Sparkles,
  Trophy,
} from "lucide-react";
import { achievementByCode, type AchievementCategory } from "@/lib/achievements";
import type {
  ActivityItem,
  ActivityType,
  EarnedBadge,
  ProfileMaterial,
  ProfilePost,
} from "@/lib/profile";

type ProfileTabsProps = {
  materials: ProfileMaterial[];
  posts: ProfilePost[];
  achievements: AchievementCategory[];
  earnedBadges: EarnedBadge[];
  activity: ActivityItem[];
  isCurrentUser: boolean;
};

type TabKey = "overview" | "achievements" | "activity";

const tabs: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
  { key: "overview", label: "Visão geral", icon: BookOpen },
  { key: "achievements", label: "Conquistas", icon: Award },
  { key: "activity", label: "Atividade", icon: ListChecks },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const activityIcon: Record<ActivityType, typeof BookOpen> = {
  material: BookOpen,
  post: MessageSquareText,
  comment: MessageSquareText,
  simulado: Trophy,
  task: CheckCircle2,
};

export function ProfileTabs({
  materials,
  posts,
  achievements,
  earnedBadges,
  activity,
  isCurrentUser,
}: ProfileTabsProps) {
  const [active, setActive] = useState<TabKey>("overview");
  const earnedTotal = achievements.reduce((sum, c) => sum + c.earnedCount, 0);
  const total = achievements.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "border-sky-600 text-sky-700 dark:text-sky-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.key === "achievements" ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {earnedTotal}/{total}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {active === "overview" ? (
          <OverviewTab
            materials={materials}
            posts={posts}
            earnedBadges={earnedBadges}
          />
        ) : null}
        {active === "achievements" ? (
          <AchievementsTab achievements={achievements} />
        ) : null}
        {active === "activity" ? (
          <ActivityTab activity={activity} isCurrentUser={isCurrentUser} />
        ) : null}
      </div>
    </div>
  );
}

function OverviewTab({
  materials,
  posts,
  earnedBadges,
}: {
  materials: ProfileMaterial[];
  posts: ProfilePost[];
  earnedBadges: EarnedBadge[];
}) {
  return (
    <div className="space-y-6">
      {earnedBadges.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Sparkles className="text-sky-700 dark:text-sky-400" size={20} />
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              Badges conquistados
            </h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {earnedBadges.map((badge) => {
              const def = achievementByCode(badge.code);
              return (
                <span
                  key={badge.code}
                  title={def?.description ?? ""}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300"
                >
                  <Award size={14} />
                  {def?.title ?? badge.code}
                </span>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <BookOpen className="text-sky-700 dark:text-sky-400" />
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Materiais publicados
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            {materials.length > 0 ? (
              materials.map((material) => (
                <Link
                  key={material.id}
                  href={`/biblioteca/${material.id}`}
                  className="block rounded-lg border border-slate-100 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10"
                >
                  <p className="font-semibold text-slate-950 dark:text-white">{material.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {material.materialType} · {material.subject} ·{" "}
                    {material.viewsCount.toLocaleString("pt-BR")} visualizações
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Nenhum material aprovado ainda.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <MessageSquareText className="text-sky-700 dark:text-sky-400" />
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Posts recentes
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            {posts.length > 0 ? (
              posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <p className="line-clamp-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {post.content}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <CalendarDays size={14} />
                    {formatDate(post.createdAt)}
                  </p>
                  {post.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Nenhum post publicado ainda.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AchievementsTab({
  achievements,
}: {
  achievements: AchievementCategory[];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {achievements.map((category) => (
        <section
          key={category.name}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {category.name}
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {category.earnedCount}/{category.total}
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {category.items.map((item) => (
              <div key={item.code}>
                <div className="flex items-center gap-2">
                  {item.earned ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  ) : (
                    <Lock size={16} className="shrink-0 text-slate-300 dark:text-slate-600" />
                  )}
                  <p
                    className={`text-sm font-semibold ${
                      item.earned ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {item.title}
                  </p>
                </div>
                <p className="mt-1 pl-6 text-xs text-slate-500 dark:text-slate-400">
                  {item.description}
                </p>
                <div className="mt-2 ml-6 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      item.earned ? "bg-emerald-500" : "bg-sky-500"
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ActivityTab({
  activity,
  isCurrentUser,
}: {
  activity: ActivityItem[];
  isCurrentUser: boolean;
}) {
  if (activity.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm leading-6 text-slate-600">
          Nenhuma atividade registrada ainda. Publique materiais, participe do
          feed e faça simulados para ver seu histórico aqui.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Flame className="text-sky-700 dark:text-sky-400" size={20} />
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          Histórico de atividade
        </h2>
      </div>
      {!isCurrentUser ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Simulados e tarefas de estudo são privados e aparecem apenas para o
          próprio estudante.
        </p>
      ) : null}
      <ol className="mt-5 space-y-1">
        {activity.map((item, index) => {
          const Icon = activityIcon[item.type] ?? CircleDot;
          const isLast = index === activity.length - 1;
          const body = (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                  <Icon size={16} />
                </span>
                {!isLast ? <span className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-800" /> : null}
              </div>
              <div className="pb-5">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  {item.title}
                </p>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  <CalendarDays size={12} />
                  {formatDate(item.date)}
                </p>
              </div>
            </div>
          );

          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="block rounded-lg transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
