import Link from "next/link";
import {
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  Heart,
  Medal,
  MapPin,
  MessageSquareText,
  Stethoscope,
  Trophy,
} from "lucide-react";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import type { PublicProfileData } from "@/lib/profile";

type PublicProfileProps = {
  data: PublicProfileData;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function PublicProfile({ data }: PublicProfileProps) {
  const { profile, materials, posts, stats } = data;
  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  return (
    <div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-slate-900 via-sky-900 to-cyan-800" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between">
            <div className="-mt-12">
              <ProfileAvatar
                name={profile.fullName}
                avatarUrl={profile.avatarUrl}
              />
            </div>
            {data.isCurrentUser ? (
              <Link
                href="/configuracoes/perfil"
                className="inline-flex w-fit items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
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

      <div className="mt-6 grid gap-4 md:grid-cols-5">
        <ProfileStat
          icon={Medal}
          label="posição"
          value={
            stats.rankingPosition
              ? `${stats.rankingPosition}o`
              : "sem posição"
          }
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
          icon={Trophy}
          label="reputação"
          value={stats.reputationPoints.toLocaleString("pt-BR")}
        />
        <ProfileStat
          icon={Heart}
          label="curtidas"
          value={stats.likesReceived.toLocaleString("pt-BR")}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Award className="text-sky-700" />
            <h2 className="text-xl font-semibold text-slate-950">
              Badges e conquistas
            </h2>
          </div>
          {profile.badges.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              As conquistas aparecerão aqui conforme a participação no Acerte.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="text-sky-700" />
            <h2 className="text-xl font-semibold text-slate-950">
              Materiais publicados
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            {materials.length > 0 ? (
              materials.map((material) => (
                <Link
                  key={material.id}
                  href={`/biblioteca/${material.id}`}
                  className="block rounded-lg border border-slate-100 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50"
                >
                  <p className="font-semibold text-slate-950">{material.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {material.materialType} · {material.subject} ·{" "}
                    {material.viewsCount.toLocaleString("pt-BR")} visualizações
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Nenhum material aprovado ainda.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquareText className="text-sky-700" />
          <h2 className="text-xl font-semibold text-slate-950">
            Posts recentes
          </h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {posts.length > 0 ? (
            posts.map((post) => (
              <article
                key={post.id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <p className="line-clamp-3 text-sm leading-6 text-slate-700">
                  {post.content}
                </p>
                <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <CalendarDays size={14} />
                  {formatDate(post.createdAt)}
                </p>
                {post.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <p className="text-sm leading-6 text-slate-600">
              Nenhum post publicado ainda.
            </p>
          )}
        </div>
      </section>
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
