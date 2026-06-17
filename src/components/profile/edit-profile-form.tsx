"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import type { StudentProfile } from "@/lib/profile";

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
  const [bio, setBio] = useState(profile.bio);
  const [dreamFaculty, setDreamFaculty] = useState(profile.dreamFaculty);
  const [targetExams, setTargetExams] = useState(profile.targetExams.join(", "));
  const [city, setCity] = useState(profile.city);
  const [state, setState] = useState(profile.state);
  const [badges, setBadges] = useState(profile.badges.join(", "));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          bio: bio.trim(),
          objective: "Medicina",
          dream_faculty: dreamFaculty.trim(),
          target_exams: parseList(targetExams),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          badges: parseList(badges),
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setUsername(normalizedUsername);
      setSuccess("Perfil atualizado.");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível salvar o perfil.",
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
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <ProfileAvatar name={fullName} avatarUrl={avatarUrl} />
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Dados públicos
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Essas informações aparecem em `/perfil/{username || "username"}`.
          </p>
        </div>
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
            URL da foto
          </span>
          <input
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://..."
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

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Badges/conquistas
          </span>
          <input
            value={badges}
            onChange={(event) => setBadges(event.target.value)}
            placeholder="Top 10 da semana, 30 dias de sequência"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>
      </div>

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
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save size={18} />
          {isSubmitting ? "Salvando..." : "Salvar perfil"}
        </button>
      </div>
    </form>
  );
}
