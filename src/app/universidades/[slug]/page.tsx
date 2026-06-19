import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { CatalogCollection } from "@/components/catalog/catalog-collection";
import { UNIVERSITIES, getUniversity } from "@/lib/catalog";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return UNIVERSITIES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const uni = getUniversity(slug);
  if (!uni) return {};
  return {
    title: `${uni.label} — provas, apostilas e simulados`,
    description: uni.blurb,
    alternates: { canonical: `/universidades/${uni.slug}` },
    openGraph: { title: uni.label, description: uni.blurb },
  };
}

export default async function UniversidadePage({ params }: PageProps) {
  const { slug } = await params;
  const uni = getUniversity(slug);
  if (!uni) notFound();

  return (
    <AppShell>
      <CatalogCollection
        title={uni.label}
        intro={uni.blurb}
        filters={{ faculdade: uni.filter }}
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Universidades", href: "/universidades" },
          { label: uni.name, href: `/universidades/${uni.slug}` },
        ]}
      />
    </AppShell>
  );
}
