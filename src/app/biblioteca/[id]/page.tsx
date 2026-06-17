import { notFound } from "next/navigation";
import { MaterialDetail } from "@/components/biblioteca/material-detail";
import { AppShell } from "@/components/layout/app-shell";
import { getMaterialById, incrementMaterialViews } from "@/lib/materials";

type MaterialPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MaterialPage({ params }: MaterialPageProps) {
  const { id } = await params;

  await incrementMaterialViews(id);
  const material = await getMaterialById(id);

  if (!material) {
    notFound();
  }

  return (
    <AppShell>
      <MaterialDetail material={material} />
    </AppShell>
  );
}
