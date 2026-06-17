import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/profile";

export default async function PerfilPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/configuracoes/perfil");
  }

  redirect(`/perfil/${profile.username}`);
}
