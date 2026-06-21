import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Assinatura confirmada",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <CheckCircle2 size={30} />
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
          Pagamento em processamento
        </h1>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
          Recebemos sua assinatura! A confirmação do Mercado Pago pode levar alguns
          instantes. Assim que aprovada, seu plano é liberado automaticamente — basta
          recarregar a página.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Ir para o dashboard
          </Link>
          <Link
            href="/planos"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Ver planos
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
