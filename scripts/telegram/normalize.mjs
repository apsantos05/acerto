/**
 * Acerte — Etapa 2: classificar e organizar os PDFs do manifesto.
 *
 * Heurísticas (nome do arquivo + legenda + texto extraído do PDF) para
 * inferir: universidade, vestibular, matéria, ano, tipo, editora/banca,
 * dificuldade, prioridade, palavras-chave, slug e descrição. Deduplica por
 * sha256 (mesmo arquivo em canais diferentes vira 1 item).
 *
 * Extração de texto do PDF é opcional (degrada com elegância):
 *   npm i -D pdf-parse
 * Sem ela, classifica só por nome/legenda. OCR de PDFs escaneados é marcado
 * em "needsOcr": true para tratamento futuro.
 *
 * Uso:
 *   node scripts/telegram/normalize.mjs
 *
 * Gera content/telegram/curated.json — REVISE antes de importar e marque
 * "skip": true no que não deve entrar. Reexecutar preserva suas edições.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { log } from "./lib.mjs";

const OUT_DIR = join("content", "telegram");
const MANIFEST = join(OUT_DIR, "manifest.json");
const CURATED = join(OUT_DIR, "curated.json");

if (!existsSync(MANIFEST)) {
  log("FAIL", `Manifesto não encontrado (${MANIFEST}). Rode antes: node scripts/telegram/pull-telegram.mjs`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

// Extração de texto opcional via pdf-parse.
let pdfParse = null;
try {
  pdfParse = (await import("pdf-parse")).default;
} catch {
  log("•", "pdf-parse não instalado — classificando só por nome/legenda. (npm i -D pdf-parse para extrair texto)");
}

// ---------------- tabelas de classificação ----------------
// Universidades prioritárias (faculdade canônica) e seus vestibulares.
// Ordem importa (mais específico primeiro).
const UNIVERSITIES = [
  [/fuvest|\busp\b/, "USP", "FUVEST", true],
  [/comvest|unicamp/, "UNICAMP", "UNICAMP", true],
  [/unifesp/, "UNIFESP", "UNIFESP", true],
  [/vunesp|unesp/, "UNESP", "UNESP", true],
  [/ufmg/, "UFMG", "UFMG", true],
  [/famerp/, "FAMERP", "FAMERP", true],
  [/famema/, "FAMEMA", "FAMEMA", false],
  [/ufrj/, "UFRJ", "UFRJ", true],
  [/ufscar/, "UFSCAR", "UFSCAR", false],
  [/ufsc/, "UFSC", "UFSC", true],
  [/ufpr/, "UFPR", "UFPR", true],
  [/einstein/, "ALBERT EINSTEIN", "ALBERT EINSTEIN", true],
  [/santa\s*casa/, "SANTA CASA", "SANTA CASA", true],
  [/mandic/, "SLMANDIC", "MANDIC", true],
  [/puc[\s-]*sp|pucsp/, "PUC-SP", "PUC-SP", true],
  [/\bpuc\b/, "PUC", "PUC", true],
  [/enem/, "ENEM / SISU", "ENEM", false],
];

const PRIORITY_UNIS = new Set([
  "USP", "UNICAMP", "UNESP", "UFMG", "UNIFESP", "FAMERP", "UFRJ", "UFSC",
  "UFPR", "PUC", "PUC-SP", "ALBERT EINSTEIN", "SANTA CASA", "SLMANDIC",
]);

// Editoras (qualidade máxima em destaque).
const EDITORAS = [
  [/bernoulli/, "Bernoulli"],
  [/poliedro/, "Poliedro"],
  [/hexag/, "Hexag"],
  [/farias\s*brito/, "Farias Brito"],
  [/\bcoc\b/, "COC"],
  [/\banglo\b/, "Anglo"],
  [/objetivo/, "Objetivo"],
  [/\betapa\b/, "Etapa"],
  [/\bsas\b/, "SAS"],
];
const PRIORITY_EDITORAS = new Set([
  "Bernoulli", "Poliedro", "Hexag", "Farias Brito", "COC", "Anglo", "Objetivo",
]);

const SUBJECTS = [
  [/biolog/, "Biologia"], [/qu[íi]mic/, "Química"], [/f[íi]sic/, "Física"],
  [/matem[áa]t/, "Matemática"], [/hist[óo]ri/, "História"], [/geografi/, "Geografia"],
  [/portugu|gram[áa]tic/, "Português"], [/literatur/, "Literatura"], [/reda[çc]/, "Redação"],
  [/filosofi/, "Filosofia"], [/sociolog/, "Sociologia"], [/ingl[êe]s/, "Inglês"],
];

function pick(text, table, fallback) {
  for (const [re, val] of table) if (re.test(text)) return val;
  return fallback;
}

function guessUniversity(text) {
  for (const [re, faculdade, vestibular] of UNIVERSITIES) {
    if (re.test(text)) return { faculdade, vestibular };
  }
  return { faculdade: "Geral", vestibular: "Todos" };
}

function guessType(text) {
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

function guessDifficulty(text) {
  if (/dif[íi]cil|avan[çc]ad|aprofund|extensiv/.test(text)) return "difícil";
  if (/b[áa]sic|f[áa]cil|introdut|iniciante/.test(text)) return "fácil";
  return "média";
}

function guessYear(text) {
  const m = text.match(/\b(19\d{2}|20\d{2})\b/);
  return m ? Number(m[1]) : new Date().getFullYear();
}

const STOPWORDS = new Set([
  "para", "como", "com", "sem", "dos", "das", "uma", "uns", "que", "por", "pdf",
  "the", "and", "vol", "ano", "pages", "page", "edição", "edicao", "completo",
]);

function keywordsFrom(text, extras) {
  const freq = new Map();
  for (const w of text.toLowerCase().match(/[a-záàâãéêíóôõúüç]{4,}/gi) || []) {
    if (STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map((e) => e[0]);
  return [...new Set([...extras.filter(Boolean).map((s) => String(s).toLowerCase()), ...top])].slice(0, 10);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function cleanTitle(fileName, caption) {
  const base = fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const cap = caption.split(/\r?\n/)[0]?.trim();
  const title = base.length >= 6 ? base : cap || base || "Material";
  return title.slice(0, 120);
}

async function extractText(localPath) {
  if (!pdfParse || !existsSync(localPath)) return "";
  try {
    const data = await pdfParse(readFileSync(localPath), { max: 3 });
    return (data.text || "").replace(/\s+/g, " ").trim().slice(0, 3000);
  } catch {
    return "";
  }
}

// Preserva edições anteriores (merge pela chave sha256).
const prev = existsSync(CURATED)
  ? new Map(JSON.parse(readFileSync(CURATED, "utf8")).map((it) => [it.key, it]))
  : new Map();

// Dedup por hash: agrupa o mesmo arquivo vindo de canais diferentes.
const groups = new Map();
for (const m of manifest) {
  const h = m.sha256 || m.key;
  if (!groups.has(h)) groups.set(h, []);
  groups.get(h).push(m);
}

const curated = [];
let needOcrCount = 0;

for (const [hash, group] of groups) {
  if (prev.has(hash)) {
    curated.push(prev.get(hash)); // mantém seus ajustes
    continue;
  }

  const head = group[0];
  const editoraHint = group.map((g) => g.editora).find(Boolean) || null;
  const pdfText = await extractText(head.localPath);
  const text = `${head.fileName} ${head.caption} ${pdfText} ${editoraHint || ""}`.toLowerCase();

  const { faculdade, vestibular } = guessUniversity(text);
  const subject = pick(text, SUBJECTS, "Geral");
  const materialType = guessType(text);
  const editora = editoraHint || pick(text, EDITORAS, null);
  const year = guessYear(text);
  const difficulty = guessDifficulty(text);
  const priority =
    PRIORITY_UNIS.has(faculdade) || (editora && PRIORITY_EDITORAS.has(editora)) ? "alta" : "normal";
  const needsOcr = pdfParse ? pdfText.length < 40 : false;
  if (needsOcr) needOcrCount++;

  const title = cleanTitle(head.fileName, head.caption);
  const keywords = keywordsFrom(text, [vestibular, subject, materialType, editora]);
  const slug = `${slugify(`${title}-${vestibular}-${year}-${materialType}`)}-${hash.slice(0, 6)}`;
  const place = faculdade !== "Geral" ? faculdade : vestibular;
  const snippet = pdfText ? ` ${pdfText.slice(0, 160).trim()}…` : "";
  const description =
    `${materialType} de ${subject}${editora ? ` (${editora})` : ""} — ${place} ${year}.${snippet}`.trim();

  curated.push({
    key: hash,
    skip: false,
    title,
    subject,
    materialType,
    faculdade,
    vestibular,
    year,
    editora,
    difficulty,
    priority,
    keywords,
    slug,
    description,
    needsOcr,
    localPath: head.localPath,
    sizeBytes: head.sizeBytes,
    sha256: hash,
    sources: group.map((g) => g.source),
  });
}

writeFileSync(CURATED, JSON.stringify(curated, null, 2));

const byType = {};
const byUni = {};
let alta = 0;
for (const it of curated) {
  byType[it.materialType] = (byType[it.materialType] || 0) + 1;
  byUni[it.faculdade] = (byUni[it.faculdade] || 0) + 1;
  if (it.priority === "alta") alta++;
}
log("PASS", `${curated.length} itens únicos (de ${manifest.length} PDFs) em ${CURATED}`);
console.log("   Prioridade alta:", alta);
console.log("   Por tipo:", byType);
console.log("   Por universidade:", byUni);
if (needOcrCount) console.log(`   ⚠️  ${needOcrCount} PDF(s) parecem escaneados (needsOcr) — classificados só por nome/legenda.`);
console.log("   ⚠️  Revise o curated.json e marque skip:true onde precisar antes de importar.");
