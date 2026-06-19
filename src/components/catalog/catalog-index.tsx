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
        <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">{intro}</p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <Link
            key={entry.slug}
            href={`${basePath}/${entry.slug}`}
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-950 group-hover:text-sky-800">
                {entry.label}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                {entry.blurb}
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-700">
              Ver materiais
              <ArrowRight size={15} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
