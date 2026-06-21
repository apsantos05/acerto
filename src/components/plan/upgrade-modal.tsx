"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Lock, X } from "lucide-react";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
};

const DEFAULT_TITLE = "Recurso Premium";
const DEFAULT_MESSAGE =
  "Este recurso faz parte do plano Premium. Assine para liberar o acervo completo, simulados ilimitados e favoritos sem limite.";

/** Modal de upgrade. O botão principal leva para /planos. */
export function UpgradeModal({
  open,
  onClose,
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
}: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            <Crown size={22} />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {message}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/planos"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <Crown size={16} />
            Ver planos
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

type UpgradeButtonProps = {
  label: string;
  title?: string;
  message?: string;
  className?: string;
  withLockIcon?: boolean;
};

/** Botão que, ao ser clicado, abre o modal de upgrade. Para recursos bloqueados. */
export function UpgradeButton({
  label,
  title,
  message,
  className,
  withLockIcon = true,
}: UpgradeButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        }
      >
        {withLockIcon ? <Lock size={16} /> : null}
        {label}
      </button>
      <UpgradeModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        message={message}
      />
    </>
  );
}
