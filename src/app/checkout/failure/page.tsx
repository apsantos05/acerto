import Link from "next/link";
import type { Metadata } from "next";
import { XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Pagamento não concluído",
  robots: { index: false, follow: false },
};

export default function CheckoutFailurePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
          <XCircle size={30} />
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
          Pagamento não concluído
        </h1>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
          O pagamento não foi finalizado ou foi recusado. Nenhuma cobrança foi feita.
          Você pode tentar novamente ou usar outro meio de pagamento.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/planos"
            className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Tentar novamente
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
