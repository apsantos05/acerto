/**
 * Acerte — Etapa 2.5 (opcional): OCR de PDFs escaneados.
 *
 * Detecta PDFs sem camada de texto (needsOcr=true ou cache de texto vazio),
 * roda OCR e reclassifica esses itens. Marca needsOcr=false ao terminar.
 *
 * Requer dois binários de SISTEMA (degrada com erro claro se ausentes):
 *   - Tesseract OCR  (com o idioma português: traineddata "por")
 *   - Poppler        (fornece o pdftoppm, que rasteriza o PDF em imagens)
 * Veja o README para instalar no Windows.
 *
 * Config opcional (.env.local ou env):
 *   OCR_LANG=por           idioma do Tesseract
 *   OCR_MAX_PAGES=3        nº de páginas rasterizadas por PDF (custo/tempo)
 *   OCR_DPI=200            resolução da rasterização
 *
 * Uso:
 *   node scripts/telegram/ocr.mjs --dry   (lista o que faria)
 *   node scripts/telegram/ocr.mjs         (executa o OCR)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { loadEnv, log, writeTextCache, readTextCache } from "./lib.mjs";
import { classify } from "./classify-lib.mjs";

const env = { ...loadEnv(), ...process.env };
const DRY = process.argv.includes("--dry");
const LANG = env.OCR_LANG || "por";
const MAX_PAGES = Number(env.OCR_MAX_PAGES) || 3;
const DPI = Number(env.OCR_DPI) || 200;

const OUT_DIR = join("content", "telegram");
const CURATED = join(OUT_DIR, "curated.json");
const TMP = join(OUT_DIR, "cache", "ocr-tmp");

if (!existsSync(CURATED)) {
  log("FAIL", `${CURATED} não existe. Rode antes: node scripts/telegram/normalize.mjs`);
  process.exit(1);
}

function which(bin, args) {
  try {
    execFileSync(bin, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const hasTesseract = which("tesseract", ["--version"]);
const hasPdftoppm = which("pdftoppm", ["-v"]);

if (!DRY && (!hasTesseract || !hasPdftoppm)) {
  if (!hasTesseract) log("FAIL", "Tesseract não encontrado no PATH. Instale (veja o README).");
  if (!hasPdftoppm) log("FAIL", "pdftoppm (Poppler) não encontrado no PATH. Instale (veja o README).");
  process.exit(1);
}

const items = JSON.parse(readFileSync(CURATED, "utf8"));

// Alvos: marcados needsOcr, ou sem texto em cache.
function needsOcr(it) {
  if (it.skip) return false;
  if (it.needsOcr) return true;
  const cached = readTextCache(it.sha256 || it.key);
  return !cached || cached.trim().length < 40;
}

const targets = items.filter(needsOcr);
log("•", `${targets.length} item(ns) candidato(s) a OCR (de ${items.length}).`);

if (DRY) {
  for (const it of targets) log("•", `[dry] OCR: ${it.title}`);
  log("PASS", `Prévia: ${targets.length} item(ns) seriam processados (lang=${LANG}, ${MAX_PAGES} págs).`);
  process.exit(0);
}

mkdirSync(TMP, { recursive: true });

function ocrPdf(localPath) {
  const prefix = join(TMP, "page");
  // limpa restos anteriores
  for (const f of existsSync(TMP) ? readdirSync(TMP) : []) rmSync(join(TMP, f), { force: true });
  execFileSync("pdftoppm", ["-png", "-r", String(DPI), "-f", "1", "-l", String(MAX_PAGES), localPath, prefix]);

  const pngs = readdirSync(TMP).filter((f) => f.endsWith(".png")).sort();
  let text = "";
  for (const png of pngs) {
    let out = "";
    try {
      out = execFileSync("tesseract", [join(TMP, png), "stdout", "-l", LANG], { encoding: "utf8" });
    } catch {
      // idioma ausente? tenta sem -l (default eng)
      try {
        out = execFileSync("tesseract", [join(TMP, png), "stdout"], { encoding: "utf8" });
      } catch {
        out = "";
      }
    }
    text += " " + out;
  }
  return text.replace(/\s+/g, " ").trim().slice(0, 4000);
}

let ok = 0;
let empty = 0;
let failed = 0;
const byKey = new Map(items.map((it) => [it.sha256 || it.key, it]));

for (const it of targets) {
  const hash = it.sha256 || it.key;
  try {
    if (!existsSync(it.localPath)) {
      log("SKIP", `arquivo ausente: ${it.title}`);
      continue;
    }
    const text = ocrPdf(it.localPath);
    writeTextCache(hash, text);

    if (text.length < 40) {
      it.needsOcr = false; // processado, mas sem texto aproveitável
      empty++;
      log("•", `OCR vazio (imagem sem texto?): ${it.title}`);
      continue;
    }

    // Reclassifica com o texto recuperado (preserva skip).
    const editoraHint = it.editora || null;
    const fields = classify({
      fileName: it.title,
      caption: "",
      pdfText: text,
      editoraHint,
      hash,
    });
    Object.assign(it, fields, { needsOcr: false });
    byKey.set(hash, it);
    ok++;
    log("PASS", `OCR + reclassificado: ${it.faculdade} · ${it.materialType} · ${it.title}`.slice(0, 90));
  } catch (e) {
    failed++;
    log("FAIL", `${it.title} — ${e.message}`);
  }
}

writeFileSync(CURATED, JSON.stringify(items, null, 2));
try {
  rmSync(TMP, { recursive: true, force: true });
} catch {
  /* limpeza best-effort */
}

console.log(`\n== OCR: ${ok} reclassificados · ${empty} sem texto · ${failed} falhas ==`);
process.exit(failed > 0 ? 1 : 0);
