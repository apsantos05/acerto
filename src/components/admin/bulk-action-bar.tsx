"use client";

import { useId, useState } from "react";
import { Check, Loader2, Trash2, X } from "lucide-react";
import type { AdminFacets } from "@/lib/admin";

export type BulkField = "faculdade" | "subject" | "vestibular" | "status";

type BulkActionBarProps = {
  count: number;
  facets: AdminFacets;
  working: boolean;
  onClear: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onApplyField: (field: BulkField, value: string) => void;
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
];

const controlClass =
  "rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

export function BulkActionBar({
  count,
  facets,
  working,
  onClear,
  onApprove,
  onReject,
  onDelete,
  onApplyField,
}: BulkActionBarProps) {
  const [field, setField] = useState<BulkField>("faculdade");
  const [value, setValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const listId = useId();

  const comboOptions =
    field === "faculdade"
      ? facets.faculdades
      : field === "subject"
        ? facets.subjects
        : field === "vestibular"
          ? facets.vestibulares
          : [];

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-3">
        <span className="text-sm font-semibold text-slate-900">
          {count} selecionado{count === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          Limpar
        </button>

        <span className="hidden h-6 w-px bg-slate-200 sm:block" />

        <button
          type="button"
          onClick={onApprove}
          disabled={working}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          <Check size={16} />
          Aprovar
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={working}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
        >
          <X size={16} />
          Rejeitar
        </button>

        <span className="hidden h-6 w-px bg-slate-200 sm:block" />

        {/* Alterar campo em massa */}
        <select
          value={field}
          onChange={(event) => {
            setField(event.target.value as BulkField);
            setValue("");
          }}
          className={controlClass}
          aria-label="Campo para alterar"
        >
          <option value="faculdade">Faculdade</option>
          <option value="subject">Matéria</option>
          <option value="vestibular">Vestibular</option>
          <option value="status">Status</option>
        </select>

        {field === "status" ? (
          <select
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className={controlClass}
            aria-label="Novo status"
          >
            <option value="">Escolher…</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              list={listId}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Novo valor"
              className={`${controlClass} w-44`}
              aria-label="Novo valor"
            />
            <datalist id={listId}>
              {comboOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </>
        )}

        <button
          type="button"
          disabled={working || !value.trim()}
          onClick={() => onApplyField(field, value.trim())}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          Aplicar
        </button>

        <span className="hidden h-6 w-px bg-slate-200 sm:block" />

        {confirmDelete ? (
          <span className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={working}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              <Trash2 size={16} />
              Confirmar exclusão
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={working}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
          >
            <Trash2 size={16} />
            Excluir
          </button>
        )}

        {working ? (
          <Loader2 size={18} className="animate-spin text-slate-500" />
        ) : null}
      </div>
    </div>
  );
}
