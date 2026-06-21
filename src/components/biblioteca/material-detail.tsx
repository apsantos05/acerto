import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Lock,
  LinkIcon,
  School,
} from "lucide-react";
import type { LibraryMaterial } from "@/lib/materials";
import { LikeMaterialButton } from "@/components/biblioteca/like-material-button";
import { SaveMaterialButton } from "@/components/biblioteca/save-material-button";
import { MaterialStatusBadge } from "@/components/biblioteca/material-status-badge";
import { MaterialRating } from "@/components/biblioteca/material-rating";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { UpgradeButton } from "@/components/plan/upgrade-modal";

type MaterialDetailProps = {
  material: LibraryMaterial;
  // Material premium e usuário sem acesso: mostra prévia, bloqueia o arquivo.
  locked?: boolean;
};

export function MaterialDetail({ material, locked = false }: MaterialDetailProps) {
  return (
    <div>
      <Link
        href="/biblioteca"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950 dark:text-sky-400 dark:hover:text-sky-300"
      >
        <ArrowLeft size={17} />
        Voltar para biblioteca
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
              <FileText size={14} />
              {material.materialType}
            </span>
            {locked ? (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 align-middle text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <Lock size={12} />
                Premium
              </span>
            ) : null}
            {!material.isMock ? (
              <span className="ml-2 inline-flex align-middle">
                <MaterialStatusBadge status={material.status} />
              </span>
            ) : null}
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl dark:text-white">
              {material.title}
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-slate-600 dark:text-slate-300">
              {material.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <LikeMaterialButton
              materialId={material.id}
              isMock={material.isMock}
            />
            <SaveMaterialButton
              materialId={material.id}
              isMock={material.isMock}
            />
            {locked ? (
              <UpgradeButton
                label="Liberar com Premium"
                title="Material Premium"
                message="Este material faz parte do acervo Premium (apostilas e materiais das melhores editoras). Assine para abrir o conteúdo completo."
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              />
            ) : material.fileUrl || material.externalUrl ? (
              <a
                href={material.externalUrl ?? material.fileUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {material.uploadKind === "link" ? (
                  <LinkIcon size={17} />
                ) : (
                  <Download size={17} />
                )}
                {material.uploadKind === "link" ? "Abrir link" : "Abrir arquivo"}
              </a>
            ) : (
              <button
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400 dark:border-slate-700 dark:text-slate-600"
              >
                <Download size={17} />
                Arquivo em breve
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailMetric
            icon={GraduationCap}
            label="Vestibular"
            value={material.vestibular}
          />
          <DetailMetric icon={School} label="Faculdade" value={material.faculdade} />
          <DetailMetric
            icon={CalendarDays}
            label="Ano e matéria"
            value={`${material.year} · ${material.subject}`}
          />
          <DetailMetric
            icon={Eye}
            label="Visualizações"
            value={material.viewsCount.toLocaleString("pt-BR")}
          />
        </div>

        {material.author ? (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <ProfileAvatar
              name={material.author.fullName}
              avatarUrl={material.author.avatarUrl}
              size="md"
            />
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Enviado por
              </p>
              {material.author.username ? (
                <Link
                  href={`/perfil/${material.author.username}`}
                  className="font-semibold text-slate-950 hover:text-sky-800 dark:text-white dark:hover:text-sky-400"
                >
                  {material.author.fullName}
                  <span className="ml-1 text-sm font-normal text-slate-500 dark:text-slate-400">
                    @{material.author.username}
                  </span>
                </Link>
              ) : (
                <p className="font-semibold text-slate-950 dark:text-white">
                  {material.author.fullName}
                </p>
              )}
            </div>
          </div>
        ) : null}

        <MaterialRating
          materialId={material.id}
          average={material.rating}
          count={material.ratingsCount}
          isMock={material.isMock}
        />

        {material.tags.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {material.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function DetailMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
      <Icon size={20} className="text-sky-700 dark:text-sky-400" />
      <p className="mt-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
