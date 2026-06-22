/**
 * AcertaVest — Limpeza de prefixos numéricos artificiais nos títulos de materiais.
 *
 * Os títulos vieram do nome do arquivo na importação e alguns ficaram com um
 * contador no começo (ex.: "999 13.7 ÁREAS..."). Este script remove esse
 * prefixo, preservando seções com ponto ("13.7") e anos ("2024 ...").
 *
 * Só altera o campo `title`. Não aprova, não exclui, não toca nos PDFs.
 * Espelha src/lib/title.ts e o stripArtificialPrefix de classify-lib.mjs.
 *
 * Requer service_role no .env.local: SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
 *
 * Uso:
 *   node scripts/admin/clean-titles.mjs --dry      (só relatório)
 *   node scripts/admin/clean-titles.mjs --apply    (grava)
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv, log } from "../telegram/lib.mjs";
import { normalizeTitle } from "../telegram/classify-lib.mjs";

const env = { ...loadEnv(), ...process.env };
const APPLY = process.argv.includes("--apply");

const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "";
const serviceKey =
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_KEY || "";

if (!url || !serviceKey) {
  log("FAIL", "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const cleanTitle = (title) => normalizeTitle(title);

async function fetchAll() {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("materials")
      .select("id,title")
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function main() {
  log("•", `Modo: ${APPLY ? "APPLY (grava)" : "DRY (só relatório)"}`);
  const materials = await fetchAll();
  log("PASS", `${materials.length} materiais analisados`);

  const planned = [];
  for (const m of materials) {
    const cleaned = cleanTitle(m.title);
    if (cleaned && cleaned !== (m.title || "").trim()) {
      planned.push({ id: m.id, before: m.title, after: cleaned });
    }
  }

  console.log("\n================ RELATÓRIO ================");
  console.log(`Analisados:           ${materials.length}`);
  console.log(`Com prefixo numérico: ${planned.length}`);
  console.log("\nExemplos (antes → depois):");
  for (const ex of planned.slice(0, 12)) {
    console.log(`  "${ex.before}"\n   → "${ex.after}"`);
  }
  console.log("==========================================\n");

  if (!APPLY) {
    log("•", "DRY — nada gravado. Rode com --apply para aplicar.");
    process.exit(0);
  }

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < planned.length; i += 20) {
    const batch = planned.slice(i, i + 20);
    const results = await Promise.all(
      batch.map((p) => supabase.from("materials").update({ title: p.after }).eq("id", p.id)),
    );
    for (const r of results) {
      if (r.error) { fail++; console.error("[clean-titles]", r.error.message); }
      else ok++;
    }
    log("•", `Aplicados ${Math.min(i + 20, planned.length)}/${planned.length}...`);
  }

  console.log(`\n== Limpeza de títulos: ${ok} atualizados · ${fail} falhas ==`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  log("FAIL", `Erro: ${e?.message || e}`);
  process.exit(1);
});
