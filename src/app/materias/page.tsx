import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { CatalogIndex } from "@/components/catalog/catalog-index";
import { SUBJECTS } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Materiais por matéria para Medicina",
  description:
    "Estude por matéria: Biologia, Química, Física, Matemática, História, Geografia, Português, Literatura, Redação e mais — focado em quem vai cursar Medicina.",
  alternates: { canonical: "/materias" },
};

export default function MateriasPage() {
  return (
    <AppShell>
      <CatalogIndex
        title="Materiais por matéria"
        intro="Provas, listas de exercícios, resumos e revisões organizados por matéria, do jeito que cai nos vestibulares de Medicina."
        basePath="/materias"
        entries={SUBJECTS}
      />
    </AppShell>
  );
}
