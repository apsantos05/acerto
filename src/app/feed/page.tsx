import { MessageCircle, Plus, Share2, ThumbsUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { feedPosts } from "@/lib/mock-data";

export default function FeedPage() {
  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          eyebrow="Comunidade"
          title="Feed"
          description="Acompanhe materiais, dúvidas e recomendações compartilhadas por outros vestibulandos."
        />
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
          <Plus size={18} />
          Nova publicação
        </button>
      </div>

      <div className="space-y-4">
        {feedPosts.map((post) => (
          <article
            key={post.author}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-950">{post.author}</p>
                <p className="text-sm text-slate-500">{post.time}</p>
              </div>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                {post.badge}
              </span>
            </div>
            <p className="mt-5 leading-7 text-slate-700">{post.content}</p>
            <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
              <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <ThumbsUp size={17} />
                Curtir
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <MessageCircle size={17} />
                Comentar
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <Share2 size={17} />
                Salvar
              </button>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
