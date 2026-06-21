import Link from "next/link";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Pagamento pendente",
  robots: { index: false, follow: false },
};

export default function CheckoutPendingPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <Clock size={30} />
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
          Pagamento pendente
        </h1>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
          Seu pagamento está sendo processado (ex.: boleto ou Pix aguardando
          compensação). Assim que o Mercado Pago confirmar, seu plano é liberado
          automaticamente.
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
