/**
 * Heurísticos de classificação compartilhados (nome + legenda + texto do PDF).
 * Usado por normalize.mjs (1ª passada), ocr.mjs (após OCR) e como fallback
 * quando a IA falha. Os códigos/limites espelham material-options + o SQL.
 */

// Universidade prioritária (faculdade canônica) -> vestibular. Ordem importa.
export const UNIVERSITIES = [
  [/fuvest|\busp\b/, "USP", "FUVEST"],
  [/comvest|unicamp/, "UNICAMP", "UNICAMP"],
  [/unifesp/, "UNIFESP", "UNIFESP"],
  [/vunesp|unesp/, "UNESP", "UNESP"],
  [/ufmg/, "UFMG", "UFMG"],
  [/famerp/, "FAMERP", "FAMERP"],
  [/famema/, "FAMEMA", "FAMEMA"],
  [/ufrj/, "UFRJ", "UFRJ"],
  [/ufscar/, "UFSCAR", "UFSCAR"],
  [/ufsc/, "UFSC", "UFSC"],
  [/ufpr/, "UFPR", "UFPR"],
  [/einstein/, "ALBERT EINSTEIN", "ALBERT EINSTEIN"],
  [/santa\s*casa/, "SANTA CASA", "SANTA CASA"],
  [/mandic/, "SLMANDIC", "MANDIC"],
  [/puc[\s-]*sp|pucsp/, "PUC-SP", "PUC-SP"],
  [/\bpuc\b/, "PUC", "PUC"],
  [/enem/, "ENEM / SISU", "ENEM"],
];

export const PRIORITY_UNIS = new Set([
  "USP", "UNICAMP", "UNESP", "UFMG", "UNIFESP", "FAMERP", "UFRJ", "UFSC",
  "UFPR", "PUC", "PUC-SP", "ALBERT EINSTEIN", "SANTA CASA", "SLMANDIC",
]);

export const EDITORAS = [
  [/bernoulli/, "Bernoulli"],
  [/poliedro/, "Poliedro"],
  [/hexag/, "Hexag"],
  [/farias\s*brito/, "Farias Brito"],
  [/\bcoc\b/, "COC"],
  [/\banglo\b/, "Anglo"],
  [/objetivo/, "Objetivo"],
  [/\betapa\b/, "Etapa"],
  [/\bsas\b/, "SAS"],
  [/ari\s*de\s*s[áa]/, "Ari de Sá"],
];
export const PRIORITY_EDITORAS = new Set([
  "Bernoulli", "Poliedro", "Hexag", "Farias Brito", "COC", "Anglo",
  "Objetivo", "SAS", "Ari de Sá",
]);

export const SUBJECTS = [
  [/biolog/, "Biologia"], [/qu[íi]mic/, "Química"], [/f[íi]sic/, "Física"],
  [/matem[áa]t/, "Matemática"], [/hist[óo]ri/, "História"], [/geografi/, "Geografia"],
  [/portugu|gram[áa]tic/, "Português"], [/literatur/, "Literatura"], [/reda[çc]/, "Redação"],
  [/filosofi/, "Filosofia"], [/sociolog/, "Sociologia"], [/ingl[êe]s/, "Inglês"],
];

// Universidades e matérias válidas (para a IA escolher entre opções fechadas).
export const VALID_FACULDADES = [
  "USP", "UNICAMP", "UNESP", "UFMG", "UNIFESP", "FAMERP", "UFRJ", "UFSC",
  "UFPR", "PUC", "PUC-SP", "ALBERT EINSTEIN", "SANTA CASA", "SLMANDIC",
  "ENEM / SISU", "Geral",
];
export const VALID_SUBJECTS = [
  "Matemática", "Português", "Literatura", "Redação", "Biologia", "Química",
  "Física", "História", "Geografia", "Filosofia", "Sociologia", "Inglês", "Geral",
];
export const VALID_TYPES = [
  "Apostila", "Material teórico", "Resumo", "Revisão", "Mapa mental",
  "Lista de exercícios", "Caderno de questões", "Questões discursivas",
  "Questões objetivas", "Simulado", "Prova", "Gabarito", "Correção comentada",
  "Redação",
];

function pick(text, table, fallback) {
  for (const [re, val] of table) if (re.test(text)) return val;
  return fallback;
}

export function guessUniversity(text) {
  for (const [re, faculdade, vestibular] of UNIVERSITIES) {
    if (re.test(text)) return { faculdade, vestibular };
  }
  return { faculdade: "Geral", vestibular: "Todos" };
}

export function guessType(text) {
  if (/gabarito|resolu[çc]|resolvid/.test(text)) return "Gabarito";
  if (/corre[çc][ãa]o\s*coment|coment[ad]/.test(text)) return "Correção comentada";
  if (/simulad/.test(text)) return "Simulado";
  if (/caderno\s*de\s*quest/.test(text)) return "Caderno de questões";
  if (/discursiv/.test(text)) return "Questões discursivas";
  if (/objetiv/.test(text)) return "Questões objetivas";
  if (/lista|exerc[íi]cio/.test(text)) return "Lista de exercícios";
  if (/revis[ãa]/.test(text)) return "Revisão";
  if (/resumo|s[íi]ntese|esquematiz/.test(text)) return "Resumo";
  if (/mapa\s*mental/.test(text)) return "Mapa mental";
  if (/reda[çc]/.test(text)) return "Redação";
  if (/\bprova\b|vestibular/.test(text)) return "Prova";
  if (/teoria|te[óo]ric|m[óo]dulo|cap[íi]tulo|frente/.test(text)) return "Material teórico";
  return "Apostila";
}

export function guessSubject(text) {
  return pick(text, SUBJECTS, "Geral");
}

export function guessEditora(text, hint) {
  return hint || pick(text, EDITORAS, null);
}

export function guessDifficulty(text) {
  if (/dif[íi]cil|avan[çc]ad|aprofund|extensiv/.test(text)) return "difícil";
  if (/b[áa]sic|f[áa]cil|introdut|iniciante/.test(text)) return "fácil";
  return "média";
}

export function guessYear(text) {
  const m = text.match(/\b(19\d{2}|20\d{2})\b/);
  return m ? Number(m[1]) : new Date().getFullYear();
}

export function computePriority(faculdade, editora) {
  return PRIORITY_UNIS.has(faculdade) || (editora && PRIORITY_EDITORAS.has(editora))
    ? "alta"
    : "normal";
}

const STOPWORDS = new Set([
  "para", "como", "com", "sem", "dos", "das", "uma", "uns", "que", "por", "pdf",
  "the", "and", "vol", "ano", "pages", "page", "edição", "edicao", "completo",
]);

export function keywordsFrom(text, extras) {
  const freq = new Map();
  for (const w of text.toLowerCase().match(/[a-záàâãéêíóôõúüç]{4,}/gi) || []) {
    if (STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map((e) => e[0]);
  return [...new Set([...extras.filter(Boolean).map((s) => String(s).toLowerCase()), ...top])].slice(0, 10);
}

export function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function cleanTitle(fileName, caption) {
  const base = (fileName || "").replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const cap = (caption || "").split(/\r?\n/)[0]?.trim();
  const title = base.length >= 6 ? base : cap || base || "Material";
  return title.slice(0, 120);
}

// Classificação completa por heurística. `hash` entra no slug para unicidade.
export function classify({ fileName, caption, pdfText, editoraHint, hash }) {
  const text = `${fileName || ""} ${caption || ""} ${pdfText || ""} ${editoraHint || ""}`.toLowerCase();
  const { faculdade, vestibular } = guessUniversity(text);
  const subject = guessSubject(text);
  const materialType = guessType(text);
  const editora = guessEditora(text, editoraHint);
  const year = guessYear(text);
  const difficulty = guessDifficulty(text);
  const priority = computePriority(faculdade, editora);
  const needsOcr = pdfText != null && pdfText.length < 40;

  const title = cleanTitle(fileName, caption);
  const keywords = keywordsFrom(text, [vestibular, subject, materialType, editora]);
  const slug = `${slugify(`${title}-${vestibular}-${year}-${materialType}`)}-${String(hash).slice(0, 6)}`;
  const place = faculdade !== "Geral" ? faculdade : vestibular;
  const snippet = pdfText ? ` ${pdfText.slice(0, 160).trim()}…` : "";
  const description =
    `${materialType} de ${subject}${editora ? ` (${editora})` : ""} — ${place} ${year}.${snippet}`.trim();

  return {
    title, subject, materialType, faculdade, vestibular, year, editora,
    difficulty, priority, keywords, slug, description, summary: null, needsOcr,
  };
}
