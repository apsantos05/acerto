type RankingFiltersProps = {
  subjects: string[];
  vestibulares: string[];
  activeSubject: string;
  activeVestibular: string;
};

export function RankingFilters({
  subjects,
  vestibulares,
  activeSubject,
  activeVestibular,
}: RankingFiltersProps) {
  return (
    <form className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_auto]">
      <label className="block">
        <span className="text-xs font-semibold uppercase text-slate-500">
          Matéria
        </span>
        <select
          name="subject"
          defaultValue={activeSubject}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        >
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase text-slate-500">
          Vestibular
        </span>
        <select
          name="vestibular"
          defaultValue={activeVestibular}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        >
          {vestibulares.map((vestibular) => (
            <option key={vestibular} value={vestibular}>
              {vestibular}
            </option>
          ))}
        </select>
      </label>

      <button className="self-end rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
        Atualizar rankings
      </button>
    </form>
  );
}
