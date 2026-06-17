import Link from "next/link";
import {
  CalendarDays,
  Eye,
  FileText,
  GraduationCap,
  School,
} from "lucide-react";
import type { LibraryMaterial } from "@/lib/materials";
import { LikeMaterialButton } from "@/components/biblioteca/like-material-button";
import { SaveMaterialButton } from "@/components/biblioteca/save-material-button";

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
          <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
            <Eye size={16} />
            {material.viewsCount.toLocaleString("pt-BR")}
          </span>
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
