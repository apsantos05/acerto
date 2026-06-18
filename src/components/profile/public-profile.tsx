import Link from "next/link";
import {
  Building2,
  BookOpen,
  Flame,
  Heart,
  Medal,
  MapPin,
  MessageSquareText,
  PencilLine,
  Stethoscope,
  Trophy,
} from "lucide-react";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import type { PublicProfileData } from "@/lib/profile";

type PublicProfileProps = {
  data: PublicProfileData;
};

export function PublicProfile({ data }: PublicProfileProps) {
  const { profile, materials, posts, stats } = data;
  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  return (
    <div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Capa: imagem do usuário ou gradiente de fallback */}
        <div className="relative h-40 sm:h-48">
          {profile.coverUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${profile.coverUrl})` }}
              aria-label={`Capa de ${profile.fullName}`}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-sky-900 to-cyan-800" />
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Avatar sobreposto à capa; nome fica em bloco separado abaixo */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="-mt-14 sm:-mt-16">
              <ProfileAvatar
                name={profile.fullName}
                avatarUrl={profile.avatarUrl}
              />
            </div>
            {data.isCurrentUser ? (
              <Link
                href="/configuracoes/perfil"
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <PencilLine size={16} />
                Editar perfil
              </Link>
            ) : null}
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              {profile.fullName}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              @{profile.username}
            </p>
          </div>

          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            {profile.bio}
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 font-semibold text-cyan-800">
              <Stethoscope size={16} />
              Objetivo: {profile.objective}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              <Building2 size={16} />
              {profile.dreamFaculty}
            </span>
            {profile.streakDays > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-700">
                <Flame size={16} />
                {profile.streakDays}{" "}
                {profile.streakDays === 1 ? "dia de sequência" : "dias de sequência"}
              </span>
            ) : null}
            {location ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                <MapPin size={16} />
                {location}
              </span>
            ) : null}
          </div>

          {profile.targetExams.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.targetExams.map((exam) => (
                <span
                  key={exam}
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700"
                >
                  {exam}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <ProfileStat
          icon={Medal}
          label="posição"
          value={stats.rankingPosition ? `#${stats.rankingPosition}` : "—"}
        />
        <ProfileStat
          icon={BookOpen}
          label="materiais"
          value={stats.materialsPublished.toLocaleString("pt-BR")}
        />
        <ProfileStat
          icon={MessageSquareText}
          label="posts"
          value={stats.postsCreated.toLocaleString("pt-BR")}
        />
        <ProfileStat
          icon={MessageSquareText}
          label="comentários"
          value={stats.commentsMade.toLocaleString("pt-BR")}
        />
        <ProfileStat
          icon={Trophy}
          label="simulados"
          value={stats.simuladosCompleted.toLocaleString("pt-BR")}
        />
        <ProfileStat
          icon={Heart}
          label="curtidas"
          value={stats.likesReceived.toLocaleString("pt-BR")}
        />
        <ProfileStat
          icon={Trophy}
          label="reputação"
          value={stats.reputationPoints.toLocaleString("pt-BR")}
        />
      </div>

      <ProfileTabs
        materials={materials}
        posts={posts}
        achievements={data.achievements}
        earnedBadges={data.earnedBadges}
        activity={data.activity}
        isCurrentUser={data.isCurrentUser}
      />
    </div>
  );
}

function ProfileStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon size={20} className="text-sky-700" />
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
