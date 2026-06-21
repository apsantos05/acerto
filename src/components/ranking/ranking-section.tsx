import { Trophy } from "lucide-react";
import { RankingUserCard } from "@/components/ranking/ranking-user-card";
import type { RankingEntry } from "@/lib/ranking";

type RankingSectionProps = {
  title: string;
  description: string;
  entries: RankingEntry[];
};

export function RankingSection({
  title,
  description,
  entries,
}: RankingSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <Trophy size={19} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry) => (
            <RankingUserCard key={`${title}-${entry.profileId}`} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <p className="font-semibold text-slate-950 dark:text-white">
            Nenhuma pontuação ainda
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            As posições aparecem conforme os estudantes contribuem.
          </p>
        </div>
      )}
    </section>
  );
}
