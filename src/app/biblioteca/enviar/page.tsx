import { UploadMaterialForm } from "@/components/biblioteca/upload-material-form";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";

export default function EnviarMaterialPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Biblioteca"
        title="Enviar material"
        description="Compartilhe PDFs, imagens ou links externos com a comunidade do Acerte."
      />
      <UploadMaterialForm />
    </AppShell>
  );
}
