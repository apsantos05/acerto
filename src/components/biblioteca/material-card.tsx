import Link from "next/link";
import {
  CalendarDays,
  Eye,
  FileText,
  GraduationCap,
  School,
  Star,
} from "lucide-react";
import type { LibraryMaterial } from "@/lib/materials";
import { LikeMaterialButton } from "@/components/biblioteca/like-material-button";
import { SaveMaterialButton } from "@/components/biblioteca/save-material-button";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { PlanBadge } from "@/components/profile/plan-badge";

type MaterialCardProps = {
  material: LibraryMaterial;
};

export function MaterialCard({ material }: MaterialCardProps) {
  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
            <FileText size={14} />
            {material.materialType}
          </span>
          <div className="flex items-center gap-3">
            {material.ratingsCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
                <Star size={15} fill="currentColor" />
                {material.rating.toFixed(1)}
                <span className="text-slate-400">({material.ratingsCount})</span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
              <Eye size={16} />
              {material.viewsCount.toLocaleString("pt-BR")}
            </span>
          </div>
        </div>

        <Link href={`/biblioteca/${material.id}`}>
          <h2 className="mt-4 text-lg font-semibold leading-7 text-slate-950 transition hover:text-sky-800">
            {material.title}
          </h2>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {material.description}
        </p>

        <div className="mt-5 grid gap-3 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <GraduationCap size={16} className="text-sky-700" />
            {material.vestibular}
          </span>
          <span className="inline-flex items-center gap-2">
            <School size={16} className="text-sky-700" />
            {material.faculdade}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={16} className="text-sky-700" />
            {material.year} · {material.subject}
          </span>
        </div>

        {material.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {material.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {material.author ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          {material.author.username ? (
            <Link
              href={`/perfil/${material.author.username}`}
              className="inline-flex items-center gap-2 hover:text-sky-800"
            >
              <ProfileAvatar
                name={material.author.fullName}
                avatarUrl={material.author.avatarUrl}
                size="sm"
              />
              <span className="font-medium">{material.author.fullName}</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2">
              <ProfileAvatar
                name={material.author.fullName}
                avatarUrl={material.author.avatarUrl}
                size="sm"
              />
              <span className="font-medium">{material.author.fullName}</span>
            </span>
          )}
          <PlanBadge plan={material.author.plan} />
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/biblioteca/${material.id}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Ver material
        </Link>
        <div className="flex flex-wrap gap-2">
          <LikeMaterialButton
            materialId={material.id}
            isMock={material.isMock}
          />
          <SaveMaterialButton
            materialId={material.id}
            isMock={material.isMock}
          />
        </div>
      </div>
    </article>
  );
}
