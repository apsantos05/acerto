import { notFound } from "next/navigation";
import { PublicProfile } from "@/components/profile/public-profile";
import { AppShell } from "@/components/layout/app-shell";
import { getPublicProfile } from "@/lib/profile";

type PerfilPublicoPageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function PerfilPublicoPage({
  params,
}: PerfilPublicoPageProps) {
  const { username } = await params;
  const data = await getPublicProfile(username);

  if (!data) {
    notFound();
  }

  return (
    <AppShell>
      <PublicProfile data={data} />
    </AppShell>
  );
}
