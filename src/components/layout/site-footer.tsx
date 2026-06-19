import Link from "next/link";
import { UNIVERSITIES, SUBJECTS, VESTIBULARES, SITE_NAME } from "@/lib/catalog";

// Rodapé com linkagem interna para os hubs de SEO (universidades, matérias,
// vestibulares). Presente em todas as páginas via AppShell.
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Explorar
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/biblioteca" className="hover:text-sky-700">Biblioteca</Link></li>
            <li><Link href="/simulados" className="hover:text-sky-700">Simulados</Link></li>
            <li><Link href="/ranking" className="hover:text-sky-700">Ranking</Link></li>
            <li><Link href="/premium-medicina" className="hover:text-sky-700">Premium Medicina</Link></li>
            <li><Link href="/planos" className="hover:text-sky-700">Planos</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Universidades
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {UNIVERSITIES.slice(0, 6).map((u) => (
              <li key={u.slug}>
                <Link href={`/universidades/${u.slug}`} className="hover:text-sky-700">
                  {u.label}
                </Link>
              </li>
            ))}
            <li><Link href="/universidades" className="font-semibold text-sky-700">Ver todas</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Matérias
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {SUBJECTS.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link href={`/materias/${s.slug}`} className="hover:text-sky-700">
                  {s.name}
                </Link>
              </li>
            ))}
            <li><Link href="/materias" className="font-semibold text-sky-700">Ver todas</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Vestibulares
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {VESTIBULARES.map((v) => (
              <li key={v.slug}>
                <Link href={`/vestibulares/${v.slug}`} className="hover:text-sky-700">
                  {v.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        {SITE_NAME} — Estude junto. Passe junto.
      </div>
    </footer>
  );
}
