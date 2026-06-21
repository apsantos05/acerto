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

// Normalização de título — espelha src/lib/title.ts (mantenha em sincronia).
const TITLE_ACRONYMS = new Set([
  "ENEM", "SISU", "FUVEST", "USP", "UNICAMP", "UNESP", "UFMG", "UNIFESP",
  "UFRJ", "UFSC", "UFPR", "FAMERP", "FAMEMA", "UFSCAR", "PUC", "PUC-SP",
  "UECE", "ITA", "IME", "SP", "RJ", "MG", "SC", "PR", "BR", "COC", "SAS",
  "II", "III", "IV", "V", "VI",
]);
const TITLE_CONTEXT = /\b(conte[úu]do|quest[õo]es|exerc[íi]cios|gabarito|revis[ãa]o|resumo|caderno|corre[çc][ãa]o|simulado|prova|lista|teoria)\b/i;
const TITLE_SMALL = new Set(["de", "da", "do", "das", "dos", "e", "em", "para", "com", "a", "o", "na", "no", "ao", "aos"]);
const TITLE_QUANTITY = new Set([
  "questões", "questoes", "exercícios", "exercicios", "mapas", "resumos", "resumo",
  "aulas", "aula", "provas", "prova", "simulados", "simulado", "listas", "lista",
  "páginas", "paginas", "atividades", "vídeos", "videos", "flashcards",
]);

export function stripArtificialPrefix(title) {
  let t = (title || "").trim();
  for (let i = 0; i < 3; i++) {
    const m = t.match(/^(\d{1,4})(\s+[A-Za-z])?\s+(\S[\s\S]*)$/);
    if (!m) break;
    const n = Number(m[1]);
    if (n >= 1900 && n <= 2099) break;
    const nextWord = m[3].split(/\s+/)[0]?.toLowerCase() ?? "";
    if (TITLE_QUANTITY.has(nextWord)) break; // contagem ("1000 questões"): mantém
    t = m[3].trim();
  }
  return t;
}

function titleIsMixedCase(t) {
  let hasUpper = false;
  let hasLower = false;
  for (const ch of t) {
    if (!/[a-zà-ÿ]/i.test(ch)) continue;
    if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) hasUpper = true;
    else if (ch === ch.toLowerCase() && ch !== ch.toUpperCase()) hasLower = true;
    if (hasUpper && hasLower) return true;
  }
  return false;
}

function titleCaseRaw(t) {
  const words = t.split(/\s+/).map((w, idx) => {
    if (TITLE_ACRONYMS.has(w.toUpperCase())) return w.toUpperCase();
    if (/[0-9]/.test(w)) return w;
    const letters = w.replace(/[^a-zà-ÿ]/gi, "");
    if (letters.length === 0) return w;
    if (letters.length === 1) return w; // letra isolada — preserva
    const lower = w.toLowerCase();
    if (idx > 0 && TITLE_SMALL.has(letters.toLowerCase())) return lower;
    return lower.replace(/[a-zà-ÿ]/i, (c) => c.toUpperCase());
  });
  let out = words.join(" ");
  const marker = out.match(TITLE_CONTEXT);
  if (marker && marker.index && marker.index > 0) {
    const before = out.slice(0, marker.index).trim();
    const after = out.slice(marker.index).trim();
    if (/[a-zà-ÿ]{3,}/i.test(before) && !/[—–-]$/.test(before)) {
      out = `${before} — ${after}`;
    }
  }
  return out;
}

export function normalizeTitle(raw) {
  if (!raw) return "";
  const original = String(raw).trim();
  let t = original;
  t = t.replace(/\.?pdf$/i, "").trim();
  t = t.replace(/_+/g, " ").replace(/\bdownload\b/gi, " ").replace(/\(\d+\)\s*$/, "").replace(/\s+/g, " ").trim();
  t = stripArtificialPrefix(t);
  if (!titleIsMixedCase(t)) t = titleCaseRaw(t);
  return (t.trim() || original).slice(0, 160);
}

export function cleanTitle(fileName, caption) {
  const base = (fileName || "").replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const cap = (caption || "").split(/\r?\n/)[0]?.trim();
  const title = base.length >= 6 ? base : cap || base || "Material";
  return normalizeTitle(title).slice(0, 120) || "Material";
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
