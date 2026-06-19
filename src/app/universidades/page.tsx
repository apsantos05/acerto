import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { CatalogIndex } from "@/components/catalog/catalog-index";
import { UNIVERSITIES } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Medicina por universidade — provas, apostilas e simulados",
  description:
    "Acervo de materiais de Medicina organizado por universidade: USP, Unicamp, Unesp, UFSC, UFPR, UFMG, Unifesp, Famerp, Einstein, Santa Casa e SLMandic.",
  alternates: { canonical: "/universidades" },
};

export default function UniversidadesPage() {
  return (
    <AppShell>
      <CatalogIndex
        title="Medicina por universidade"
        intro="Escolha a universidade dos seus sonhos e acesse provas, gabaritos, apostilas, simulados, revisões e redações específicas de cada vestibular de Medicina."
        basePath="/universidades"
        entries={UNIVERSITIES}
      />
    </AppShell>
  );
}
