import Link from "next/link";
import { BookOpen, Bookmark, Heart, MessageCircle, PenLine } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
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
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
            {positionLabel(entry.position)}
          </div>
          <ProfileAvatar
            name={entry.fullName}
            avatarUrl={entry.avatarUrl}
            size="md"
          />
          <div>
            <h3 className="font-semibold text-slate-950">{entry.fullName}</h3>
            <p className="mt-1 text-sm text-slate-500">
              @{entry.username}
              {location ? ` · ${location}` : ""}
            </p>
            <p className="mt-1 text-xs font-semibold text-sky-700">
              {entry.dreamFaculty}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl font-semibold text-emerald-600">
            {entry.totalPoints.toLocaleString("pt-BR")}
          </p>
          <p className="text-sm font-medium text-slate-500">pontos</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-5">
        <span className="inline-flex items-center gap-2">
          <BookOpen size={16} className="text-sky-700" />
          {entry.approvedMaterials} materiais
        </span>
        <span className="inline-flex items-center gap-2">
          <Heart size={16} className="text-sky-700" />
          {entry.materialLikesReceived} curtidas
        </span>
        <span className="inline-flex items-center gap-2">
          <Bookmark size={16} className="text-sky-700" />
          {entry.materialSavesReceived} salvos
        </span>
        <span className="inline-flex items-center gap-2">
          <MessageCircle size={16} className="text-sky-700" />
          {entry.commentsMade} comentários
        </span>
        <span className="inline-flex items-center gap-2">
          <PenLine size={16} className="text-sky-700" />
          {entry.postsCreated} posts
        </span>
      </div>
    </article>
  );

  return <Link href={`/perfil/${entry.username}`}>{content}</Link>;
}
