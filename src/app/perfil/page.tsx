import { Award, BookOpen, MapPin, Settings } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export default function PerfilPage() {
  return (
    <AppShell>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-semibold text-cyan-300">
              ML
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-950">
                Marina Lopes
              </h1>
              <p className="mt-2 flex items-center gap-2 text-slate-500">
                <MapPin size={17} />
                São Paulo · Foco Fuvest e Unicamp
              </p>
            </div>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
            <Settings size={18} />
            Editar perfil
          </button>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["8420", "pontos"],
          ["126", "materiais salvos"],
          ["38", "contribuições"],
        ].map(([value, label]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-3xl font-semibold text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Award className="text-sky-700" />
          <h2 className="mt-4 text-xl font-semibold text-slate-950">
            Conquistas
          </h2>
          <div className="mt-4 space-y-3">
            {["Top 3 da semana", "100 dias de sequência", "Mentora de Biologia"].map(
              (item) => (
                <p
                  key={item}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm font-medium text-slate-700"
                >
                  {item}
                </p>
              ),
            )}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <BookOpen className="text-sky-700" />
          <h2 className="mt-4 text-xl font-semibold text-slate-950">
            Interesses
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Biologia", "Química", "Redação", "Física", "Fuvest"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800"
                >
                  {item}
                </span>
              ),
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
