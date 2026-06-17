import { GraduationCap, MessageCircle } from "lucide-react";
import { CreatePost } from "@/components/feed/create-post";
import { PostCard } from "@/components/feed/post-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { getFeedData } from "@/lib/feed";

export default async function FeedPage() {
  const { posts, error } = await getFeedData();

  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          eyebrow="Comunidade"
          title="Feed"
          description="Publique dúvidas, compartilhe estratégias e anexe materiais úteis para outros vestibulandos de Medicina."
        />
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-800 shadow-sm">
          <GraduationCap size={17} />
          Rede de estudos
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.78fr_0.22fr]">
        <section className="space-y-5">
          <CreatePost />

          {error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {error}
            </div>
          ) : null}

          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <MessageCircle className="mx-auto text-sky-700" size={32} />
              <h2 className="mt-3 text-lg font-semibold text-slate-950">
                Nenhuma publicação ainda
              </h2>
              <p className="mt-2 text-slate-600">
                Seja a primeira pessoa a compartilhar uma dica, dúvida ou
                material com a comunidade.
              </p>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Boas práticas
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>Use tags para facilitar buscas por matéria, banca e fase.</p>
            <p>Anexe materiais aprovados quando a publicação depender deles.</p>
            <p>Mantenha comentários focados em estudo e revisão.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
