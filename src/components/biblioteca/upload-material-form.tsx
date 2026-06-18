"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CheckCircle2, LinkIcon, UploadCloud } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { materialTypes } from "@/lib/material-options";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const maxFileSize = 10 * 1024 * 1024;

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function buildStoragePath(userId: string, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "file";
  const basename = file.name.replace(/\.[^/.]+$/, "");
  const safeBasename =
    basename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "material";

  return `${userId}/${crypto.randomUUID()}-${safeBasename}.${extension}`;
}

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function validateExternalUrl(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Use um link começando com http:// ou https://.");
  }

  return url.toString();
}

async function findOrCreateLookup(
  supabase: ReturnType<typeof useAuth>["supabase"],
  table: "vestibulares" | "faculties",
  name: string,
) {
  if (!supabase) {
    throw new Error("Cliente Supabase indisponivel.");
  }

  const { data: existing, error: selectError } = await supabase
    .from(table)
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existing?.id) {
    return existing.id as string;
  }

  const { data: created, error: insertError } = await supabase
    .from(table)
    .insert({ name })
    .select("id")
    .single();

  if (!insertError && created?.id) {
    return created.id as string;
  }

  if (insertError?.code === "23505") {
    const { data: duplicate, error: duplicateError } = await supabase
      .from(table)
      .select("id")
      .eq("name", name)
      .single();

    if (duplicateError) {
      throw duplicateError;
    }

    return duplicate.id as string;
  }

  throw insertError ?? new Error("Nao foi possivel preparar os filtros.");
}

export function UploadMaterialForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { supabase, user, isLoading, error: authError } = useAuth();
  const [uploadKind, setUploadKind] = useState<"file" | "link">("file");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdMaterialId, setCreatedMaterialId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCreatedMaterialId("");

    if (!supabase || !user) {
      setError("Entre na sua conta para enviar materiais.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = readText(formData, "title");
    const description = readText(formData, "description");
    const vestibular = readText(formData, "vestibular");
    const faculdade = readText(formData, "faculdade");
    const year = Number(readText(formData, "year"));
    const subject = readText(formData, "subject");
    const materialType = readText(formData, "materialType");
    const tags = parseTags(readText(formData, "tags"));

    if (!title || !description || !vestibular || !faculdade || !subject) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!Number.isInteger(year) || year < 1990 || year > 2035) {
      setError("Informe um ano válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      let fileUrl: string | null = null;
      let externalUrl: string | null = null;
      let storagePath: string | null = null;

      if (uploadKind === "file") {
        const file = formData.get("file");

        if (!(file instanceof File) || file.size === 0) {
          throw new Error("Selecione um PDF ou imagem.");
        }

        if (!allowedMimeTypes.includes(file.type)) {
          throw new Error("Envie apenas PDF, JPG, PNG ou WebP.");
        }

        if (file.size > maxFileSize) {
          throw new Error("O arquivo deve ter até 10 MB.");
        }

        storagePath = buildStoragePath(user.id, file);
        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("materials")
          .getPublicUrl(storagePath);

        fileUrl = data.publicUrl;
      } else {
        externalUrl = validateExternalUrl(readText(formData, "externalUrl"));
      }

      const [vestibularId, facultyId] = await Promise.all([
        findOrCreateLookup(supabase, "vestibulares", vestibular),
        findOrCreateLookup(supabase, "faculties", faculdade),
      ]);

      const { data, error: insertError } = await supabase
        .from("materials")
        .insert({
          owner_id: user.id,
          vestibular_id: vestibularId,
          faculty_id: facultyId,
          title,
          description,
          vestibular,
          faculdade,
          year,
          subject,
          material_type: materialType,
          file_url: fileUrl,
          external_url: externalUrl,
          storage_path: storagePath,
          upload_kind: uploadKind,
          tags,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      setSuccess("Material enviado com sucesso e pendente de aprovação.");
      setCreatedMaterialId(data?.id ?? "");
      formRef.current?.reset();
      setUploadKind("file");
    } catch (submitError) {
      // Loga o erro real do Supabase (message/details/hint/code) para diagnóstico
      // e mostra ao usuário a causa concreta em vez de uma mensagem genérica.
      console.error("[upload-material] falha ao enviar material:", submitError);
      setError(
        getSupabaseErrorMessage(
          submitError,
          "Não foi possível enviar o material.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user && !isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          Login necessário
        </h2>
        <p className="mt-2 text-slate-600">
          Entre na sua conta para enviar materiais para aprovação.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Título</span>
          <input
            name="title"
            required
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Descrição</span>
          <textarea
            name="description"
            required
            rows={4}
            className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Vestibular</span>
          <input
            name="vestibular"
            required
            placeholder="Fuvest, ENEM, Unicamp"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Faculdade</span>
          <input
            name="faculdade"
            required
            placeholder="USP, Unicamp, Sisu Medicina"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Ano</span>
          <input
            name="year"
            required
            type="number"
            min={1990}
            max={2035}
            defaultValue={new Date().getFullYear()}
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Matéria</span>
          <input
            name="subject"
            required
            placeholder="Biologia, Química, Redação"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Tipo de material
          </span>
          <select
            name="materialType"
            required
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          >
            {materialTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Tags</span>
          <input
            name="tags"
            placeholder="biologia, fuvest, revisão"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setUploadKind("file")}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
              uploadKind === "file"
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            <UploadCloud size={18} />
            Arquivo
          </button>
          <button
            type="button"
            onClick={() => setUploadKind("link")}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
              uploadKind === "link"
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            <LinkIcon size={18} />
            Link externo
          </button>
        </div>

        {uploadKind === "file" ? (
          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">
              PDF ou imagem
            </span>
            <input
              name="file"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="mt-2 w-full rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cyan-800"
            />
          </label>
        ) : (
          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">
              Link externo
            </span>
            <input
              name="externalUrl"
              type="url"
              placeholder="https://..."
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </label>
        )}
      </div>

      {authError ? (
        <p className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {authError}
        </p>
      ) : null}
      {error ? (
        <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <div className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 size={17} />
            {success}
          </p>
          {createdMaterialId ? (
            <Link
              href="/meus-materiais"
              className="mt-2 inline-flex font-semibold text-emerald-800"
            >
              Ver meus materiais
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/meus-materiais"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Meus materiais
        </Link>
        <button
          disabled={isSubmitting || isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <UploadCloud size={18} />
          {isSubmitting ? "Enviando..." : "Enviar para aprovação"}
        </button>
      </div>
    </form>
  );
}
