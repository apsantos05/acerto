import Link from "next/link";
import { ArrowRight, Crown, GraduationCap, Gauge, Sparkles } from "lucide-react";
import type { StudyTrack } from "@/lib/tracks";

const difficultyStyles: Record<string, string> = {
  fácil: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  médio: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  difícil: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
};

export function TrackCard({ track }: { track: StudyTrack }) {
  const isMed = track.planRequired === "premium_med";
  const diff = difficultyStyles[track.difficulty] ?? difficultyStyles["médio"];

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500/40">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
            <GraduationCap size={14} />
            {track.vestibular}
          </span>
          {isMed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              <Crown size={12} />
              Premium Medicina
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
              <Sparkles size={12} />
              Premium
            </span>
          )}
        </div>

        <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
          {track.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {track.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${diff}`}>
            <Gauge size={13} />
            {track.difficulty}
          </span>
          <span className="text-slate-400 dark:text-slate-500">·</span>
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            {track.university}
          </span>
        </div>

        {track.prioritySubjects.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Matérias prioritárias
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
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
        ) : null}
      </div>

      <Link
        href={`/trilhas/${track.slug}`}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
      >
        Ver trilha
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}
