"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Save, UploadCloud } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import type { StudentProfile } from "@/lib/profile";

const avatarMimeTypes = ["image/jpeg", "image/png", "image/webp"];
const maxAvatarSize = 5 * 1024 * 1024;

type EditProfileFormProps = {
  profile: StudentProfile;
};

function slugifyUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function EditProfileForm({ profile }: EditProfileFormProps) {
  const router = useRouter();
  const { supabase, user } = useAuth();
  const [fullName, setFullName] = useState(profile.fullName);
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(profile.coverUrl ?? "");
  const [bio, setBio] = useState(profile.bio);
  const [dreamFaculty, setDreamFaculty] = useState(profile.dreamFaculty);
  const [targetExams, setTargetExams] = useState(profile.targetExams.join(", "));
  const [city, setCity] = useState(profile.city);
  const [state, setState] = useState(profile.state);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite reenviar o mesmo arquivo
    setError("");
    setSuccess("");

    if (!file) {
      return;
    }

    if (!supabase || !user) {
      setError("Entre para enviar uma foto.");
      return;
    }

    if (!avatarMimeTypes.includes(file.type)) {
      setError("Envie uma imagem JPG, PNG ou WebP.");
      return;
    }

    if (file.size > maxAvatarSize) {
      setError("A imagem deve ter até 5 MB.");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      setSuccess("Foto carregada. Clique em Salvar perfil para confirmar.");
    } catch (uploadError) {
      console.error("[perfil] falha no upload do avatar:", uploadError);
      setError(
        getSupabaseErrorMessage(
          uploadError,
          "Não foi possível enviar a foto.",
        ),
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleCoverChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite reenviar o mesmo arquivo
    setError("");
    setSuccess("");

    if (!file) {
      return;
    }

    if (!supabase || !user) {
      setError("Entre para enviar uma capa.");
      return;
    }

    if (!avatarMimeTypes.includes(file.type)) {
      setError("Envie uma imagem JPG, PNG ou WebP.");
      return;
    }

    if (file.size > maxAvatarSize) {
      setError("A imagem deve ter até 5 MB.");
      return;
    }

    setIsUploadingCover(true);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/cover-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setCoverUrl(data.publicUrl);
      setSuccess("Capa carregada. Clique em Salvar perfil para confirmar.");
    } catch (uploadError) {
      console.error("[perfil] falha no upload da capa:", uploadError);
      setError(
        getSupabaseErrorMessage(uploadError, "Não foi possível enviar a capa."),
      );
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!supabase || !user) {
      setError("Entre para editar seu perfil.");
      return;
    }

    const normalizedUsername = slugifyUsername(username);

    if (!normalizedUsername || normalizedUsername.length < 3) {
      setError("Escolha um username com pelo menos 3 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: normalizedUsername,
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim() || null,
          cover_url: coverUrl.trim() || null,
          bio: bio.trim(),
          objective: "Medicina",
          dream_faculty: dreamFaculty.trim(),
          target_exams: parseList(targetExams),
          city: city.trim(),
          state: state.trim().toUpperCase(),
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Sincroniza nome/foto no metadata do usuário para a navbar refletir
      // sem precisar consultar a tabela profiles a cada página.
      await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim() || null,
        },
      });

      setUsername(normalizedUsername);
      setSuccess("Perfil atualizado.");
      router.refresh();
    } catch (submitError) {
      console.error("[perfil] falha ao salvar perfil:", submitError);
      setError(
        getSupabaseErrorMessage(
          submitError,
          "Não foi possível salvar o perfil.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-slate-950">Dados públicos</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Essas informações aparecem em `/perfil/{username || "username"}`.
      </p>

      {/* Preview do cabeçalho: capa + avatar sobreposto, como no perfil público */}
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <div className="relative h-28 sm:h-32">
          {coverUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${coverUrl})` }}
              aria-label="Pré-visualização da capa"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-sky-900 to-cyan-800" />
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover}
            className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ImagePlus size={14} />
            {isUploadingCover ? "Enviando..." : "Enviar capa"}
          </button>
        </div>
        <div className="px-4 pb-4">
          <div className="-mt-10">
            <ProfileAvatar name={fullName} avatarUrl={avatarUrl} size="md" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={isUploadingAvatar}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <UploadCloud size={16} />
          {isUploadingAvatar ? "Enviando..." : "Enviar foto"}
        </button>
        <span className="text-xs text-slate-500">JPG, PNG ou WebP até 5 MB</span>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Nome</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            URL da foto (opcional)
          </span>
          <input
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://... ou use o botão Enviar foto"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Bio</span>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Objetivo
          </span>
          <input
            value="Medicina"
            disabled
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Faculdade dos sonhos
          </span>
          <input
            value={dreamFaculty}
            onChange={(event) => setDreamFaculty(event.target.value)}
            placeholder="USP, Unicamp, UFMG..."
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Vestibulares que está prestando
          </span>
          <input
            value={targetExams}
            onChange={(event) => setTargetExams(event.target.value)}
            placeholder="Fuvest, ENEM, Unicamp"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Cidade</span>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Estado</span>
          <input
            value={state}
            onChange={(event) => setState(event.target.value)}
            maxLength={2}
            placeholder="SP"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>
      </div>

      <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Suas conquistas e badges são concedidos automaticamente conforme sua
        participação no Acerte — materiais, posts, simulados, reputação e
        sequência de estudos.
      </p>

      {error ? (
        <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/perfil/${username || profile.username}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Ver perfil público
        </Link>
        <button
          disabled={isSubmitting || isUploadingAvatar}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save size={18} />
          {isSubmitting ? "Salvando..." : "Salvar perfil"}
        </button>
      </div>
    </form>
  );
}
