/**
 * OCR para o pipeline LOCAL — reaproveita scripts/telegram/ocr.mjs apontando
 * para content/import-local/. Mesmos requisitos (Tesseract + Poppler) e flags.
 *   node scripts/import-local/ocr.mjs --dry
 *   node scripts/import-local/ocr.mjs
 */
import { join } from "node:path";
process.env.CURATED_PATH = process.env.CURATED_PATH || join("content", "import-local", "curated.json");
process.env.CACHE_DIR = process.env.CACHE_DIR || join("content", "import-local", "cache");
await import("../telegram/ocr.mjs");
