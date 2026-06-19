import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { CatalogIndex } from "@/components/catalog/catalog-index";
import { VESTIBULARES } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Provas e materiais por vestibular",
  description:
    "Fuvest, Comvest, Unesp, Famerp, UFSC, UFPR e ENEM: provas, gabaritos e materiais de cada vestibular para quem busca Medicina.",
  alternates: { canonical: "/vestibulares" },
};

export default function VestibularesPage() {
  return (
    <AppShell>
      <CatalogIndex
        title="Materiais por vestibular"
        intro="Cada banca cobra de um jeito. Acesse provas, gabaritos e materiais específicos do vestibular que você vai prestar."
        basePath="/vestibulares"
        entries={VESTIBULARES}
      />
    </AppShell>
  );
}
