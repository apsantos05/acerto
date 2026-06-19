/**
 * Importação para o pipeline LOCAL — reaproveita
 * scripts/telegram/import-materials.mjs apontando para content/import-local/.
 * Mesmas variáveis (SUPABASE_SERVICE_ROLE_KEY, IMPORT_OWNER_USERNAME,
 * IMPORT_STATUS, IMPORT_MAX_MB) e flags.
 *   node scripts/import-local/import.mjs --dry
 *   node scripts/import-local/import.mjs
 */
import { join } from "node:path";
process.env.CURATED_PATH = process.env.CURATED_PATH || join("content", "import-local", "curated.json");
process.env.CACHE_DIR = process.env.CACHE_DIR || join("content", "import-local", "cache");
await import("../telegram/import-materials.mjs");
