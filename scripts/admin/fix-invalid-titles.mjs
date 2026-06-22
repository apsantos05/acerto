/**
 * AcertaVest — Curadoria de títulos inválidos (lê o PDF e gera um título real).
 *
 * Detecta materiais cujo título parece UUID/hash/ID de arquivo ou é genérico,
 * baixa o PDF do Storage, extrai o texto das primeiras páginas (pdf-parse e,
 * com --ocr, Tesseract+Poppler para PDFs escaneados) e gera título + metadados
 * coerentes. Lista candidatos a simulado/prova (NÃO cria linhas em simulados).
 *
 * Só altera METADADOS. Não aprova, não exclui, não toca no arquivo físico,
 * mantém o status. Processa em lotes pequenos (Supabase Free). OCR é cacheado
 * por hash do arquivo — não repete OCR no mesmo PDF.
 *
 * Requer:
 *   npm i -D pdf-parse           (texto de PDFs com camada de texto)
 *   npm i -D @anthropic-ai/sdk   (apenas para --ai)
 *   --ocr: binários no PATH → Tesseract (idioma "por") + Poppler (pdftoppm)
 *   .env.local: SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
 *               ANTHROPIC_API_KEY=sk-ant-...   (apenas para --ai)
 *
 * Uso:
 *   node scripts/admin/fix-invalid-titles.mjs --dry
 *   node scripts/admin/fix-invalid-titles.mjs --dry --ocr
 *   node scripts/admin/fix-invalid-titles.mjs --apply --ocr
 *   node scripts/admin/fix-invalid-titles.mjs --apply --ocr --ai
 *   node scripts/admin/fix-invalid-titles.mjs --pending --apply --ocr
 *
 * Config opcional: OCR_LANG=por OCR_MAX_PAGES=3 OCR_DPI=200 OCR_BATCH=3
 */
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  writeFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  existsSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

// Cache próprio deste script (texto extraído / OCR). Definido ANTES de usar lib.
process.env.CACHE_DIR = process.env.CACHE_DIR || join("content", "admin", "cache");

const { loadEnv, log, readTextCache, writeTextCache, cacheDir } = await import(
  "../telegram/lib.mjs"
);
const {
  UNIVERSITIES,
  EDITORAS,
  SUBJECTS,
  PRIORITY_UNIS,
  PRIORITY_EDITORAS,
  slugify,
  keywordsFrom,
} = await import("../telegram/classify-lib.mjs");

const env = { ...loadEnv(), ...process.env };
const APPLY = process.argv.includes("--apply");
const USE_AI = process.argv.includes("--ai");
const OCR = process.argv.includes("--ocr");
const PENDING_ONLY = process.argv.includes("--pending");

const OCR_LANG = env.OCR_LANG || "por";
const OCR_MAX_PAGES = Number(env.OCR_MAX_PAGES) || 3;
const OCR_DPI = Number(env.OCR_DPI) || 200;
const BATCH = OCR
  ? Math.max(1, Number(env.OCR_BATCH) || 3)
  : Math.max(1, Number(env.FIX_BATCH) || 5);

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
  log("•", "pdf-parse ausente — sem extração de texto digital. npm i -D pdf-parse");
}

// OCR: checa binários quando solicitado.
function which(bin, args) {
  try {
    execFileSync(bin, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
if (OCR) {
  if (!which("tesseract", ["--version"])) {
    log("FAIL", "--ocr: Tesseract não encontrado no PATH (instale com idioma 'por').");
    process.exit(1);
  }
  if (!which("pdftoppm", ["-v"])) {
    log("FAIL", "--ocr: pdftoppm (Poppler) não encontrado no PATH.");
    process.exit(1);
  }
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
        "Use 'Assunto — Contexto' quando fizer sentido (ex.: 'Áreas das Figuras Planas — Exercícios ENEM').",
      messages: [
        { role: "user", content: `Classificação: ${JSON.stringify(cls)}\n\nTrecho do PDF:\n${text.slice(0, 2500)}\n\nTítulo:` },
      ],
    });
    const out = (resp.content || []).find((b) => b.type === "text")?.text || "";
    return out.split(/\r?\n/)[0].replace(/^["'\s]+|["'\s]+$/g, "").slice(0, 120) || null;
  } catch (e) {
    log("•", `IA falhou em um item (seguindo no heurístico): ${e?.message || e}`);
    return null;
  }
}

// ---------------- aquisição de texto (cache → pdf-parse → OCR) ---------------
function cacheKey(m) {
  return m.file_hash || createHash("sha1").update(m.storage_path || m.id).digest("hex");
}
async function downloadBuffer(m) {
  try {
    if (m.storage_path) {
      const { data, error } = await supabase.storage.from("materials").download(m.storage_path);
      if (error || !data) return null;
      return Buffer.from(await data.arrayBuffer());
    }
    if (m.external_url && /\.pdf(\?|$)/i.test(m.external_url)) {
      const res = await fetch(m.external_url);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
  } catch {
    return null;
  }
  return null;
}
async function pdfText(buf) {
  if (!pdfParse) return "";
  try {
    const data = await pdfParse(buf, { max: OCR_MAX_PAGES });
    return data.text || "";
  } catch {
    return "";
  }
}
async function ocrBuffer(buf) {
  const tmp = join(cacheDir(), "ocr-tmp");
  mkdirSync(tmp, { recursive: true });
  for (const f of existsSync(tmp) ? readdirSync(tmp) : []) rmSync(join(tmp, f), { force: true });
  const pdfPath = join(tmp, "in.pdf");
  writeFileSync(pdfPath, buf);
  try {
    execFileSync("pdftoppm", ["-png", "-r", String(OCR_DPI), "-f", "1", "-l", String(OCR_MAX_PAGES), pdfPath, join(tmp, "page")]);
  } catch {
    return "";
  }
  const pngs = readdirSync(tmp).filter((f) => f.endsWith(".png")).sort();
  let text = "";
  for (const png of pngs) {
    let out = "";
    try {
      out = execFileSync("tesseract", [join(tmp, png), "stdout", "-l", OCR_LANG], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    } catch {
      try {
        out = execFileSync("tesseract", [join(tmp, png), "stdout"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
      } catch {
        out = "";
      }
    }
    text += "\n" + out;
  }
  return text.trim();
}
async function getText(m) {
  const key = cacheKey(m);
  const cached = readTextCache(key);
  if (cached != null) {
    return { raw: cached, via: cached.trim().length >= 40 ? "cache" : "cache-vazio" };
  }
  const buf = await downloadBuffer(m);
  if (!buf) return { raw: "", via: "sem-arquivo" };

  let raw = await pdfText(buf);
  let via = raw.trim().length >= 40 ? "pdf" : null;
  if (!via && OCR) {
    raw = await ocrBuffer(buf);
    via = raw.trim().length >= 40 ? "ocr" : "ocr-vazio";
  }
  if (!via) via = "sem-texto";
  // Cacheia quando houve extração digital ou tentativa de OCR (não repete OCR).
  if (via === "pdf" || via === "ocr" || via === "ocr-vazio") writeTextCache(key, raw);
  return { raw, via };
}

const SIMULADO_TYPES = new Set(["Simulado", "Prova", "Caderno de questões"]);

// ---------------- fetch -----------------------------------------------------
const COLS =
  "id,title,description,summary,keywords,slug,editora,faculdade,vestibular,subject,material_type,year,status,storage_path,external_url,upload_kind,tags,file_hash";
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

function addTag(tags, tag) {
  const base = Array.isArray(tags) ? tags : [];
  return base.includes(tag) ? base : [...base, tag];
}
function buildPatch(m, title, cls, hasText) {
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
  if (!hasText) patch.tags = addTag(m.tags, "needs-ocr");
  return patch;
}

async function main() {
  log("•", `Modo: ${APPLY ? "APPLY" : "DRY"}${OCR ? " +OCR" : ""}${USE_AI ? " +IA" : ""} · escopo: ${PENDING_ONLY ? "pendentes" : "todos"} · lote ${BATCH}`);
  const all = await fetchAll();
  const invalid = all.filter((m) => isInvalidTitle(m.title));
  log("PASS", `${all.length} analisados · ${invalid.length} com título inválido`);

  const stat = { pdf: 0, ocr: 0, cache: 0, semTexto: 0 };
  const planned = [];
  const candidates = [];
  const examples = [];
  const semTitulo = [];

  for (let i = 0; i < invalid.length; i += BATCH) {
    const batch = invalid.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (m) => {
        const { raw, via } = await getText(m);
        const norm = raw.replace(/\s+/g, " ").trim().toLowerCase();
        const hasText = raw.trim().length >= 40;
        if (via === "pdf") stat.pdf++;
        else if (via === "ocr") stat.ocr++;
        else if (via === "cache") stat.cache++;
        else stat.semTexto++;

        const cls = classify(`${norm} ${(m.editora || "").toLowerCase()}`, m);

        let title = null;
        if (hasText) {
          if (USE_AI) title = await aiTitle(raw, cls);
          if (!title) title = composeTitle(headingFromText(raw), cls);
        }
        if (!title) title = composeTitle(null, cls);

        if (SIMULADO_TYPES.has(cls.materialType) || /simulad|1[ªa]\s*fase|caderno de quest/.test(norm)) {
          candidates.push({ id: m.id, title: title || m.title, type: cls.materialType, vestibular: cls.vestibular, year: cls.year });
        }

        if (!title) {
          semTitulo.push({ id: m.id, storage: m.storage_path, via });
          if (!hasText) planned.push({ m, patch: { tags: addTag(m.tags, "needs-ocr") } });
          return;
        }
        planned.push({ m, patch: buildPatch(m, title, cls, hasText) });
        if (examples.length < 12) examples.push({ before: m.title, after: title, via });
      }),
    );
    log("•", `Processados ${Math.min(i + BATCH, invalid.length)}/${invalid.length}...`);
  }

  console.log("\n================ RELATÓRIO ================");
  console.log(`Analisados:            ${all.length}`);
  console.log(`Títulos inválidos:     ${invalid.length}`);
  console.log(`Texto via pdf-parse:   ${stat.pdf}`);
  console.log(`Texto via OCR:         ${stat.ocr}`);
  console.log(`Texto via cache:       ${stat.cache}`);
  console.log(`Sem texto:             ${stat.semTexto}`);
  console.log(`Com novo título:       ${planned.filter((p) => p.patch.title).length}`);
  console.log(`Ainda sem título:      ${semTitulo.length}`);
  console.log(`Candidatos simulado/prova: ${candidates.length}`);
  console.log("\nExemplos (antes → depois):");
  for (const ex of examples) console.log(`  [${ex.via}] "${ex.before}"\n     → "${ex.after}"`);
  if (semTitulo.length) {
    console.log("\nAinda sem título (até 15):");
    for (const s of semTitulo.slice(0, 15)) console.log(`  • ${s.id} (${s.via}) ${s.storage ?? ""}`);
  }
  console.log("\nCandidatos a simulado/prova (até 15):");
  for (const c of candidates.slice(0, 15)) console.log(`  • [${c.type}] ${c.title} (${c.vestibular ?? "?"} ${c.year ?? ""})`);
  console.log("==========================================\n");

  if (!APPLY) {
    log("•", "DRY — nada gravado no banco (cache de OCR foi salvo). Rode com --apply.");
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
  console.log(`\n== Correção: ${ok} atualizados · ${fail} falhas · ${semTitulo.length} ainda sem título · ${candidates.length} candidatos a simulado/prova ==`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  log("FAIL", `Erro: ${e?.message || e}`);
  process.exit(1);
});
