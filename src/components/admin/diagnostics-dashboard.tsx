import {
  ArrowDown,
  Crown,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import type { DiagnosticsDashboard, DashboardCount } from "@/lib/diagnostico-data";

const CARD =
  "rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";

function Metric({
  label,
  value,
  accent = "text-slate-950 dark:text-white",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function MiniBars({ items, color }: { items: { label: string; value: number }[]; color: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="mt-4 space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">{i.label}</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">{i.value}</span>
          </div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function RankTable({
  title,
  rows,
  total,
  showPercent,
}: {
  title: string;
  rows: DashboardCount[];
  total: number;
  showPercent?: boolean;
}) {
  return (
    <div className={CARD}>
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Trophy size={15} /> {title}
      </h3>
      {rows.length > 0 ? (
        <table className="mt-3 w-full text-left text-sm">
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="py-2 pr-2 text-slate-700 dark:text-slate-200">{r.name}</td>
                <td className="py-2 text-right font-semibold text-slate-950 dark:text-white">{r.count}</td>
                {showPercent ? (
                  <td className="w-14 py-2 text-right text-xs text-slate-500 dark:text-slate-400">
                    {total > 0 ? Math.round((r.count / total) * 100) : 0}%
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Sem dados ainda.</p>
      )}
    </div>
  );
}

export function DiagnosticsDashboardView({ data }: { data: DiagnosticsDashboard }) {
  // ---- Gráfico de linha (evolução 30 dias) ----
  const W = 320;
  const H = 120;
  const PAD_X = 8;
  const PAD_Y = 12;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;
  const ev = data.evolution;
  const maxEv = Math.max(1, ...ev.map((e) => e.count));
  const xFor = (i: number) => (ev.length <= 1 ? W / 2 : PAD_X + (innerW * i) / (ev.length - 1));
  const yFor = (count: number) => PAD_Y + innerH * (1 - count / maxEv);
  const linePath =
    ev.length >= 2
      ? ev.map((e, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(e.count).toFixed(1)}`).join(" ")
      : "";

  const cr = data.conversionReal;

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Metric label="Diagnósticos totais" value={String(data.total)} />
        <Metric label="Últimos 7 dias" value={String(data.last7)} accent="text-sky-700 dark:text-sky-400" />
        <Metric label="Últimos 30 dias" value={String(data.last30)} accent="text-sky-700 dark:text-sky-400" />
        <Metric label="Score médio" value={String(data.avgScore)} />
        <Metric label="Taxa de cadastro" value={`${data.signupRate}%`} accent="text-emerald-600 dark:text-emerald-400" />
        <Metric label="Conversão Premium" value={`${data.premiumRate}%`} accent="text-emerald-600 dark:text-emerald-400" />
        <Metric label="Conversão Premium Med." value={`${data.premiumMedRate}%`} accent="text-amber-600 dark:text-amber-400" />
        <Metric label="Premium Medicina (nº)" value={String(data.premiumMed)} accent="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Funil */}
      <div className={CARD}>
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <TrendingUp size={15} /> Funil de conversão
        </h3>
        <div className="mt-4 grid items-stretch gap-2 sm:grid-cols-7">
          <FunnelStep icon={<Users size={18} />} label="Diagnósticos" value={data.total} />
          <FunnelArrow rate={data.signupRate} />
          <FunnelStep icon={<UserCheck size={18} />} label="Cadastros" value={data.registered} />
          <FunnelArrow rate={data.total ? pctSafe(data.premium, data.registered) : 0} />
          <FunnelStep icon={<Crown size={18} />} label="Premium" value={data.premium} />
          <FunnelArrow rate={pctSafe(data.premiumMed, data.premium)} />
          <FunnelStep icon={<Crown size={18} className="text-amber-500" />} label="Premium Med." value={data.premiumMed} highlight />
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Evolução */}
        <div className={CARD}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Evolução de diagnósticos (30 dias)
          </h3>
          <div className="mt-4">
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="h-auto w-full text-sky-600 dark:text-sky-400" role="img" aria-label="Evolução de diagnósticos">
              <line x1={PAD_X} y1={H - PAD_Y} x2={W - PAD_X} y2={H - PAD_Y} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth={1} />
              {linePath ? <path d={linePath} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /> : null}
              {ev.map((e, i) => (
                <circle key={e.day} cx={xFor(i)} cy={yFor(e.count)} r={2} className="fill-sky-500" />
              ))}
            </svg>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Pico: {maxEv} no dia mais ativo.</p>
          </div>
        </div>

        {/* Distribuição de score */}
        <div className={CARD}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Distribuição de score
          </h3>
          <MiniBars items={data.scoreDist.map((s) => ({ label: s.bucket, value: s.count }))} color="bg-sky-500" />
        </div>

        {/* Conversão por plano recomendado */}
        <div className={CARD}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Por plano recomendado
          </h3>
          <MiniBars
            items={[
              { label: "Gratuito", value: data.byRecommended.free },
              { label: "Premium", value: data.byRecommended.premium },
              { label: "Premium Medicina", value: data.byRecommended.premium_med },
            ]}
            color="bg-emerald-500"
          />
        </div>

        {/* Conversão real */}
        <div className={CARD}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Conversão real (recomendado → virou)
          </h3>
          <div className="mt-4 space-y-4">
            <ConversionBar
              label="Recomendado Premium → Premium+"
              converted={cr.recPremiumConverted}
              total={cr.recPremiumTotal}
              color="bg-emerald-500"
            />
            <ConversionBar
              label="Recomendado Premium Med. → Premium Med."
              converted={cr.recPremiumMedConverted}
              total={cr.recPremiumMedTotal}
              color="bg-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid gap-6 lg:grid-cols-3">
        <RankTable title="Top universidades" rows={data.topUniversities} total={data.total} showPercent />
        <RankTable title="Top vestibulares" rows={data.topVestibulares} total={data.total} />
        <RankTable title="Top dificuldades" rows={data.topDifficulties} total={data.total} />
      </div>
    </div>
  );
}

function pctSafe(num: number, den: number) {
  return den > 0 ? Math.round((num / den) * 1000) / 10 : 0;
}

function FunnelStep({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`sm:col-span-2 flex flex-col items-center justify-center rounded-xl border p-4 text-center ${
        highlight
          ? "border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
          : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
      }`}
    >
      <span className="text-slate-600 dark:text-slate-300">{icon}</span>
      <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function FunnelArrow({ rate }: { rate: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
      <ArrowDown size={18} className="sm:rotate-[-90deg]" />
      <span className="text-xs font-semibold">{rate}%</span>
    </div>
  );
}

function ConversionBar({
  label,
  converted,
  total,
  color,
}: {
  label: string;
  converted: number;
  total: number;
  color: string;
}) {
  const rate = total > 0 ? Math.round((converted / total) * 1000) / 10 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="font-semibold text-slate-950 dark:text-white">
          {converted}/{total} <span className="text-xs font-normal text-slate-400">({rate}%)</span>
        </span>
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}
