/**
 * AcertaVest — Ingestão LOCAL (sem API do Telegram).
 *
 * Lê PDFs de uma pasta local (recursivo), extrai texto, classifica e
 * deduplica por sha256 — gerando content/import-local/curated.json, no mesmo
 * formato do pipeline do Telegram. Depois reaproveite OCR, IA e import:
 *
 *   node scripts/import-local/ingest.mjs ./minha-pasta-de-pdfs
 *   node scripts/import-local/ocr.mjs --dry        # opcional
 *   node scripts/import-local/ai.mjs --dry         # opcional
 *   node scripts/import-local/import.mjs --dry
 *
 * A pasta pode ser, inclusive, a pasta "files" de um export do Telegram
 * Desktop — o que cobre o caso "Export do Telegram" sem precisar de api_id.
 *
 * pdf-parse é opcional (npm i -D pdf-parse): sem ele, classifica por nome.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, basename, relative } from "node:path";
import { createHash } from "node:crypto";

// Pipeline local usa seu próprio diretório de cache (definido ANTES de usar a lib).
process.env.CACHE_DIR = process.env.CACHE_DIR || join("content", "import-local", "cache");

const { log, writeTextCache } = await import("../telegram/lib.mjs");
const { classify } = await import("../telegram/classify-lib.mjs");

const srcDir = process.argv.find((a) => !a.startsWith("-") && a !== process.argv[0] && a !== process.argv[1])
  || process.env.IMPORT_LOCAL_DIR;

if (!srcDir) {
  log("FAIL", "Informe a pasta: node scripts/import-local/ingest.mjs <pasta-com-pdfs>");
  process.exit(1);
}
if (!existsSync(srcDir) || !statSync(srcDir).isDirectory()) {
  log("FAIL", `Pasta inválida: ${srcDir}`);
  process.exit(1);
}

const OUT_DIR = join("content", "import-local");
const CURATED = join(OUT_DIR, "curated.json");
mkdirSync(OUT_DIR, { recursive: true });

let pdfParse = null;
try {
  pdfParse = (await import("pdf-parse")).default;
} catch {
  log("•", "pdf-parse não instalado — classificando só por nome/pasta. (npm i -D pdf-parse)");
}

// Coleta recursiva de PDFs.
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (name.toLowerCase().endsWith(".pdf")) acc.push(full);
  }
  return acc;
}

const files = walk(srcDir);
log("•", `${files.length} PDF(s) encontrados em ${srcDir}`);

async function extractText(localPath) {
  if (!pdfParse) return "";
  try {
    const data = await pdfParse(readFileSync(localPath), { max: 3 });
    return (data.text || "").replace(/\s+/g, " ").trim().slice(0, 3000);
  } catch {
    return "";
  }
}

// Preserva edições anteriores (merge por sha256).
const prev = existsSync(CURATED)
  ? new Map(JSON.parse(readFileSync(CURATED, "utf8")).map((it) => [it.key, it]))
  : new Map();

const byHash = new Map();
let needOcrCount = 0;

for (const localPath of files) {
  const bytes = readFileSync(localPath);
  const hash = createHash("sha256").update(bytes).digest("hex");
  const rel = relative(srcDir, localPath);

  if (byHash.has(hash)) {
    byHash.get(hash).sources.push(rel); // duplicata exata: agrega origem
    continue;
  }
  if (prev.has(hash)) {
    byHash.set(hash, prev.get(hash)); // mantém seus ajustes
    continue;
  }

  const pdfText = await extractText(localPath);
  writeTextCache(hash, pdfText); // alimenta OCR e IA

  const fields = classify({
    fileName: basename(localPath),
    caption: rel.split(/[\\/]/).join(" "), // pasta vira contexto (editora/univ)
    pdfText: pdfParse ? pdfText : null,
    editoraHint: null,
    hash,
  });
  if (fields.needsOcr) needOcrCount++;

  byHash.set(hash, {
    key: hash,
    skip: false,
    ...fields,
    localPath,
    sizeBytes: statSync(localPath).size,
    sha256: hash,
    sources: [rel],
  });
}

const curated = [...byHash.values()];
writeFileSync(CURATED, JSON.stringify(curated, null, 2));

const byType = {};
const byUni = {};
let alta = 0;
for (const it of curated) {
  byType[it.materialType] = (byType[it.materialType] || 0) + 1;
  byUni[it.faculdade] = (byUni[it.faculdade] || 0) + 1;
  if (it.priority === "alta") alta++;
}
log("PASS", `${curated.length} itens únicos (de ${files.length} PDFs) em ${CURATED}`);
console.log("   Prioridade alta:", alta);
console.log("   Por tipo:", byType);
console.log("   Por universidade:", byUni);
if (needOcrCount) console.log(`   ⚠️  ${needOcrCount} PDF(s) parecem escaneados — rode: node scripts/import-local/ocr.mjs`);
console.log("   ⚠️  Revise o curated.json e marque skip:true antes de importar.");
