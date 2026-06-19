"use client";

import { useState } from "react";
import { ExternalLink, FileText, Loader2, Save, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { ComboBox } from "@/components/ui/combo-box";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import { materialTypes } from "@/lib/material-options";
import type {
  AdminFacets,
  AdminMaterial,
  AdminMaterialStatus,
} from "@/lib/admin";

type MaterialEditModalProps = {
  material: AdminMaterial;
  facets: AdminFacets;
  onClose: () => void;
  onSaved: (updated: AdminMaterial) => void;
  onApproveSaved: (updated: AdminMaterial) => void;
};

const difficultyOptions = ["", "fácil", "média", "difícil"];
const priorityOptions = ["normal", "alta"];
const statusOptions: AdminMaterialStatus[] = ["pending", "approved", "rejected"];

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

export function MaterialEditModal({
  material,
  facets,
  onClose,
  onSaved,
  onApproveSaved,
}: MaterialEditModalProps) {
  const { supabase, user } = useAuth();
  const toast = useToast();

  const [title, setTitle] = useState(material.title);
  const [description, setDescription] = useState(material.description);
  const [summary, setSummary] = useState(material.summary);
  const [subject, setSubject] = useState(material.subject);
  const [faculdade, setFaculdade] = useState(material.faculdade);
  const [vestibular, setVestibular] = useState(material.vestibular);
  const [materialType, setMaterialType] = useState(material.materialType);
  const [difficulty, setDifficulty] = useState(material.difficulty);
  const [priority, setPriority] = useState(material.priority);
  const [editora, setEditora] = useState(material.editora);
  const [year, setYear] = useState(material.year ? String(material.year) : "");
  const [keywords, setKeywords] = useState(material.keywords.join(", "));
  const [slug, setSlug] = useState(material.slug);
  const [status, setStatus] = useState<AdminMaterialStatus>(material.status);
  const [saving, setSaving] = useState<null | "save" | "approve">(null);

  const fileHref = material.externalUrl ?? material.fileUrl;
  const fileName = material.storagePath
    ? material.storagePath.split("/").pop()
    : material.uploadKind === "link"
      ? "Link externo"
      : "Arquivo";

  async function save(approve: boolean) {
    if (!supabase || !user) {
      toast("Sessão expirada. Entre novamente.", "error");
      return;
    }
    if (!title.trim()) {
      toast("O título é obrigatório.", "error");
      return;
    }

    setSaving(approve ? "approve" : "save");

    const nextStatus: AdminMaterialStatus = approve ? "approved" : status;
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      summary: summary.trim() || null,
      subject: subject.trim() || null,
      faculdade: faculdade.trim() || null,
      vestibular: vestibular.trim() || null,
      material_type: materialType,
      difficulty: difficulty || null,
      priority: priority === "alta" ? "alta" : "normal",
      editora: editora.trim() || null,
      year: year ? Number(year) : null,
      keywords: keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      slug: slug.trim() || null,
      status: nextStatus,
      updated_by: user.id,
    };

    try {
      const { error } = await supabase
        .from("materials")
        .update(payload)
        .eq("id", material.id);
      if (error) {
        throw error;
      }

      const updated: AdminMaterial = {
        ...material,
        title: payload.title,
        description: payload.description ?? "",
        summary: payload.summary ?? "",
        subject: payload.subject ?? "",
        faculdade: payload.faculdade ?? "",
        vestibular: payload.vestibular ?? "",
        materialType: payload.material_type,
        difficulty: payload.difficulty ?? "",
        priority: payload.priority,
        editora: payload.editora ?? "",
        year: payload.year,
        keywords: payload.keywords,
        slug: payload.slug ?? "",
        status: nextStatus,
      };

      toast(approve ? "Material aprovado e salvo." : "Material atualizado.", "success");
      if (approve) {
        onApproveSaved(updated);
      } else {
        onSaved(updated);
      }
    } catch (saveError) {
      console.error("[admin] falha ao salvar material:", saveError);
      toast(
        getSupabaseErrorMessage(saveError, "Não foi possível salvar o material."),
        "error",
      );
      setSaving(null);
    }
  }

  const busy = saving !== null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-950/40"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Editar material</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-60"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Preview do arquivo (não altera o arquivo físico) */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileText size={16} className="text-sky-700" />
              {fileName}
            </div>
            {fileHref ? (
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="truncate text-xs text-slate-500" title={fileHref}>
                  {fileHref}
                </span>
                <a
                  href={fileHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-50"
                >
                  <ExternalLink size={14} />
                  Abrir PDF
                </a>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Sem arquivo vinculado.</p>
            )}
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Título</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Descrição</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Resumo (IA)</span>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <ComboBox
                label="Matéria"
                value={subject}
                onChange={setSubject}
                options={facets.subjects}
                placeholder="Buscar matéria"
              />
              <ComboBox
                label="Faculdade"
                value={faculdade}
                onChange={setFaculdade}
                options={facets.faculdades}
                placeholder="Buscar faculdade"
              />
              <ComboBox
                label="Vestibular"
                value={vestibular}
                onChange={setVestibular}
                options={facets.vestibulares}
                placeholder="Buscar vestibular"
              />
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Tipo</span>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className={inputClass}
                >
                  {/* mantém o valor atual mesmo se fora da lista padrão */}
                  {!materialTypes.includes(materialType as (typeof materialTypes)[number]) ? (
                    <option value={materialType}>{materialType}</option>
                  ) : null}
                  {materialTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Dificuldade</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={inputClass}
                >
                  {difficultyOptions.map((d) => (
                    <option key={d || "none"} value={d}>
                      {d ? d : "—"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Prioridade</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={inputClass}
                >
                  {priorityOptions.map((p) => (
                    <option key={p} value={p}>
                      {p === "alta" ? "Alta" : "Normal"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Editora</span>
                <input value={editora} onChange={(e) => setEditora(e.target.value)} className={inputClass} />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Ano</span>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AdminMaterialStatus)}
                  className={inputClass}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s === "pending" ? "Pendente" : s === "approved" ? "Aprovado" : "Rejeitado"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Palavras-chave (separadas por vírgula)
              </span>
              <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputClass} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Slug</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => save(false)}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {saving === "save" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving === "approve" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShieldCheck size={16} />
            )}
            Aprovar e salvar
          </button>
        </div>
      </div>
    </div>
  );
}
