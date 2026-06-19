import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { CatalogCollection } from "@/components/catalog/catalog-collection";
import { SUBJECTS, getSubject } from "@/lib/catalog";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const subject = getSubject(slug);
  if (!subject) return {};
  return {
    title: `${subject.label} — provas, listas e resumos`,
    description: subject.blurb,
    alternates: { canonical: `/materias/${subject.slug}` },
    openGraph: { title: subject.label, description: subject.blurb },
  };
}

export default async function MateriaPage({ params }: PageProps) {
  const { slug } = await params;
  const subject = getSubject(slug);
  if (!subject) notFound();

  return (
    <AppShell>
      <CatalogCollection
        title={subject.label}
        intro={subject.blurb}
        filters={{ subject: subject.filter }}
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Matérias", href: "/materias" },
          { label: subject.name, href: `/materias/${subject.slug}` },
        ]}
      />
    </AppShell>
  );
}
