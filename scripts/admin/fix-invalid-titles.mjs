/**
 * Acerte — Curadoria de títulos inválidos (lê o PDF e gera um título real).
 *
 * Detecta materiais cujo título parece UUID/hash/ID de arquivo ou é genérico,
 * baixa o PDF do Storage, extrai o texto das primeiras páginas e gera um
 * título + metadados coerentes. Marca needsOcr (tag "needs-ocr") quando não há
 * texto. Lista candidatos a simulado/prova (NÃO cria linhas em simulados).
 *
 * Só altera METADADOS. Não aprova, não exclui, não toca no arquivo físico,
 * mantém o status. Processa em lotes (Supabase Free).
 *
 * Requer:
 *   npm i -D pdf-parse          (extração de texto; sem ela, cai em metadados)
 *   npm i -D @anthropic-ai/sdk  (apenas para --ai)
 *   .env.local: SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
 *               ANTHROPIC_API_KEY=sk-ant-...   (apenas para --ai)
 *
 * Uso:
 *   node scripts/admin/fix-invalid-titles.mjs --dry
 *   node scripts/admin/fix-invalid-titles.mjs --apply
 *   node scripts/admin/fix-invalid-titles.mjs --apply --ai     (títulos via Claude)
 *   node scripts/admin/fix-invalid-titles.mjs --pending --dry  (só pendentes)
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv, log } from "../telegram/lib.mjs";
import {
  UNIVERSITIES,
  EDITORAS,
  SUBJECTS,
  PRIORITY_UNIS,
  PRIORITY_EDITORAS,
  slugify,
  keywordsFrom,
} from "../telegram/classify-lib.mjs";

const env = { ...loadEnv(), ...process.env };
const APPLY = process.argv.includes("--apply");
const USE_AI = process.argv.includes("--ai");
const PENDING_ONLY = process.argv.includes("--pending");
const BATCH = Math.max(1, Number(env.FIX_BATCH) || 5);

const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "";
const serviceKey =
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_KEY || "";
if (!url || !serviceKey) {
  log("FAIL", "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

let pdfParse = null;
try {
  pdfParse = (await import("pdf-parse")).default;
} catch {
  log("•", "pdf-parse ausente — sem extração de texto (cai em metadados). npm i -D pdf-parse");
}

let anthropic = null;
if (USE_AI) {
  if (!env.ANTHROPIC_API_KEY) {
    log("FAIL", "--ai requer ANTHROPIC_API_KEY no .env.local.");
    process.exit(1);
  }
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  } catch {
    log("FAIL", "--ai requer @anthropic-ai/sdk. npm i -D @anthropic-ai/sdk");
    process.exit(1);
  }
}

// ---------------- detecção de título inválido (espelha src/lib/title.ts) -----
const GENERIC = new Set([
  "apostila", "material", "materiais", "pdf", "documento", "arquivo",
  "sem titulo", "sem título", "untitled", "doc", "scan", "imagem",
  "novo documento", "material de estudo",
]);
const UUID_LIKE = /[0-9a-f]{8}[\s-][0-9a-f]{4}[\s-][0-9a-f]{4}[\s-][0-9a-f]{4}[\s-]?[0-9a-f]{12}/i;
function isInvalidTitle(title) {
  const t = (title ?? "").trim();
  if (!t || t.length < 3) return true;
  if (GENERIC.has(t.toLowerCase())) return true;
  if (UUID_LIKE.test(t)) return true;
  const tokens = t.split(/[\s_\-.]+/).filter(Boolean);
  const realWords = tokens.filter((x) => /^[a-zA-ZÀ-ÿ]{3,}$/.test(x) && !/^[0-9a-f]{6,}$/i.test(x));
  const junk = tokens.filter((x) => /^[0-9a-f]{6,}$/i.test(x) || /^\d{4,}$/.test(x));
  if (realWords.length === 0) return true;
  if (realWords.length < 2 && junk.length >= 2) return true;
  if (tokens.length >= 4 && junk.length / tokens.length >= 0.5) return true;
  return false;
}

// ---------------- classificação (detectores confiantes) ---------------------
const detectUni = (text) => {
  for (const [re, f, v] of UNIVERSITIES) if (re.test(text)) return { faculdade: f, vestibular: v };
  return null;
};
const detectFrom = (table, text) => {
  for (const [re, name] of table) if (re.test(text)) return name;
  return null;
};
const detectType = (text) => {
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
  if (/edital/.test(text)) return "Edital";
  if (/apostila/.test(text)) return "Apostila";
  if (/\bprova\b|vestibular|1[ªa]\s*fase|2[ªa]\s*fase/.test(text)) return "Prova";
  if (/teoria|te[óo]ric|m[óo]dulo|cap[íi]tulo|frente/.test(text)) return "Material teórico";
  return null;
};
const detectYear = (text) => {
  const m = text.match(/\b(19\d{2}|20\d{2})\b/);
  return m ? Number(m[1]) : null;
};
const computePriority = (faculdade, editora) =>
  PRIORITY_UNIS.has(faculdade) || (editora && PRIORITY_EDITORAS.has(editora)) ? "alta" : "normal";

function classify(text, current) {
  const uni = detectUni(text);
  const faculdade = uni?.faculdade || (current.faculdade !== "Medicina" ? current.faculdade : null) || null;
  const vestibular = uni?.vestibular || (current.vestibular !== "Todos" ? current.vestibular : null) || null;
  const subject = detectFrom(SUBJECTS, text) || (current.subject !== "Interdisciplinar" ? current.subject : null);
  const materialType = detectType(text) || current.material_type || "Apostila";
  const editora = detectFrom(EDITORAS, text) || current.editora || null;
  const year = detectYear(text) || current.year || null;
  return { faculdade, vestibular, subject, materialType, editora, year };
}

// ---------------- geração de título -----------------------------------------
function toTitleCase(s) {
  if (s === s.toUpperCase()) {
    return s
      .toLowerCase()
      .replace(/\b([a-zà-ÿ])/g, (m) => m.toUpperCase())
      .replace(/\b(De|Da|Do|Das|Dos|E|A|O|Em|Para|Com)\b/g, (m) => m.toLowerCase());
  }
  return s;
}

const HEADING_SKIP = /^(p[áa]gina|page|\d+$|sum[áa]rio|[ií]ndice|www\.|http|todos os direitos|copyright|©)/i;
function headingFromText(raw) {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 30)) {
    if (HEADING_SKIP.test(line)) continue;
    const words = line.replace(/[^a-zA-ZÀ-ÿ ]/g, " ").split(/\s+/).filter((w) => w.length >= 3);
    if (words.length >= 2 && line.length >= 6 && line.length <= 90) {
      return line.replace(/\s+/g, " ").trim();
    }
  }
  return null;
}

function composeTitle(heading, cls) {
  const vest = cls.vestibular && cls.vestibular !== "Todos" ? cls.vestibular : "";
  const subj = cls.subject && cls.subject !== "Geral" ? cls.subject : "";
  const type = cls.materialType;
  const head = heading ? toTitleCase(heading) : null;

  if (type === "Simulado") return `Simulado${vest ? ` ${vest}` : ""}${subj ? ` — ${subj}` : head ? ` — ${head}` : ""}`.trim();
  if (type === "Prova") return `Prova${vest ? ` ${vest}` : ""}${cls.year ? ` ${cls.year}` : ""}${head ? ` — ${head}` : subj ? ` — ${subj}` : ""}`.trim();
  if (head) {
    const suffix =
      type === "Lista de exercícios" ? ` — Exercícios${vest ? ` ${vest}` : ""}`
      : type === "Gabarito" ? " — Gabarito"
      : type === "Caderno de questões" ? " — Caderno de questões"
      : "";
    return `${head}${suffix}`;
  }
  if (cls.editora && subj) return `Apostila ${cls.editora} — ${subj}`;
  if (subj && type) return `${type} — ${subj}`;
  if (subj) return `Material — ${subj}`;
  return null;
}

async function aiTitle(text, cls) {
  try {
    const resp = await anthropic.messages.create({
      model: env.AI_MODEL || "claude-haiku-4-5",
      max_tokens: 60,
      system:
        "Você dá títulos curtos e claros (PT-BR) a PDFs de estudo para vestibulares de Medicina. " +
        "Responda APENAS com o título, sem aspas, máx ~70 caracteres. " +
        "Use o padrão 'Assunto — Contexto' quando fizer sentido (ex.: 'Áreas das Figuras Planas — Exercícios ENEM').",
      messages: [
        {
          role: "user",
          content:
            `Classificação: ${JSON.stringify(cls)}\n\nTrecho do PDF:\n${text.slice(0, 2500)}\n\nTítulo:`,
        },
      ],
    });
    const out = (resp.content || []).find((b) => b.type === "text")?.text || "";
    return out.split(/\r?\n/)[0].replace(/^["'\s]+|["'\s]+$/g, "").slice(0, 120) || null;
  } catch (e) {
    log("•", `IA falhou em um item (seguindo no heurístico): ${e?.message || e}`);
    return null;
  }
}

// ---------------- extração de texto -----------------------------------------
async function extractText(m) {
  if (!pdfParse) return "";
  try {
    let buf = null;
    if (m.storage_path) {
      const { data, error } = await supabase.storage.from("materials").download(m.storage_path);
      if (error || !data) return "";
      buf = Buffer.from(await data.arrayBuffer());
    } else if (m.external_url && /\.pdf(\?|$)/i.test(m.external_url)) {
      const res = await fetch(m.external_url);
      if (!res.ok) return "";
      buf = Buffer.from(await res.arrayBuffer());
    } else {
      return "";
    }
    const data = await pdfParse(buf, { max: 3 });
    return data.text || "";
  } catch {
    return "";
  }
}

const SIMULADO_TYPES = new Set(["Simulado", "Prova", "Caderno de questões"]);

// ---------------- fetch -----------------------------------------------------
const COLS =
  "id,title,description,summary,keywords,slug,editora,faculdade,vestibular,subject,material_type,year,status,storage_path,external_url,upload_kind,tags";
async function fetchAll() {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let q = supabase.from("materials").select(COLS).order("created_at", { ascending: true }).range(from, from + pageSize - 1);
    if (PENDING_ONLY) q = q.eq("status", "pending");
    const { data, error } = await q;
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function main() {
  log("•", `Modo: ${APPLY ? "APPLY" : "DRY"}${USE_AI ? " +IA" : ""} · escopo: ${PENDING_ONLY ? "pendentes" : "todos"} · lote ${BATCH}`);
  const all = await fetchAll();
  const invalid = all.filter((m) => isInvalidTitle(m.title));
  log("PASS", `${all.length} analisados · ${invalid.length} com título inválido`);

  let extracted = 0;
  let needOcr = 0;
  const planned = [];
  const candidates = [];
  const examples = [];

  for (let i = 0; i < invalid.length; i += BATCH) {
    const batch = invalid.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (m) => {
        const raw = await extractText(m);
        const norm = raw.replace(/\s+/g, " ").trim().toLowerCase();
        const text = norm + " " + (m.editora || "").toLowerCase();
        if (raw.trim().length >= 40) extracted++;
        else needOcr++;

        const cls = classify(text, m);
        let title = null;
        if (raw.trim().length >= 40) {
          title = USE_AI ? await aiTitle(raw, cls) : null;
          if (!title) title = composeTitle(headingFromText(raw), cls);
        }
        if (!title) title = composeTitle(null, cls); // fallback metadados

        const isSimuladoCandidate =
          SIMULADO_TYPES.has(cls.materialType) || /simulad|gabarito oficial|1[ªa]\s*fase|caderno de quest/.test(norm);
        if (isSimuladoCandidate) {
          candidates.push({ id: m.id, title: title || m.title, type: cls.materialType, vestibular: cls.vestibular, year: cls.year });
        }

        if (!title && raw.trim().length < 40) {
          // sem texto e sem metadados úteis → só marca OCR
          planned.push({ m, patch: { tags: addTag(m.tags, "needs-ocr") }, newTitle: null, ocr: true });
          return;
        }
        if (!title) return; // nada melhor a fazer

        const patch = buildPatch(m, title, cls, raw.trim().length < 40);
        planned.push({ m, patch, newTitle: title, ocr: raw.trim().length < 40 });
        if (examples.length < 10) examples.push({ before: m.title, after: title });
      }),
    );
    log("•", `Analisados ${Math.min(i + BATCH, invalid.length)}/${invalid.length}...`);
  }

  console.log("\n================ RELATÓRIO ================");
  console.log(`Analisados:            ${all.length}`);
  console.log(`Títulos inválidos:     ${invalid.length}`);
  console.log(`Texto extraído:        ${extracted}`);
  console.log(`Precisam de OCR:       ${needOcr}`);
  console.log(`Com novo título:       ${planned.filter((p) => p.newTitle).length}`);
  console.log(`Candidatos simulado/prova: ${candidates.length}`);
  console.log("\nExemplos (antes → depois):");
  for (const ex of examples) console.log(`  "${ex.before}"\n   → "${ex.after}"`);
  console.log("\nCandidatos a simulado/prova (até 15):");
  for (const c of candidates.slice(0, 15)) console.log(`  • [${c.type}] ${c.title} (${c.vestibular ?? "?"} ${c.year ?? ""})`);
  console.log("==========================================\n");

  if (!APPLY) {
    log("•", "DRY — nada gravado. Rode com --apply (e opcional --ai).");
    process.exit(0);
  }

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < planned.length; i += BATCH) {
    const batch = planned.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(({ m, patch }) => supabase.from("materials").update(patch).eq("id", m.id)));
    for (const r of results) {
      if (r.error) { fail++; console.error("[fix-titles]", r.error.message); }
      else ok++;
    }
    log("•", `Aplicados ${Math.min(i + BATCH, planned.length)}/${planned.length}...`);
  }
  console.log(`\n== Correção de títulos: ${ok} atualizados · ${fail} falhas · ${candidates.length} candidatos a simulado/prova ==`);
  process.exit(fail > 0 ? 1 : 0);
}

function addTag(tags, tag) {
  const base = Array.isArray(tags) ? tags : [];
  return base.includes(tag) ? base : [...base, tag];
}

function buildPatch(m, title, cls, ocr) {
  const place = cls.faculdade && cls.faculdade !== "Geral" ? cls.faculdade : cls.vestibular || "Geral";
  const patch = {
    title,
    subject: cls.subject || m.subject || "Geral",
    material_type: cls.materialType || m.material_type || "Apostila",
    vestibular: cls.vestibular || m.vestibular || "Todos",
    faculdade: cls.faculdade || m.faculdade || "Geral",
    year: cls.year || m.year || null,
    editora: cls.editora || m.editora || null,
    priority: computePriority(cls.faculdade || "", cls.editora || ""),
    slug: `${slugify(`${title}-${cls.vestibular || "todos"}-${cls.year || ""}-${cls.materialType || "material"}`)}-${String(m.id).slice(0, 6)}`,
  };
  if (!m.description || isInvalidTitle(m.description)) {
    patch.description = `${cls.materialType || "Material"} de ${cls.subject || "Geral"}${cls.editora ? ` (${cls.editora})` : ""} — ${place} ${cls.year || ""}`.trim();
  }
  if (!m.keywords || m.keywords.length === 0) {
    patch.keywords = keywordsFrom(`${title} ${cls.subject || ""} ${cls.vestibular || ""}`.toLowerCase(), [
      cls.vestibular, cls.subject, cls.materialType, cls.editora,
    ]);
  }
  if (ocr) patch.tags = addTag(m.tags, "needs-ocr");
  return patch;
}

main().catch((e) => {
  log("FAIL", `Erro: ${e?.message || e}`);
  process.exit(1);
});
