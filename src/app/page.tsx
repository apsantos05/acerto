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
import { getHomeMedicinaStats } from "@/lib/home-medicina-stats";

export const revalidate = 300;

export default async function Home() {
  const homeStats = await getHomeMedicinaStats();

  return (
    <main className="min-h-screen bg-[#f7fbff] dark:bg-slate-950">
      <Navbar />

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-20">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-800 shadow-sm dark:border-sky-500/30 dark:bg-slate-900 dark:text-sky-400">
            <Sparkles size={16} />
            Comunidade focada em Medicina
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            Acerte sua preparação com materiais de quem está na mesma jornada.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Uma plataforma para vestibulandos organizarem provas, simulados,
            resumos, rankings e discussões em um único lugar.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Começar agora
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/biblioteca"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-sky-300 hover:text-sky-800 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-sky-500/40 dark:hover:text-sky-400"
            >
              Ver biblioteca
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-sky-950/10 dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-sky-200">Simulado em destaque</p>
                <h2 className="mt-1 text-2xl font-semibold">Medicina 2027</h2>
              </div>
              <Trophy className="text-cyan-300" size={30} />
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {homeStats.metrics.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-white/10 p-3">
                  <p className="text-xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {homeStats.recentMaterials.length > 0 ? (
              homeStats.recentMaterials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-cyan-100 p-2 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-950 dark:text-white">
                        {material.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {material.subject}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {material.materialType}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="font-medium text-slate-950 dark:text-white">
                  Nenhum material aprovado ainda
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Os materiais recentes aparecerão aqui quando forem publicados.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-6 shadow-sm sm:flex-row sm:items-center lg:p-8 dark:border-sky-500/30 dark:from-sky-950/40 dark:to-cyan-950/40">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
              <Sparkles size={14} /> Gratuito · 2 minutos
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              Faça seu Diagnóstico de Aprovação
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-300">
              Descubra seu nível de preparação para Medicina e receba uma trilha
              personalizada para a sua universidade-alvo.
            </p>
          </div>
          <Link
            href="/diagnostico"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Começar diagnóstico
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {homeStats.metrics.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-sky-700 dark:text-sky-400">
            Tudo no mesmo fluxo
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
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
