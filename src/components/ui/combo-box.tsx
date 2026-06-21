"use client";

import { useId } from "react";

type ComboBoxProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
};

// Select com busca: input + datalist (autocomplete nativo, acessível, sem dep).
// Permite digitar um valor novo que não esteja na lista (útil na moderação).
export function ComboBox({
  label,
  value,
  onChange,
  options,
  placeholder,
}: ComboBoxProps) {
  const listId = useId();

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <input
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-950 dark:text-slate-100 dark:placeholder-slate-500 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-500/30"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}
