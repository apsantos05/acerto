import type { SimuladoHistoryItem } from "@/lib/simulados";

type Props = {
  history: SimuladoHistoryItem[];
};

const CARD =
  "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm";

export function SimuladoCharts({ history }: Props) {
  // Apenas tentativas finalizadas, ordenadas ascendente por finishedAt.
  const finished = history
    .filter((h) => h.finishedAt != null)
    .slice()
    .sort((a, b) => {
      const ta = a.finishedAt ? Date.parse(a.finishedAt) : 0;
      const tb = b.finishedAt ? Date.parse(b.finishedAt) : 0;
      return ta - tb;
    });

  if (finished.length === 0) {
    return (
      <div className={CARD}>
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          Evolução nos simulados
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Faça simulados para ver sua evolução.
        </p>
      </div>
    );
  }

  // Média geral dos percentuais.
  const avgPercent = Math.round(
    finished.reduce((acc, h) => acc + h.percent, 0) / finished.length,
  );

  // Agregação por matéria a partir dos subjectScores de cada tentativa.
  const subjectAgg = new Map<string, { sum: number; count: number }>();
  for (const item of finished) {
    for (const [subject, score] of Object.entries(item.subjectScores ?? {})) {
      const cur = subjectAgg.get(subject) ?? { sum: 0, count: 0 };
      cur.sum += score.percent;
      cur.count += 1;
      subjectAgg.set(subject, cur);
    }
  }
  const subjectAverages = Array.from(subjectAgg.entries())
    .map(([subject, { sum, count }]) => ({
      subject,
      percent: count > 0 ? Math.round(sum / count) : 0,
    }))
    .sort((a, b) => b.percent - a.percent);

  // ---- Geometria do gráfico de linha (SVG) ----
  const W = 300;
  const H = 120;
  const PAD_X = 8;
  const PAD_Y = 12;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;
  const n = finished.length;

  // Escala temporal pela ORDEM (índice), nunca por timestamps reais.
  const xFor = (i: number) =>
    n <= 1 ? W / 2 : PAD_X + (innerW * i) / (n - 1);
  // percent 0..100 -> y invertido
  const yFor = (percent: number) =>
    PAD_Y + innerH * (1 - Math.min(100, Math.max(0, percent)) / 100);

  const points = finished.map((h, i) => ({
    x: xFor(i),
    y: yFor(h.percent),
    percent: h.percent,
  }));

  const linePath =
    points.length >= 2
      ? points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
          .join(" ")
      : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      {/* Evolução de desempenho */}
      <div className={CARD}>
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          Evolução de desempenho
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Percentual de acertos ao longo das tentativas finalizadas.
        </p>

        {finished.length < 2 ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Apenas {finished.length} simulado finalizado — faça mais simulados
            para ver a linha de evolução.
          </p>
        ) : null}

        <div className="mt-4">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            className="h-auto w-full text-sky-600 dark:text-sky-400"
            role="img"
            aria-label="Gráfico de evolução do percentual de acertos"
          >
            {/* Eixo base */}
            <line
              x1={PAD_X}
              y1={H - PAD_Y}
              x2={W - PAD_X}
              y2={H - PAD_Y}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth={1}
            />
            {/* Linha de evolução (>= 2 pontos) */}
            {linePath ? (
              <path
                d={linePath}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {/* Pontos */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={3}
                className="fill-sky-500"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Média dos simulados */}
      <div className={`${CARD} flex flex-col justify-center`}>
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          Média dos simulados
        </h2>
        <p className="mt-3 text-4xl font-bold text-sky-600 dark:text-sky-400">
          {avgPercent}%
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Média de {finished.length} simulado
          {finished.length === 1 ? "" : "s"} finalizado
          {finished.length === 1 ? "" : "s"}.
        </p>
      </div>

      {/* Evolução por matéria */}
      <div className={`${CARD} lg:col-span-2`}>
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          Evolução por matéria
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Média do percentual de acertos por matéria (todas as tentativas).
        </p>

        {subjectAverages.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Faça simulados para ver sua evolução.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {subjectAverages.map((s) => (
              <li key={s.subject}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {s.subject}
                  </span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {s.percent}%
                  </span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${Math.min(100, Math.max(0, s.percent))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
