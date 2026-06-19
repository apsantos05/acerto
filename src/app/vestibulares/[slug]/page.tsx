import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { CatalogCollection } from "@/components/catalog/catalog-collection";
import { VESTIBULARES, getVestibular } from "@/lib/catalog";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return VESTIBULARES.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vest = getVestibular(slug);
  if (!vest) return {};
  return {
    title: `${vest.label} — provas e materiais`,
    description: vest.blurb,
    alternates: { canonical: `/vestibulares/${vest.slug}` },
    openGraph: { title: vest.label, description: vest.blurb },
  };
}

export default async function VestibularPage({ params }: PageProps) {
  const { slug } = await params;
  const vest = getVestibular(slug);
  if (!vest) notFound();

  return (
    <AppShell>
      <CatalogCollection
        title={vest.label}
        intro={vest.blurb}
        filters={{ vestibular: vest.filter }}
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Vestibulares", href: "/vestibulares" },
          { label: vest.name, href: `/vestibulares/${vest.slug}` },
        ]}
      />
    </AppShell>
  );
}
