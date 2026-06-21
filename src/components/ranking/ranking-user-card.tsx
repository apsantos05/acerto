import Link from "next/link";
import { BookOpen, Bookmark, Heart, MessageCircle, PenLine } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { PlanBadge } from "@/components/profile/plan-badge";
import type { RankingEntry } from "@/lib/ranking";

type RankingUserCardProps = {
  entry: RankingEntry;
};

function positionLabel(position: number) {
  if (position === 1) {
    return "1o";
  }

  return `${position}o`;
}

export function RankingUserCard({ entry }: RankingUserCardProps) {
  const location = [entry.city, entry.state].filter(Boolean).join(", ");
  const content = (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
            {positionLabel(entry.position)}
          </div>
          <ProfileAvatar
            name={entry.fullName}
            avatarUrl={entry.avatarUrl}
            size="md"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950 dark:text-white">{entry.fullName}</h3>
              <PlanBadge plan={entry.plan} />
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              @{entry.username}
              {location ? ` · ${location}` : ""}
            </p>
            <p className="mt-1 text-xs font-semibold text-sky-700 dark:text-sky-400">
              {entry.dreamFaculty}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {entry.totalPoints.toLocaleString("pt-BR")}
          </p>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">pontos</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-5 dark:border-slate-800 dark:text-slate-300">
        <span className="inline-flex items-center gap-2">
          <BookOpen size={16} className="text-sky-700 dark:text-sky-400" />
          {entry.approvedMaterials} materiais
        </span>
        <span className="inline-flex items-center gap-2">
          <Heart size={16} className="text-sky-700 dark:text-sky-400" />
          {entry.materialLikesReceived} curtidas
        </span>
        <span className="inline-flex items-center gap-2">
          <Bookmark size={16} className="text-sky-700 dark:text-sky-400" />
          {entry.materialSavesReceived} salvos
        </span>
        <span className="inline-flex items-center gap-2">
          <MessageCircle size={16} className="text-sky-700 dark:text-sky-400" />
          {entry.commentsMade} comentários
        </span>
        <span className="inline-flex items-center gap-2">
          <PenLine size={16} className="text-sky-700 dark:text-sky-400" />
          {entry.postsCreated} posts
        </span>
      </div>
    </article>
  );

  return <Link href={`/perfil/${entry.username}`}>{content}</Link>;
}
