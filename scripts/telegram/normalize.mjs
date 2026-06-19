/**
 * Acerte — Etapa 2: classificar e organizar os PDFs do manifesto.
 *
 * Heurísticas (nome do arquivo + legenda + texto extraído do PDF) inferem
 * universidade, vestibular, matéria, ano, tipo, editora, dificuldade,
 * prioridade, palavras-chave, slug e descrição. Deduplica por sha256.
 *
 * Extração de texto do PDF é opcional (degrada com elegância):
 *   npm i -D pdf-parse
 * Sem ela, classifica só por nome/legenda. PDFs escaneados (sem texto) ficam
 * com "needsOcr": true — rode depois: node scripts/telegram/ocr.mjs
 *
 * Uso:
 *   node scripts/telegram/normalize.mjs
 *
 * Gera content/telegram/curated.json — REVISE antes de importar e marque
 * "skip": true no que não deve entrar. Reexecutar preserva suas edições.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { log, writeTextCache } from "./lib.mjs";
import { classify } from "./classify-lib.mjs";

const OUT_DIR = join("content", "telegram");
const MANIFEST = join(OUT_DIR, "manifest.json");
const CURATED = join(OUT_DIR, "curated.json");

if (!existsSync(MANIFEST)) {
  log("FAIL", `Manifesto não encontrado (${MANIFEST}). Rode antes: node scripts/telegram/pull-telegram.mjs`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

let pdfParse = null;
try {
  pdfParse = (await import("pdf-parse")).default;
} catch {
  log("•", "pdf-parse não instalado — classificando só por nome/legenda. (npm i -D pdf-parse)");
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
  writeTextCache(hash, pdfText); // alimenta OCR e IA

  const fields = classify({
    fileName: head.fileName,
    caption: head.caption,
    pdfText: pdfParse ? pdfText : null, // null = não sabemos se precisa OCR
    editoraHint,
    hash,
  });
  if (fields.needsOcr) needOcrCount++;

  curated.push({
    key: hash,
    skip: false,
    ...fields,
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
if (needOcrCount) console.log(`   ⚠️  ${needOcrCount} PDF(s) parecem escaneados (needsOcr) — rode: node scripts/telegram/ocr.mjs`);
console.log("   ⚠️  Revise o curated.json e marque skip:true onde precisar antes de importar.");
