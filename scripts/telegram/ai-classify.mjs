/**
 * Acerte — Etapa 2.7 (opcional): classificação/resumo por IA (Claude Haiku).
 *
 * Para cada material ainda pendente (não importado, não skip), gera com IA:
 * resumo curto, descrição, tags, dificuldade, matéria, vestibular e
 * universidade relacionada — e mescla no curated.json.
 *
 * Controle de custo (todos ativos por padrão):
 *   - só processa itens pendentes do curated.json (não toca em aprovados);
 *   - cache por sha256: NÃO reprocessa o mesmo PDF (content/telegram/cache/ai/);
 *   - limita o texto enviado (AI_MAX_CHARS);
 *   - processa em LOTE (AI_BATCH_SIZE itens por requisição);
 *   - modelo barato (claude-haiku-4-5), sem "thinking";
 *   - modo --dry: não chama a API.
 *
 * Requer:
 *   npm i -D @anthropic-ai/sdk
 *   .env.local:  ANTHROPIC_API_KEY=sk-ant-...
 *   opcionais:   AI_MODEL=claude-haiku-4-5  AI_BATCH_SIZE=5  AI_MAX_CHARS=4000
 *
 * Uso:
 *   node scripts/telegram/ai-classify.mjs --dry
 *   node scripts/telegram/ai-classify.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadEnv, log, readTextCache, readAiCache, writeAiCache } from "./lib.mjs";
import {
  VALID_FACULDADES,
  VALID_SUBJECTS,
  computePriority,
} from "./classify-lib.mjs";

const env = { ...loadEnv(), ...process.env };
const DRY = process.argv.includes("--dry");
const MODEL = env.AI_MODEL || "claude-haiku-4-5";
const BATCH = Math.max(1, Number(env.AI_BATCH_SIZE) || 5);
const MAX_CHARS = Number(env.AI_MAX_CHARS) || 4000;

const OUT_DIR = join("content", "telegram");
const CURATED = join(OUT_DIR, "curated.json");

if (!existsSync(CURATED)) {
  log("FAIL", `${CURATED} não existe. Rode antes: node scripts/telegram/normalize.mjs`);
  process.exit(1);
}
const items = JSON.parse(readFileSync(CURATED, "utf8"));
const byKey = new Map(items.map((it) => [it.sha256 || it.key, it]));

function applyAi(it, ai) {
  it.summary = ai.summary || it.summary || null;
  it.description = ai.description || it.description;
  if (Array.isArray(ai.tags) && ai.tags.length) {
    it.keywords = [...new Set(ai.tags.map((t) => String(t).toLowerCase()))].slice(0, 12);
  }
  if (["fácil", "média", "difícil"].includes(ai.difficulty)) it.difficulty = ai.difficulty;
  if (VALID_SUBJECTS.includes(ai.subject)) it.subject = ai.subject;
  if (ai.vestibular) it.vestibular = ai.vestibular;
  if (VALID_FACULDADES.includes(ai.universidade)) it.faculdade = ai.universidade;
  it.priority = computePriority(it.faculdade, it.editora);
}

// 1) Aplica cache existente; monta lista do que falta.
const pending = [];
let fromCache = 0;
for (const it of items) {
  if (it.skip) continue;
  const hash = it.sha256 || it.key;
  const cached = readAiCache(hash);
  if (cached) {
    applyAi(it, cached);
    fromCache++;
    continue;
  }
  pending.push(it);
}

log("•", `${fromCache} do cache · ${pending.length} a classificar via IA (modelo ${MODEL}, lote ${BATCH}).`);

if (DRY) {
  const reqs = Math.ceil(pending.length / BATCH);
  log("PASS", `Prévia: ${pending.length} itens → ~${reqs} requisição(ões). Nenhuma chamada de IA feita.`);
  if (fromCache) writeFileSync(CURATED, JSON.stringify(items, null, 2));
  process.exit(0);
}

if (pending.length === 0) {
  writeFileSync(CURATED, JSON.stringify(items, null, 2));
  log("PASS", "Nada a fazer — tudo já estava em cache.");
  process.exit(0);
}

const apiKey = env.ANTHROPIC_API_KEY;
if (!apiKey) {
  log("FAIL", "ANTHROPIC_API_KEY ausente no .env.local.");
  process.exit(1);
}

let Anthropic;
try {
  Anthropic = (await import("@anthropic-ai/sdk")).default;
} catch {
  log("FAIL", "SDK ausente. Rode: npm i -D @anthropic-ai/sdk");
  process.exit(1);
}
const client = new Anthropic({ apiKey });

const SYSTEM =
  "Você classifica PDFs de estudo para vestibulares de Medicina (Brasil) em uma biblioteca acadêmica. " +
  "Para cada item, devolva metadados objetivos em português. " +
  `universidade DEVE ser uma destas: ${VALID_FACULDADES.join(", ")}. ` +
  `subject DEVE ser uma destas: ${VALID_SUBJECTS.join(", ")}. ` +
  "difficulty deve ser fácil, média ou difícil. summary até ~300 caracteres. " +
  "Se não houver evidência, use 'Geral' (universidade/subject) e seja conservador.";

// Structured outputs: JSON garantido conforme o schema.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: { type: "integer" },
          summary: { type: "string" },
          description: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          difficulty: { type: "string", enum: ["fácil", "média", "difícil"] },
          subject: { type: "string", enum: VALID_SUBJECTS },
          vestibular: { type: "string" },
          universidade: { type: "string", enum: VALID_FACULDADES },
        },
        required: [
          "index", "summary", "description", "tags", "difficulty",
          "subject", "vestibular", "universidade",
        ],
      },
    },
  },
  required: ["results"],
};

function buildPayload(batch) {
  return batch.map((it, i) => ({
    index: i,
    titulo: it.title,
    palpite: {
      universidade: it.faculdade,
      vestibular: it.vestibular,
      materia: it.subject,
      tipo: it.materialType,
      editora: it.editora || null,
      ano: it.year,
    },
    trecho: (readTextCache(it.sha256 || it.key) || "").slice(0, MAX_CHARS),
  }));
}

let done = 0;
let failed = 0;

for (let i = 0; i < pending.length; i += BATCH) {
  const batch = pending.slice(i, i + BATCH);
  const payload = buildPayload(batch);

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", name: "classificacao", schema: SCHEMA } },
      messages: [
        {
          role: "user",
          content:
            "Classifique os itens a seguir e devolva um objeto com a lista 'results' " +
            "(um por index). Itens:\n" +
            JSON.stringify(payload),
        },
      ],
    });

    const text = (resp.content || []).find((b) => b.type === "text")?.text || "{}";
    const parsed = JSON.parse(text);
    const results = Array.isArray(parsed.results) ? parsed.results : [];

    for (const r of results) {
      const it = batch[r.index];
      if (!it) continue;
      const hash = it.sha256 || it.key;
      writeAiCache(hash, r);
      applyAi(it, r);
      byKey.set(hash, it);
      done++;
    }
    log("PASS", `Lote ${Math.floor(i / BATCH) + 1}: ${results.length} classificado(s).`);
  } catch (e) {
    failed += batch.length;
    log("FAIL", `Lote ${Math.floor(i / BATCH) + 1} — ${e.message}`);
  }

  // Salva incrementalmente (resiliente a interrupções).
  writeFileSync(CURATED, JSON.stringify(items, null, 2));
}

console.log(`\n== IA: ${done} classificados · ${fromCache} do cache · ${failed} falhas ==`);
process.exit(failed > 0 ? 1 : 0);
