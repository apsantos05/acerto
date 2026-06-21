import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import type { LibraryFilterOptions, LibraryFilters } from "@/lib/materials";

type LibraryFiltersProps = {
  filters: LibraryFilters;
  options: LibraryFilterOptions;
};

function SelectFilter({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: keyof LibraryFilters;
  value?: string;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LibraryFilters({ filters, options }: LibraryFiltersProps) {
  return (
    <form className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
          <Search size={18} className="text-slate-400 dark:text-slate-500" />
          <input
            name="search"
            defaultValue={filters.search ?? ""}
            placeholder="Buscar por material, matéria, faculdade ou vestibular"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none dark:placeholder-slate-500"
          />
        </label>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 dark:bg-white px-5 py-3 text-sm font-semibold text-white dark:text-slate-950 transition hover:bg-slate-800 dark:hover:bg-slate-200">
          <SlidersHorizontal size={18} />
          Filtrar
        </button>
        <Link
          href="/biblioteca"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Limpar
        </Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <SelectFilter
          label="Vestibular"
          name="vestibular"
          value={filters.vestibular}
          options={options.vestibulares}
        />
        <SelectFilter
          label="Faculdade"
          name="faculdade"
          value={filters.faculdade}
          options={options.faculdades}
        />
        <SelectFilter
          label="Ano"
          name="year"
          value={filters.year}
          options={options.years}
        />
        <SelectFilter
          label="Matéria"
          name="subject"
          value={filters.subject}
          options={options.subjects}
        />
        <SelectFilter
          label="Tipo"
          name="materialType"
          value={filters.materialType}
          options={options.materialTypes}
        />
      </div>
    </form>
  );
}
