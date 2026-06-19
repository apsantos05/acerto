import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MaterialDetail } from "@/components/biblioteca/material-detail";
import { MaterialCard } from "@/components/biblioteca/material-card";
import { AppShell } from "@/components/layout/app-shell";
import {
  getMaterialById,
  getRelatedMaterials,
  incrementMaterialViews,
} from "@/lib/materials";

type MaterialPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: MaterialPageProps): Promise<Metadata> {
  const { id } = await params;
  const material = await getMaterialById(id);
  if (!material) return { title: "Material não encontrado" };

  const description =
    material.description ||
    `${material.materialType} de ${material.subject} — ${material.faculdade} ${material.year}.`;

  return {
    title: material.title,
    description,
    alternates: { canonical: `/biblioteca/${id}` },
    openGraph: { title: material.title, description },
  };
}

export default async function MaterialPage({ params }: MaterialPageProps) {
  const { id } = await params;

  await incrementMaterialViews(id);
  const material = await getMaterialById(id);

  if (!material) {
    notFound();
  }

  const related = await getRelatedMaterials(material);

  return (
    <AppShell>
      <MaterialDetail material={material} />

      {related.length > 0 ? (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">
              Materiais relacionados de {material.subject}
            </h2>
            <Link
              href={`/biblioteca?subject=${encodeURIComponent(material.subject)}`}
              className="text-sm font-semibold text-sky-700 hover:text-sky-900"
            >
              Ver mais
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <MaterialCard key={item.id} material={item} />
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
