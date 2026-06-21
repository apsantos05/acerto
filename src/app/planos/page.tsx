import Link from "next/link";
import type { Metadata } from "next";
import { Check, Crown, GraduationCap, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Planos — Gratuito, Premium e Premium Medicina",
  description:
    "Comece de graça e evolua para o Premium Medicina: trilhas por universidade, simulados oficiais, correção de redação e cronograma personalizado.",
  alternates: { canonical: "/planos" },
};

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  icon: typeof Check;
  highlight?: boolean;
  features: string[];
  cta: string;
  href: string;
};

const plans: Plan[] = [
  {
    id: "free",
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    tagline: "Tudo que você precisa para começar a estudar.",
    icon: Sparkles,
    features: [
      "Biblioteca pública: provas e gabaritos",
      "Feed da comunidade, ranking e perfil",
      "2 simulados por mês",
      "Até 20 materiais favoritos",
      "Envie materiais e ganhe reputação",
    ],
    cta: "Começar grátis",
    href: "/cadastro",
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 19",
    period: "/mês",
    tagline: "O acervo completo e a experiência sem limites.",
    icon: Crown,
    highlight: true,
    features: [
      "Tudo do Gratuito",
      "Acervo completo: apostilas e materiais das melhores editoras",
      "Simulados ilimitados + correção no servidor",
      "Favoritos ilimitados e recomendações por matéria",
      "Estatísticas avançadas no dashboard",
      "Sem anúncios",
    ],
    cta: "Assinar Premium",
    href: "/cadastro?plano=premium",
  },
  {
    id: "premium_med",
    name: "Premium Medicina",
    price: "R$ 39",
    period: "/mês",
    tagline: "Foco total na sua aprovação em Medicina.",
    icon: GraduationCap,
    features: [
      "Tudo do Premium",
      "Trilhas por universidade (USP, Unicamp, Unesp, Einstein...)",
      "Simulados oficiais por banca",
      "Correção de redação",
      "Cronograma de estudos personalizado",
      "Prioridade nos materiais da sua universidade-alvo",
    ],
    cta: "Assinar Premium Medicina",
    href: "/cadastro?plano=premium_med",
  },
];

export default function PlanosPage() {
  return (
    <AppShell>
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">
          Planos
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
          Estude de graça. Passe mais rápido no Premium.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
          Comece sem pagar nada. Quando quiser acelerar, o Premium Medicina te dá
          o acervo completo, simulados oficiais e correção de redação focados na
          sua universidade.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900 ${
                plan.highlight
                  ? "border-sky-300 ring-2 ring-sky-200 dark:ring-sky-500/30"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {plan.highlight ? (
                <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
                  Mais popular
                </span>
              ) : null}
              <div className="flex items-center gap-2 text-slate-950 dark:text-white">
                <Icon size={20} className="text-sky-700 dark:text-sky-400" />
                <h2 className="text-lg font-semibold">{plan.name}</h2>
              </div>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-bold text-slate-950 dark:text-white">
                  {plan.price}
                </span>
                <span className="pb-1 text-sm text-slate-500 dark:text-slate-400">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {plan.tagline}
              </p>

              <ul className="mt-5 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-6 inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    : "border border-slate-200 text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        Pagamento online em breve. Os preços são iniciais e podem mudar no
        lançamento.
      </p>
    </AppShell>
  );
}
