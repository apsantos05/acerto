import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CatalogEntry } from "@/lib/catalog";

type CatalogIndexProps = {
  title: string;
  intro: string;
  basePath: string;
  entries: CatalogEntry[];
};

// Página índice de um hub (lista de universidades / matérias / vestibulares).
export function CatalogIndex({ title, intro, basePath, entries }: CatalogIndexProps) {
  return (
    <div>
      <header>
        <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600 dark:text-slate-300">{intro}</p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <Link
            key={entry.slug}
            href={`${basePath}/${entry.slug}`}
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500/30"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-950 group-hover:text-sky-800 dark:text-white dark:group-hover:text-sky-300">
                {entry.label}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {entry.blurb}
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 dark:text-sky-400">
              Ver materiais
              <ArrowRight size={15} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
