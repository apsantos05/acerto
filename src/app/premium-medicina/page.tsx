import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  Check,
  Crown,
  GraduationCap,
  PenLine,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Trophy,
} from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { UNIVERSITIES, SITE_NAME, SITE_URL } from "@/lib/catalog";

const PRICE = "R$ 39";
const CHECKOUT_HREF = "/api/checkout/premium-med";

export const metadata: Metadata = {
  title: "Premium Medicina — aprove na faculdade dos seus sonhos",
  description:
    "Acervo completo, simulados oficiais por banca, correção de redação, trilhas por universidade e cronograma personalizado. O plano do AcerteVest feito para quem vai cursar Medicina.",
  alternates: { canonical: "/premium-medicina" },
  openGraph: {
    title: "AcerteVest Premium Medicina",
    description:
      "Acervo completo, simulados oficiais, correção de redação e trilhas por universidade para passar em Medicina.",
    url: `${SITE_URL}/premium-medicina`,
    type: "website",
  },
};

const benefits = [
  {
    icon: BookOpenCheck,
    title: "Acervo completo",
    text: "Apostilas, provas, gabaritos, resumos e revisões das melhores editoras — Bernoulli, Poliedro, Hexag, COC e mais.",
  },
  {
    icon: Trophy,
    title: "Simulados oficiais por banca",
    text: "Treine no formato exato de cada vestibular, com tempo oficial e correção automática no servidor.",
  },
  {
    icon: PenLine,
    title: "Correção de redação",
    text: "Envie sua redação e receba correção no padrão da banca, com o que melhorar para subir a nota.",
  },
  {
    icon: GraduationCap,
    title: "Trilhas por universidade",
    text: "Um caminho de estudo específico para USP, Unicamp, Unesp, Einstein e cada faculdade-alvo.",
  },
  {
    icon: CalendarClock,
    title: "Cronograma personalizado",
    text: "Saiba exatamente o que estudar a cada semana até o dia da prova, do seu jeito.",
  },
  {
    icon: ShieldCheck,
    title: "Prioridade no que importa",
    text: "Os materiais da sua banca aparecem primeiro. Menos tempo procurando, mais tempo estudando.",
  },
];

const libraryFeatures = [
  "Apostilas completas das melhores editoras de Medicina",
  "Provas e gabaritos de todos os anos, por banca",
  "Resumos e mapas mentais para revisão rápida",
  "Favoritos ilimitados e recomendações por matéria",
  "Materiais novos toda semana",
];

const simuladoFeatures = [
  "Simulados no formato oficial de cada vestibular",
  "Cronômetro oficial que sobrevive a recarregar a página",
  "Correção no servidor — gabarito só após finalizar",
  "Desempenho por matéria para focar nos pontos fracos",
];

const testimonials = [
  {
    name: "Marina",
    detail: "Vestibulanda, foco USP",
    text: "Os simulados no formato da Fuvest mudaram meu jogo. Parei de me perder no tempo e comecei a acertar o que antes deixava em branco.",
  },
  {
    name: "Rafael",
    detail: "2º ano de cursinho, foco Unicamp",
    text: "A trilha por universidade me deu direção. Eu sabia exatamente o que estudar para a Comvest em vez de tentar abraçar tudo.",
  },
  {
    name: "Letícia",
    detail: "Foco Einstein e Famerp",
    text: "A correção de redação foi o que mais valeu. Subi de 720 para acima de 900 entendendo o que a banca esperava.",
  },
];

const faqs = [
  {
    q: "O Premium Medicina é para qual vestibular?",
    a: "Para os principais vestibulares de Medicina do Brasil: USP (Fuvest), Unicamp (Comvest), Unesp, UFSC, UFPR, UFMG, Unifesp, Famerp, Albert Einstein, Santa Casa e SLMandic — além do ENEM.",
  },
  {
    q: "Qual a diferença para o plano gratuito?",
    a: "No gratuito você acessa provas e gabaritos públicos e 2 simulados por mês. No Premium Medicina você desbloqueia o acervo completo (apostilas e editoras), simulados ilimitados e oficiais por banca, correção de redação, trilhas por universidade e cronograma personalizado.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. A assinatura é mensal e sem fidelidade — você cancela a qualquer momento direto na sua conta.",
  },
  {
    q: "Os materiais são atualizados?",
    a: "Sim. O acervo cresce toda semana com novas provas, apostilas e simulados, sempre organizados por universidade, matéria e ano.",
  },
  {
    q: "Como funciona a correção de redação?",
    a: "Você envia sua redação pela plataforma e recebe uma correção no padrão da banca escolhida, com a pontuação por competência e o que melhorar para a próxima.",
  },
  {
    q: "Preciso pagar para testar?",
    a: "Não. Você cria sua conta gratuita, conhece a plataforma e só assina o Premium Medicina quando quiser acelerar.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: `${SITE_NAME} Premium Medicina`,
  description:
    "Plano premium com acervo completo, simulados oficiais, correção de redação e trilhas por universidade para vestibulares de Medicina.",
  brand: { "@type": "Brand", name: SITE_NAME },
  offers: {
    "@type": "Offer",
    price: "39.00",
    priceCurrency: "BRL",
    availability: "https://schema.org/InStock",
    url: `${SITE_URL}/premium-medicina`,
  },
};

export default function PremiumMedicinaPage() {
  return (
    <main className="bg-white dark:bg-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Header minimalista */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-950">
              <BookOpenCheck size={20} />
            </span>
            <span className="text-lg font-semibold">{SITE_NAME}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/planos"
              className="hidden text-sm font-medium text-slate-300 transition hover:text-white sm:block"
            >
              Ver planos
            </Link>
            <Link
              href={CHECKOUT_HREF}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Assinar
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950 text-white">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(60%_60%_at_50%_0%,#22d3ee_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm font-medium text-cyan-200">
            <Crown size={15} />
            Premium Medicina
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            Aprove na Medicina dos seus sonhos.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Acervo completo, simulados oficiais por banca, correção de redação e
            uma trilha de estudo feita para a sua universidade-alvo. Tudo em um
            só lugar.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={CHECKOUT_HREF}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-7 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Assinar por {PRICE}/mês
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/biblioteca"
              className="inline-flex items-center justify-center rounded-lg border border-white/20 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Explorar a biblioteca
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Comece grátis · cancele quando quiser
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            {UNIVERSITIES.map((u) => (
              <span
                key={u.slug}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200"
              >
                {u.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
            Tudo que você precisa para passar
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            Pare de juntar PDF solto no WhatsApp. O Premium Medicina reúne o
            material certo, no formato certo, para a sua banca.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400">
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{b.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* UNIVERSIDADES ATENDIDAS */}
      <section className="bg-slate-50 py-20 dark:bg-slate-800/50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
              Universidades atendidas
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              Trilhas e materiais específicos para as principais faculdades de
              Medicina do país.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {UNIVERSITIES.map((u) => (
              <Link
                key={u.slug}
                href={`/universidades/${u.slug}`}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500/40"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-cyan-300">
                    <GraduationCap size={18} />
                  </span>
                  <span className="font-semibold text-slate-950 group-hover:text-sky-800 dark:text-white dark:group-hover:text-sky-400">
                    {u.label}
                  </span>
                </span>
                <ArrowRight size={16} className="text-slate-400 dark:text-slate-500" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BIBLIOTECA PREMIUM */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
              <Sparkles size={15} />
              Biblioteca Premium
            </span>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
              O acervo completo, organizado para você
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Milhares de materiais das melhores editoras, filtrados por
              universidade, vestibular, matéria e ano — sem perder tempo
              procurando.
            </p>
            <ul className="mt-6 space-y-3">
              {libraryFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                  <Check size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={CHECKOUT_HREF}
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Desbloquear o acervo
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-8 dark:border-slate-800 dark:from-sky-950/40 dark:to-cyan-950/40">
            <div className="grid grid-cols-2 gap-4">
              {[
                { k: "Apostilas", v: "editoras top" },
                { k: "Provas", v: "todos os anos" },
                { k: "Resumos", v: "revisão rápida" },
                { k: "Favoritos", v: "ilimitados" },
              ].map((item) => (
                <div
                  key={item.k}
                  className="rounded-xl border border-white bg-white/70 p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <p className="text-lg font-bold text-slate-950 dark:text-white">{item.k}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SIMULADOS */}
      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 grid grid-cols-2 gap-4 lg:order-1">
              {[
                { icon: Trophy, k: "Oficiais", v: "por banca" },
                { icon: Timer, k: "Tempo real", v: "cronômetro oficial" },
                { icon: ShieldCheck, k: "Correção", v: "no servidor" },
                { icon: Star, k: "Desempenho", v: "por matéria" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.k}
                    className="rounded-xl border border-white/10 bg-white/5 p-5"
                  >
                    <Icon size={22} className="text-cyan-300" />
                    <p className="mt-3 text-lg font-bold">{item.k}</p>
                    <p className="text-sm text-slate-400">{item.v}</p>
                  </div>
                );
              })}
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-cyan-200">
                <Trophy size={15} />
                Simulados
              </span>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
                Treine no formato exato da sua prova
              </h2>
              <p className="mt-3 text-slate-300">
                Simulados oficiais por banca, com tempo real e correção
                automática. Veja seu desempenho por matéria e ataque os pontos
                fracos antes do vestibular.
              </p>
              <ul className="mt-6 space-y-3">
                {simuladoFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-slate-200">
                    <Check size={18} className="mt-0.5 shrink-0 text-cyan-300" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/simulados"
                className="mt-7 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Ver simulados
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
            Quem estuda com o AcerteVest
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            A comunidade que estuda junto para passar junto.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <Quote size={24} className="text-sky-300" />
              <blockquote className="mt-3 flex-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                {t.text}
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 font-semibold text-cyan-300">
                  {t.name[0]}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-950 dark:text-white">
                    {t.name}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{t.detail}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-20 dark:bg-slate-800/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
              Perguntas frequentes
            </h2>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm [&_summary::-webkit-details-marker]:hidden dark:border-slate-800 dark:bg-slate-900"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-slate-950 dark:text-white">
                  {f.q}
                  <span className="text-sky-700 transition group-open:rotate-45 dark:text-sky-400">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-gradient-to-r from-slate-950 via-sky-950 to-slate-950 py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Sua aprovação em Medicina começa hoje
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Junte-se aos vestibulandos que trocaram o caos de PDFs soltos por um
            plano de estudo de verdade.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={CHECKOUT_HREF}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Assinar Premium Medicina · {PRICE}/mês
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/planos"
              className="inline-flex items-center justify-center rounded-lg border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Comparar planos
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Pagamento online em breve · preço de lançamento
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
