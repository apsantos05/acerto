/**
 * Classificação por IA para o pipeline LOCAL — reaproveita
 * scripts/telegram/ai-classify.mjs apontando para content/import-local/.
 *   node scripts/import-local/ai.mjs --dry
 *   node scripts/import-local/ai.mjs
 */
import { join } from "node:path";
process.env.CURATED_PATH = process.env.CURATED_PATH || join("content", "import-local", "curated.json");
process.env.CACHE_DIR = process.env.CACHE_DIR || join("content", "import-local", "cache");
await import("../telegram/ai-classify.mjs");
