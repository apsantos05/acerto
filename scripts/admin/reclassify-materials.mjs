/**
 * AcertaVest — Reclassificação em massa de materiais (curadoria).
 *
 * Lê materiais do Supabase, reclassifica os METADADOS por heurística
 * conservadora (só altera quando há detecção confiante; nunca rebaixa para
 * Geral/Apostila) e, com --apply, grava as correções. NÃO aprova, NÃO exclui
 * e NÃO toca nos PDFs.
 *
 * Reusa as tabelas de scripts/telegram/classify-lib.mjs (espelha
 * src/lib/reclassify.ts).
 *
 * Requer service_role no .env.local:
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
 *
 * Uso:
 *   node scripts/admin/reclassify-materials.mjs --dry           (pendentes; só relatório)
 *   node scripts/admin/reclassify-materials.mjs --apply         (pendentes; grava)
 *   node scripts/admin/reclassify-materials.mjs --all --dry     (todos os status)
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
const ALL = process.argv.includes("--all");

const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "";
const serviceKey =
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_KEY || "";

if (!url) {
  log("FAIL", "NEXT_PUBLIC_SUPABASE_URL ausente no .env.local.");
  process.exit(1);
}
if (!serviceKey) {
  log("FAIL", "SUPABASE_SERVICE_ROLE_KEY ausente (Project Settings → API → service_role).");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// ---------------- detectores conservadores (espelham reclassify.ts) ----------
const detectUni = (text) => {
  for (const [re, faculdade, vestibular] of UNIVERSITIES) {
    if (re.test(text)) return { faculdade, vestibular };
  }
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
  if (/\bprova\b|vestibular/.test(text)) return "Prova";
  if (/teoria|te[óo]ric|m[óo]dulo|cap[íi]tulo|frente/.test(text)) return "Material teórico";
  return null;
};
const detectDifficulty = (text) => {
  if (/dif[íi]cil|avan[çc]ad|aprofund|extensiv/.test(text)) return "difícil";
  if (/b[áa]sic|f[áa]cil|introdut|iniciante/.test(text)) return "fácil";
  return null;
};
const detectYear = (text) => {
  const m = text.match(/\b(19\d{2}|20\d{2})\b/);
  return m ? Number(m[1]) : null;
};
const computePriority = (faculdade, editora) =>
  PRIORITY_UNIS.has(faculdade) || (editora && PRIORITY_EDITORAS.has(editora))
    ? "alta"
    : "normal";

function reclassify(m) {
  const text = [
    m.title, m.description, m.summary, (m.keywords ?? []).join(" "),
    m.slug, m.editora, m.faculdade, m.vestibular,
  ].filter(Boolean).join(" ").toLowerCase();

  const patch = {};
  const changes = [];

  const uni = detectUni(text);
  if (uni) {
    if (uni.faculdade !== m.faculdade) { patch.faculdade = uni.faculdade; changes.push("faculdade"); }
    if (uni.vestibular !== m.vestibular) { patch.vestibular = uni.vestibular; changes.push("vestibular"); }
  }
  const subject = detectFrom(SUBJECTS, text);
  if (subject && subject !== m.subject) { patch.subject = subject; changes.push("subject"); }

  const type = detectType(text);
  if (type && type !== m.material_type) { patch.material_type = type; changes.push("material_type"); }

  const editora = detectFrom(EDITORAS, text);
  if (editora && !m.editora) { patch.editora = editora; changes.push("editora"); }

  const year = detectYear(text);
  if (year && year !== m.year) { patch.year = year; changes.push("year"); }

  const difficulty = detectDifficulty(text);
  if (difficulty && difficulty !== m.difficulty) { patch.difficulty = difficulty; changes.push("difficulty"); }

  const finalFaculdade = patch.faculdade ?? m.faculdade ?? "";
  const finalEditora = patch.editora ?? m.editora ?? "";
  const priority = computePriority(finalFaculdade, finalEditora);
  if (priority !== (m.priority ?? "normal")) { patch.priority = priority; changes.push("priority"); }

  if (!m.keywords || m.keywords.length === 0) {
    const kw = keywordsFrom(text, [
      patch.vestibular ?? m.vestibular, patch.subject ?? m.subject,
      patch.material_type ?? m.material_type, patch.editora ?? m.editora,
    ]);
    if (kw.length > 0) { patch.keywords = kw; changes.push("keywords"); }
  }

  if (!m.slug) {
    const vest = patch.vestibular ?? m.vestibular ?? "todos";
    const yr = patch.year ?? m.year ?? "";
    const type2 = patch.material_type ?? m.material_type ?? "material";
    patch.slug = `${slugify(`${m.title ?? "material"}-${vest}-${yr}-${type2}`)}-${String(m.id).slice(0, 6)}`;
    changes.push("slug");
  }

  return { patch, changes };
}

// ---------------- lookups (faculty_id / vestibular_id) ----------------------
const facultyCache = new Map();
const vestibularCache = new Map();
async function getOrCreate(table, cache, name) {
  if (!name || name === "Geral" || name === "Todos") return null;
  if (cache.has(name)) return cache.get(name);
  const slug = slugify(name);
  let { data } = await supabase.from(table).select("id").eq("name", name).maybeSingle();
  if (!data) {
    const ins = await supabase.from(table).insert({ name, slug }).select("id").maybeSingle();
    if (ins.error?.code === "23505") {
      const dup = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
      data = dup.data;
    } else {
      data = ins.data;
    }
  }
  const id = data?.id ?? null;
  cache.set(name, id);
  return id;
}

// ---------------- fetch (paginado) ------------------------------------------
const COLS =
  "id,title,description,summary,keywords,slug,editora,faculdade,vestibular,subject,material_type,year,difficulty,priority,status";

async function fetchAll() {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let q = supabase.from("materials").select(COLS).order("created_at", { ascending: true }).range(from, from + pageSize - 1);
    if (!ALL) q = q.eq("status", "pending");
    const { data, error } = await q;
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function bump(obj, key) {
  if (!key) return;
  obj[key] = (obj[key] ?? 0) + 1;
}

async function main() {
  log("•", `Modo: ${APPLY ? "APPLY (grava)" : "DRY (só relatório)"} · escopo: ${ALL ? "todos" : "pendentes"}`);
  const materials = await fetchAll();
  log("PASS", `${materials.length} materiais analisados`);

  let changedCount = 0;
  const bySubject = {}, byUniversity = {}, byVestibular = {}, byEditora = {};
  const examples = [];

  const planned = [];
  for (const m of materials) {
    const { patch, changes } = reclassify(m);
    if (changes.length === 0) continue;
    changedCount++;
    if (changes.includes("subject")) bump(bySubject, patch.subject);
    if (changes.includes("faculdade")) bump(byUniversity, patch.faculdade);
    if (changes.includes("vestibular")) bump(byVestibular, patch.vestibular);
    if (changes.includes("editora")) bump(byEditora, patch.editora);
    if (examples.length < 8) {
      examples.push({ id: m.id, title: m.title, changes, patch });
    }
    planned.push({ m, patch, changes });
  }

  console.log("\n================ RELATÓRIO ================");
  console.log(`Analisados:   ${materials.length}`);
  console.log(`Com mudança:  ${changedCount}`);
  console.log("\nAlterações por matéria:    ", bySubject);
  console.log("Alterações por universidade:", byUniversity);
  console.log("Alterações por vestibular:  ", byVestibular);
  console.log("Alterações por editora:     ", byEditora);
  console.log("\nExemplos (antes → depois):");
  for (const ex of examples) {
    console.log(`  • ${ex.title}`);
    for (const field of ex.changes) {
      const before = ex.m?.[field === "material_type" ? "material_type" : field];
      console.log(`     ${field}: ${JSON.stringify(before)} → ${JSON.stringify(ex.patch[field])}`);
    }
  }
  console.log("==========================================\n");

  if (!APPLY) {
    log("•", "DRY — nada gravado. Rode com --apply para aplicar.");
    process.exit(0);
  }

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < planned.length; i += 8) {
    const batch = planned.slice(i, i + 8);
    const results = await Promise.all(
      batch.map(async ({ m, patch }) => {
        const full = { ...patch };
        if (patch.faculdade) {
          full.faculty_id = await getOrCreate("faculties", facultyCache, patch.faculdade);
        }
        if (patch.vestibular) {
          full.vestibular_id = await getOrCreate("vestibulares", vestibularCache, patch.vestibular);
        }
        return supabase.from("materials").update(full).eq("id", m.id);
      }),
    );
    for (const r of results) {
      if (r.error) { fail++; console.error("[reclassify] update:", r.error.message); }
      else ok++;
    }
    log("•", `Aplicados ${Math.min(i + 8, planned.length)}/${planned.length}...`);
  }

  console.log(`\n== Reclassificação: ${ok} atualizados · ${fail} falhas ==`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  log("FAIL", `Erro: ${e?.message || e}`);
  process.exit(1);
});
