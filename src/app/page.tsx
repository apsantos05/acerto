import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { FeatureCard } from "@/components/ui/feature-card";
import { StatCard } from "@/components/ui/stat-card";
import { materials, stats } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7fbff]">
      <Navbar />

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-20">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-800 shadow-sm">
            <Sparkles size={16} />
            Comunidade focada em Medicina
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Acerte sua preparação com materiais de quem está na mesma jornada.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Uma plataforma para vestibulandos organizarem provas, simulados,
            resumos, rankings e discussões em um único lugar.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Começar agora
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/biblioteca"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-sky-300 hover:text-sky-800"
            >
              Ver biblioteca
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-sky-950/10">
          <div className="rounded-xl bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-sky-200">Simulado em destaque</p>
                <h2 className="mt-1 text-2xl font-semibold">Medicina 2027</h2>
              </div>
              <Trophy className="text-cyan-300" size={30} />
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {stats.slice(0, 3).map((stat) => (
                <div key={stat.label} className="rounded-lg bg-white/10 p-3">
                  <p className="text-xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {materials.slice(0, 3).map((material) => (
              <div
                key={material.title}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-100 p-2 text-cyan-800">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-950">
                      {material.title}
                    </p>
                    <p className="text-sm text-slate-500">{material.subject}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-600">
                  {material.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-sky-700">
            Tudo no mesmo fluxo
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">
            Estudo colaborativo, organizado e mensurável.
          </h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={BookOpen}
            title="Biblioteca inteligente"
            description="Centralize provas, listas, resumos e simulados por matéria, banca e vestibular."
          />
          <FeatureCard
            icon={Users}
            title="Feed de comunidade"
            description="Compartilhe achados, tire dúvidas e acompanhe materiais recomendados por outros estudantes."
          />
          <FeatureCard
            icon={GraduationCap}
            title="Evolução visível"
            description="Acompanhe pontuação, contribuições, ranking e metas semanais em um dashboard simples."
          />
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-12 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold">
              Pronto para organizar seus estudos?
            </h2>
            <p className="mt-2 max-w-2xl text-slate-300">
              Crie uma conta, salve materiais e acompanhe sua preparação para
              Medicina com mais clareza.
            </p>
          </div>
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Criar conta
            <CheckCircle2 size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
