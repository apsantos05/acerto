import { Info } from "lucide-react";
import { RankingFilters } from "@/components/ranking/ranking-filters";
import { RankingSection } from "@/components/ranking/ranking-section";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { getRankingPageData, type RankingFilters as Filters } from "@/lib/ranking";

type RankingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: keyof Filters,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const params = (await searchParams) ?? {};
  const data = await getRankingPageData({
    subject: getParam(params, "subject"),
    vestibular: getParam(params, "vestibular"),
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Reputação"
        title="Ranking"
        description="Acompanhe quem mais contribui com materiais, posts, comentários e ajuda prática para a comunidade."
      />

      {data.isMock ? (
        <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          <Info size={18} className="shrink-0" />
          Exibindo dados temporários. Execute o schema do Supabase para usar o
          cálculo real de reputação.
        </div>
      ) : null}

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Como os pontos são calculados
        </h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-5">
          <p className="rounded-lg bg-slate-50 p-3">Material aprovado: +20</p>
          <p className="rounded-lg bg-slate-50 p-3">Curtida em material: +2</p>
          <p className="rounded-lg bg-slate-50 p-3">Salvamento recebido: +5</p>
          <p className="rounded-lg bg-slate-50 p-3">Comentário ajudando: +3</p>
          <p className="rounded-lg bg-slate-50 p-3">Post publicado: +5</p>
        </div>
      </section>

      <RankingFilters
        subjects={data.options.subjects}
        vestibulares={data.options.vestibulares}
        activeSubject={data.activeSubject}
        activeVestibular={data.activeVestibular}
      />

      <div className="space-y-6">
        <RankingSection
          title="Ranking geral"
          description="Pontuação total considerando todas as contribuições."
          entries={data.general}
        />
        <RankingSection
          title={`Ranking por matéria: ${data.activeSubject}`}
          description="Pontuação relacionada a materiais, posts e comentários conectados à matéria selecionada."
          entries={data.subjectRanking}
        />
        <RankingSection
          title={`Ranking por vestibular: ${data.activeVestibular}`}
          description="Pontuação relacionada a materiais, posts e comentários conectados ao vestibular selecionado."
          entries={data.vestibularRanking}
        />
      </div>
    </AppShell>
  );
}
