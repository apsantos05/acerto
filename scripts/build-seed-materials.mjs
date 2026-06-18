/**
 * Acerte — Builder do seed de materiais oficiais (import por LINK, não re-hospeda PDFs).
 *
 * Gera:
 *   - content/materials.json        (metadados estruturados)
 *   - supabase/seed_materials.sql   (inserts idempotentes; dedup por external_url)
 * e imprime uma prévia dos 20 primeiros + contagens.
 *
 * Todas as URLs vêm do inventário verificado (Fase 1.5). Nada inventado.
 */
import { mkdirSync, writeFileSync } from "node:fs";

const items = [];
const add = (vestibular, faculdade, year, materialType, title, url, subject = "Geral") => {
  items.push({
    vestibular,
    faculdade,
    year,
    materialType, // Prova | Gabarito | Discursiva
    subject,
    title,
    externalUrl: url,
    uploadKind: "link",
    status: "approved",
    tags: [vestibular.toLowerCase(), String(year), materialType.toLowerCase()],
  });
};

// ============================ ENEM (INEP) — 2010–2025 ============================
const ENEM_NEW = "https://download.inep.gov.br/enem/provas_e_gabaritos/";
const ENEM_OLD = "https://download.inep.gov.br/educacao_basica/enem/";
for (const y of [2025, 2024, 2023, 2022, 2021, 2020]) {
  add("ENEM", "ENEM / SISU", y, "Prova", `ENEM ${y} - Prova 1º dia (Caderno Azul)`, `${ENEM_NEW}${y}_PV_impresso_D1_CD1.pdf`);
  add("ENEM", "ENEM / SISU", y, "Prova", `ENEM ${y} - Prova 2º dia (Caderno Amarelo)`, `${ENEM_NEW}${y}_PV_impresso_D2_CD5.pdf`);
  add("ENEM", "ENEM / SISU", y, "Gabarito", `ENEM ${y} - Gabarito 1º dia`, `${ENEM_NEW}${y}_GB_impresso_D1_CD1.pdf`);
  add("ENEM", "ENEM / SISU", y, "Gabarito", `ENEM ${y} - Gabarito 2º dia`, `${ENEM_NEW}${y}_GB_impresso_D2_CD5.pdf`);
}
const enemOld = {
  2019: { p1: "provas/2019/2019_PV_impresso_D1_CD1.pdf", p2: "provas/2019/2019_PV_impresso_D2_CD5.pdf", g1: "gabaritos/2019/gabarito_1_dia_caderno_1_azul_aplicacao_regular.pdf", g2: "gabaritos/2019/gabarito_2_dia_caderno_5_amarelo_aplicacao_regular.pdf" },
  2018: { p1: "provas/2018/2018_PV_impresso_D1_CD1.pdf", p2: "provas/2018/2018_PV_impresso_D2_CD6.pdf", g1: "gabaritos/2018/GAB_ENEM_2018_DIA_1_AZUL.pdf", g2: "gabaritos/2018/GAB_ENEM_2018_DIA_2_AMARELO.pdf" },
  2017: { p1: "provas/2017/2017_PV_impresso_D1_CD1.pdf", p2: "provas/2017/2017_PV_impresso_D2_CD5.pdf", g1: "gabaritos/2017/cad_1_gabarito_azul_5112017.pdf", g2: "gabaritos/2017/cad_5_gabarito_amarelo_12112017.pdf" },
  2016: { p1: "provas/2016/2016_PV_impresso_D1_CD1.pdf", p2: "provas/2016/2016_PV_impresso_D2_CD5.pdf", g1: "gabaritos/2016/GAB_ENEM_2016_DIA_1_01_AZUL.pdf", g2: "gabaritos/2016/GAB_ENEM_2016_DIA_2_05_AMARELO.pdf" },
  2015: { p1: "provas/2015/2015_PV_impresso_D1_CD1.pdf", p2: "provas/2015/2015_PV_impresso_D2_CD5.pdf", g1: "gabaritos/2015/CADERNO_1_AZUL_SABADO.pdf", g2: "gabaritos/2015/CADERNO_5_AMARELO_DOMINGO.pdf" },
  2014: { p1: "provas/2014/2014_PV_impresso_D1_CD1.pdf", p2: "provas/2014/2014_PV_impresso_D2_CD5.pdf", g1: "gabaritos/2014/CADERNO_1_AZUL_SABADO.pdf", g2: "gabaritos/2014/CADERNO_5_AMARELO_DOMINGO.pdf" },
  2013: { p1: "provas/2013/dia1_caderno1_azul.pdf", p2: "provas/2013/dia2_caderno5_amarelo.pdf", g1: "gabaritos/2013/dia1_azul.pdf", g2: "gabaritos/2013/dia2_amarelo.pdf" },
  2012: { p1: "provas/2012/dia1_caderno1_azul.pdf", p2: "provas/2012/dia2_caderno5_amarelo.pdf", g1: "gabaritos/2012/dia1_azul.pdf", g2: "gabaritos/2012/dia2_amarelo.pdf" },
  2011: { p1: "provas/2011/dia1_caderno1_azul.pdf", p2: "provas/2011/dia2_caderno5_amarelo.pdf", g1: "gabaritos/2011/01_AZUL_GABARITO.pdf", g2: "gabaritos/2011/05_AMARELO_GABARITO.pdf" },
  2010: { p1: "provas/2010/dia1_caderno1_azul.pdf", p2: "provas/2010/dia2_caderno5_amarelo.pdf", g1: "provas/2010/dia1_caderno1_azul_com_gab.pdf", g2: "provas/2010/dia2_caderno5_amarelo_com_gab.pdf" },
};
for (const [y, p] of Object.entries(enemOld)) {
  const yr = Number(y);
  add("ENEM", "ENEM / SISU", yr, "Prova", `ENEM ${yr} - Prova 1º dia (Caderno Azul)`, ENEM_OLD + p.p1);
  add("ENEM", "ENEM / SISU", yr, "Prova", `ENEM ${yr} - Prova 2º dia (Caderno Amarelo)`, ENEM_OLD + p.p2);
  add("ENEM", "ENEM / SISU", yr, "Gabarito", `ENEM ${yr} - Gabarito 1º dia`, ENEM_OLD + p.g1);
  add("ENEM", "ENEM / SISU", yr, "Gabarito", `ENEM ${yr} - Gabarito 2º dia`, ENEM_OLD + p.g2);
}

// ============================ FUVEST (USP) — 2010–2025 ============================
const FU = "https://www.fuvest.br/wp-content/uploads/";
const F = (y, type, title, file) => add("FUVEST", "USP", y, type, `FUVEST ${y} - ${title}`, FU + file);
// 2025
F(2025, "Prova", "1ª fase (V1)", "fuvest2025_primeira_fase_prova_V1.pdf");
F(2025, "Gabarito", "Gabarito 1ª fase", "fuvest2025_gabarito_primeira_fase.pdf");
F(2025, "Discursiva", "2ª fase - 1º dia", "fuvest2025_prova_2fase_dia1.pdf");
F(2025, "Discursiva", "2ª fase - 2º dia", "fuvest2025_prova_2fase_dia2.pdf");
F(2025, "Gabarito", "Guia de respostas (2ª fase)", "fuvest_2025_guia_respostas.pdf");
// 2024
F(2024, "Prova", "1ª fase (V)", "fuvest2024_primeira_fase_prova_V.pdf");
F(2024, "Gabarito", "Gabarito 1ª fase", "fuvest2024_gabarito_primeira_fase_retificado_2023-11-24.pdf");
F(2024, "Discursiva", "2ª fase - 1º dia", "fuvest2024_segunda_fase_prova_1dia.pdf");
F(2024, "Discursiva", "2ª fase - 2º dia", "fuvest2024_segunda_fase_prova_2dia.pdf");
F(2024, "Gabarito", "Abordagens esperadas (2ª fase)", "fuvest_2024_2024.01.22_RESPOSTAS_USP_Guia.pdf");
// 2023
F(2023, "Prova", "1ª fase (V)", "fuvest2023_primeira_fase_prova_V.pdf");
F(2023, "Gabarito", "Gabarito 1ª fase", "fuvest2023_gabarito_primeira_fase.pdf");
F(2023, "Discursiva", "2ª fase - 1º dia", "fuvest_2023_segunda_fase_dia_1.pdf");
F(2023, "Discursiva", "2ª fase - 2º dia", "fuvest_2023_segunda_fase_dia_2.pdf");
F(2023, "Gabarito", "Abordagens esperadas (2ª fase)", "fuvest2023_abordagens_esperadas_2fase.pdf");
// 2022
F(2022, "Prova", "1ª fase (V)", "fuvest_2022_primeira_fase_tipo_V.pdf");
F(2022, "Gabarito", "Gabarito 1ª fase", "fuvest_2022_primeira_fase_gabarito_retificado.pdf");
F(2022, "Discursiva", "2ª fase - 1º dia", "fuvest_2022_segunda_fase_dia_1.pdf");
F(2022, "Discursiva", "2ª fase - 2º dia", "fuvest_2022_segunda_fase_dia_2.pdf");
// 2021
F(2021, "Prova", "1ª fase", "fuvest_2021_primeira_fase.pdf");
F(2021, "Gabarito", "Gabarito 1ª fase", "fuvest_2021_primeira_fase_gabarito_v2.pdf");
F(2021, "Discursiva", "2ª fase - 1º dia", "fuv2021_2fase_dia_1.pdf");
F(2021, "Discursiva", "2ª fase - 2º dia", "fuv2021_2fase_dia_2.pdf");
// 2020
F(2020, "Prova", "1ª fase (V)", "fuvest_2020_primeira_fase_prova_V.pdf");
F(2020, "Gabarito", "Gabarito 1ª fase", "fuvest_2020_primeira_fase_gabaritos.pdf");
F(2020, "Discursiva", "2ª fase - 1º dia", "fuv2020_2fase_dia_1.pdf");
F(2020, "Discursiva", "2ª fase - 2º dia", "fuv2020_2fase_dia_2.pdf");
// 2019
F(2019, "Prova", "1ª fase", "fuvest_2019_primeira_fase.pdf");
F(2019, "Gabarito", "Gabarito oficial", "fuv2019.gabarito.oficial.pdf");
F(2019, "Discursiva", "2ª fase - 1º dia", "fuv2019_2fase_dia1.pdf");
F(2019, "Discursiva", "2ª fase - 2º dia", "fuv2019_2fase_dia2.pdf");
// 2010–2018 (padrão consistente: prova V + gab + 3 dias de 2ª fase)
const fuLegacy = {
  2018: ["fuv2018_1fase_prova_V.pdf", "fuv2018_1fase_prova_gab.pdf", ["fuv2018_2fase_dia1.pdf", "fuv2018_2fase_dia2.pdf", "fuv2018_2fase_dia3.pdf"]],
  2017: ["fuvest_2017_1fase_prova_V.pdf", "fuvest_2017_1fase_prova_gab.pdf", ["fuvest_2017_2fase_dia1.pdf", "fuvest_2017_2fase_dia2.pdf", "fuvest_2017_2fase_dia3.pdf"]],
  2016: ["fuvest_2016_1fase_prova_V.pdf", "fuvest_2016_1fase_prova_gab.pdf", ["fuvest_2016_2fase_dia1.pdf", "fuvest_2016_2fase_dia2.pdf", "fuvest_2016_2fase_dia3.pdf"]],
  2015: ["fuvest_2015_1fase_prova_V.pdf", "fuvest_2015_1fase_prova_gab.pdf", ["fuvest_2015_2fase_dia1.pdf", "fuvest_2015_2fase_dia2.pdf", "fuvest_2015_2fase_dia3.pdf"]],
  2014: ["fuvest_2014_1fase_prova_V.pdf", "fuvest_2014_1fase_prova_gab.pdf", ["fuvest_2014_2fase_dia1.pdf", "fuvest_2014_2fase_dia2.pdf", "fuvest_2014_2fase_dia3.pdf"]],
  2013: ["fuvest_2013_1fase_prova_V.pdf", "fuvest_2013_1fase_prova_gab.pdf", ["fuvest_2013_2fase_dia1.pdf", "fuvest_2013_2fase_dia2.pdf", "fuvest_2013_2fase_dia3.pdf"]],
  2012: ["fuvest_2012_1fase_prova_V.pdf", "fuvest_2012_1fase_prova_gab.pdf", ["fuvest_2012_2fase_dia1.pdf", "fuvest_2012_2fase_dia2.pdf", "fuvest_2012_2fase_dia3.pdf"]],
  2011: ["fuvest_2011_1fase_prova_V.pdf", "fuvest_2011_1fase_prova_gab.pdf", ["fuvest_2011_2fase_dia1.pdf", "fuvest_2011_2fase_dia2.pdf", "fuvest_2011_2fase_dia3.pdf"]],
  2010: ["fuvest_2010_1fase_prova_V.pdf", "fuvest_2010_1fase_prova_gab.pdf", ["fuvest_2010_2fase_dia1.pdf", "fuvest_2010_2fase_dia2.pdf", "fuvest_2010_2fase_dia3.pdf"]],
};
for (const [y, [prova, gab, dias]] of Object.entries(fuLegacy)) {
  const yr = Number(y);
  F(yr, "Prova", "1ª fase (V)", prova);
  F(yr, "Gabarito", "Gabarito 1ª fase", gab);
  dias.forEach((d, i) => F(yr, "Discursiva", `2ª fase - ${i + 1}º dia`, d));
}

// ============================ UNICAMP (COMVEST) — anos confirmados ============================
const U = (y, type, title, url, subject = "Geral") => add("UNICAMP", "UNICAMP", y, type, `UNICAMP ${y} - ${title}`, url, subject);
const C = "https://www.comvest.unicamp.br/";
// 2025
U(2025, "Prova", "1ª fase (Q e Z)", C + "vest2025/F1/f12025Q_Z.pdf");
U(2025, "Gabarito", "Gabarito 1ª fase (Q e Z)", C + "wp-content/uploads/2024/10/QZ_gabarito_2025_FINAL_site.pdf");
U(2025, "Discursiva", "2ª fase - Ciências Biológicas/Saúde", C + "vest2025/F2/provas/2025F2CB.pdf", "Biologia");
U(2025, "Gabarito", "Respostas esperadas 2ª fase (CB/S)", C + "wp-content/uploads/2024/12/Respostas-Esperadas_Dia-2_CBS.pdf", "Biologia");
// 2024
U(2024, "Prova", "1ª fase (Q e Y)", C + "vest2024/F1/f12024Q_Y.pdf");
U(2024, "Gabarito", "Gabarito 1ª fase (Q e Y)", C + "wp-content/uploads/2023/10/Q_Y.pdf");
U(2024, "Discursiva", "2ª fase - Ciências Biológicas/Saúde", C + "vest2024/F2/provas/2024F2CB.pdf", "Biologia");
// 2023
U(2023, "Prova", "1ª fase (Q e Z)", C + "vest2023/F1/f12023Q_Z.pdf");
U(2023, "Gabarito", "Gabarito 1ª fase", C + "wp-content/uploads/2022/11/Gabarito_F1_VEST2023_V2.pdf");
U(2023, "Discursiva", "2ª fase - Ciências Biológicas/Saúde", C + "vest2023/F2/provas/2023F2CB.pdf", "Biologia");
// 2022
U(2022, "Prova", "1ª fase (Q e X)", C + "vest2022/F1/f12022Q_X.pdf");
U(2022, "Gabarito", "Gabarito 1ª fase", C + "wp-content/uploads/2021/11/gabarito_2022_DIVULGA.pdf");
U(2022, "Discursiva", "2ª fase - Ciências Biológicas/Saúde", C + "vest2022/F2/provas/2022F2CB.pdf", "Biologia");
// 2021
U(2021, "Prova", "1ª fase (Q e Z)", C + "vest2021/F1/f12021Q_Z.pdf");
U(2021, "Discursiva", "2ª fase - Ciências Biológicas/Saúde", C + "vest2021/F2/provas/2021F2CB.pdf", "Biologia");
// 2020
U(2020, "Prova", "1ª fase (Q e X)", C + "vest2020/F1/f12020Q_X.pdf");
U(2020, "Discursiva", "2ª fase - Ciências Biológicas/Saúde", C + "vest2020/F2/provas/2020F2CB.pdf", "Biologia");
// 2018
U(2018, "Prova", "1ª fase (Q)", C + "vest2018/F1/f12018Q.pdf");
U(2018, "Gabarito", "Gabarito 1ª fase", C + "vest2018/F1/gabarito2018.pdf");
U(2018, "Discursiva", "2ª fase - Física/Bio/Química", C + "vest2018/F2/provas/fisbioqui.pdf", "Biologia");
// 2010
U(2010, "Prova", "1ª fase - Questões", C + "vest2010/F1/f12010questoes.pdf");
U(2010, "Discursiva", "2ª fase - Português/Biologia", C + "vest2010/F2/provas/portbio.pdf", "Biologia");

// ============================ UFSC (COPERVE) — 2010–2025 ============================
const S = (y, type, title, url) => add("UFSC", "UFSC", y, type, `UFSC ${y} - ${title}`, url);
const ufsc = {
  2010: ["http://www.coperve.ufsc.br/provas_ant/2010-1-amarela.pdf", "http://www.coperve.ufsc.br/provas_ant/2010-gab-3.pdf"],
  2011: ["http://www.coperve.ufsc.br/provas_ant/2011-1-amarela.pdf", "http://www.coperve.ufsc.br/provas_ant/2011-gab-3.pdf"],
  2012: ["http://www.coperve.ufsc.br/provas_ant/2012-1-amarela.pdf", null],
  2013: ["http://www.coperve.ufsc.br/provas_ant/2013-1-amarela.pdf", null],
  2014: ["http://www.coperve.ufsc.br/provas_ant/2014-1-amarela.pdf", null],
  2015: ["http://www.coperve.ufsc.br/provas_ant/2015-1-amarela.pdf", null],
  2016: ["https://repositorio.ufsc.br/bitstream/handle/123456789/157152/2016-1-amarela.pdf", null],
  2017: ["https://repositorio.ufsc.br/bitstream/handle/123456789/171426/2017-1-amarela.pdf", null],
  2018: ["https://php.coperve.ufsc.br/vestibular2018/provas/2018-p1-amarela.pdf", null],
  2019: ["https://repositorio.ufsc.br/bitstream/handle/123456789/192286/2019-p1-amarela.pdf", null],
  2020: ["http://dados.coperve.ufsc.br/vestibular2020/gabaritos/definitivo/prova1/p1-amarela.pdf", null],
  2022: ["http://dados.coperve.ufsc.br/vestibular2022/gabaritos/definitivos/prova1/p1-amarela.pdf", null],
  2023: ["http://dados.coperve.ufsc.br/vestibular2023/gabaritos/preliminar/p1_amarela.pdf", "http://dados.coperve.ufsc.br/vestibular2023/gabaritos/preliminar/gabarito_p1_amarelaPreliminar.pdf"],
  2024: ["http://vestibular2024.paginas.ufsc.br/files/2023/12/p1_amarela.pdf", "http://vestibular2024.paginas.ufsc.br/files/2023/12/novo_gabarito_p1_amarela.pdf"],
  2025: ["https://dados.coperve.ufsc.br/vestibular2025/gabaritos/p1_amarela.pdf", "https://dados.coperve.ufsc.br/vestibular2025/gabaritos/gabarito_p1_amarelaPreliminar.pdf"],
};
for (const [y, [prova, gab]] of Object.entries(ufsc)) {
  const yr = Number(y);
  S(yr, "Prova", "Prova 1 (Amarela)", prova);
  if (gab) S(yr, "Gabarito", "Gabarito Prova 1 (Amarela)", gab);
}

// ============================ OUTPUT ============================
mkdirSync("content", { recursive: true });
writeFileSync("content/materials.json", JSON.stringify(items, null, 2), "utf8");

const esc = (s) => s.replace(/'/g, "''");
const arr = (a) => "ARRAY[" + a.map((t) => `'${esc(t)}'`).join(",") + "]::text[]";
const sql = [];
sql.push("-- ACERTE — Seed de materiais oficiais (import por LINK). Idempotente (dedup por external_url).");
sql.push("-- Pré-requisito: supabase/material_types.sql (tipos + índice único external_url).");
sql.push("");
for (const it of items) {
  const desc = `${it.title}. Fonte oficial: ${it.vestibular}.`;
  sql.push(
    `insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)\n` +
      `values ('${esc(it.title)}', '${esc(desc)}', '${esc(it.vestibular)}', '${esc(it.faculdade)}', ${it.year}, '${esc(it.subject)}', '${esc(it.materialType)}', '${esc(it.externalUrl)}', 'link', 'approved', ${arr(it.tags)})\n` +
      `on conflict (external_url) do nothing;`,
  );
}
sql.push("");
sql.push("select count(*) as materiais_no_banco from public.materials;");
mkdirSync("supabase", { recursive: true });
writeFileSync("supabase/seed_materials.sql", sql.join("\n"), "utf8");

// Prévia + contagens
const byVest = {};
for (const it of items) byVest[it.vestibular] = (byVest[it.vestibular] ?? 0) + 1;
console.log("== PRÉVIA — 20 primeiros itens ==");
items.slice(0, 20).forEach((it, i) =>
  console.log(
    `${String(i + 1).padStart(2)}. [${it.vestibular} ${it.year} ${it.materialType}] ${it.title}\n    ${it.externalUrl}`,
  ),
);
console.log("\n== TOTAIS ==");
console.log("Total de materiais:", items.length);
for (const [v, n] of Object.entries(byVest)) console.log(`  ${v}: ${n}`);
console.log("\nArquivos gerados: content/materials.json, supabase/seed_materials.sql");
