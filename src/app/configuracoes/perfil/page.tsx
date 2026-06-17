import Link from "next/link";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentProfile } from "@/lib/profile";

export default async function ConfiguracoesPerfilPage() {
  const profile = await getCurrentProfile();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Configurações"
        title="Editar perfil"
        description="Atualize as informações públicas que aparecem para outros estudantes no Acerte."
      />

      {profile ? (
        <EditProfileForm profile={profile} />
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Perfil indisponível
          </h2>
          <p className="mt-2 text-slate-600">
            Não foi possível carregar seu perfil. Entre novamente ou confira a
            configuração do Supabase.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Entrar
          </Link>
        </section>
      )}
    </AppShell>
  );
}
