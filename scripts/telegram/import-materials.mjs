/**
 * Acerte — Etapa 3: importar os PDFs classificados para a biblioteca.
 *
 * Sobe cada PDF para o bucket "materials" e grava em public.materials com a
 * classificação completa (universidade, vestibular, matéria, tipo, editora,
 * dificuldade, prioridade, slug, keywords, descrição).
 *
 * Controle de duplicidade por sha256: se o arquivo já existe, ATUALIZA os
 * metadados em vez de criar um novo registro.
 *
 * Vincula cada material à universidade (faculties) e ao vestibular
 * (vestibulares), então ele aparece tanto na matéria quanto na universidade.
 *
 * Requer service_role (ignora o RLS). No .env.local (gitignored):
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
 *   IMPORT_OWNER_USERNAME=acerteoficial   (perfil dono)
 *   IMPORT_STATUS=pending                 (pending = moderação no /admin)
 *   IMPORT_MAX_MB=10                      (limite do bucket)
 *
 * Uso:
 *   node scripts/telegram/import-materials.mjs --dry   (prévia)
 *   node scripts/telegram/import-materials.mjs         (importa)
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, log, uuidv5 } from "./lib.mjs";

const env = { ...loadEnv(), ...process.env };
const DRY = process.argv.includes("--dry");

const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "";
const serviceKey =
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_KEY || "";
const ownerUsername = env.IMPORT_OWNER_USERNAME || "acerteoficial";
const status = env.IMPORT_STATUS === "approved" ? "approved" : "pending";
const maxMb = Number(env.IMPORT_MAX_MB) || 10;

if (!url) {
  log("FAIL", "NEXT_PUBLIC_SUPABASE_URL ausente no .env.local.");
  process.exit(1);
}
if (!DRY && !serviceKey) {
  log("FAIL", "SUPABASE_SERVICE_ROLE_KEY ausente. Supabase → Project Settings → API → service_role.");
  process.exit(1);
}
if (!DRY && serviceKey.startsWith("sb_publishable_")) {
  log("FAIL", "Você forneceu a Publishable key. A importação precisa da service_role (ignora RLS).");
  process.exit(1);
}

const CURATED = join("content", "telegram", "curated.json");
if (!existsSync(CURATED)) {
  log("FAIL", `${CURATED} não existe. Rode antes: node scripts/telegram/normalize.mjs`);
  process.exit(1);
}
const items = JSON.parse(readFileSync(CURATED, "utf8"));

const supabase = DRY ? null : createClient(url, serviceKey, { auth: { persistSession: false } });

let ownerId = null;
if (!DRY) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username")
    .eq("username", ownerUsername)
    .maybeSingle();
  if (error || !data) {
    log("FAIL", `Perfil "${ownerUsername}" não encontrado. Ajuste IMPORT_OWNER_USERNAME.`);
    process.exit(1);
  }
  ownerId = data.id;
  log("PASS", `Dono: @${data.username} (${ownerId}) · status=${status}`);
}

// Caches para vincular universidade (faculties) e vestibular (vestibulares).
const facultyCache = new Map();
const vestibularCache = new Map();

async function getOrCreate(table, cache, name) {
  if (!name || name === "Geral" || name === "Todos") return null;
  if (cache.has(name)) return cache.get(name);
  let { data } = await supabase.from(table).select("id").eq("name", name).maybeSingle();
  if (!data) {
    const ins = await supabase.from(table).insert({ name }).select("id").maybeSingle();
    data = ins.data;
  }
  const id = data?.id ?? null;
  cache.set(name, id);
  return id;
}

let inserted = 0;
let updated = 0;
let skipped = 0;
let failed = 0;

for (const it of items) {
  const label = `[${it.priority === "alta" ? "★" : " "}] ${it.faculdade} · ${it.materialType} · ${it.title}`.slice(0, 90);

  if (it.skip) {
    skipped++;
    continue;
  }
  if (it.sizeBytes && it.sizeBytes > maxMb * 1024 * 1024) {
    log("SKIP", `${label} — ${(it.sizeBytes / 1048576).toFixed(1)}MB acima do limite de ${maxMb}MB`);
    skipped++;
    continue;
  }

  const hash = it.sha256 || it.key;
  const materialId = uuidv5(`sha256:${hash}`);

  if (DRY) {
    log("•", `[dry] ${label}`);
    inserted++;
    continue;
  }

  try {
    // Dedup por hash: existe? então atualiza metadados, não recria.
    const { data: existing } = await supabase
      .from("materials")
      .select("id,storage_path")
      .eq("file_hash", hash)
      .maybeSingle();

    const facultyId = await getOrCreate("faculties", facultyCache, it.faculdade);
    const vestibularId = await getOrCreate("vestibulares", vestibularCache, it.vestibular);

    const baseTags = [
      String(it.vestibular || "").toLowerCase(),
      String(it.faculdade || "").toLowerCase(),
      String(it.year || ""),
      String(it.materialType || "").toLowerCase(),
      it.editora ? String(it.editora).toLowerCase() : "",
      it.priority === "alta" ? "prioridade-alta" : "",
    ].filter(Boolean);

    const fields = {
      owner_id: ownerId,
      title: it.title,
      description: it.description || null,
      subject: it.subject || "Geral",
      material_type: it.materialType || "Apostila",
      vestibular: it.vestibular || "Todos",
      faculdade: it.faculdade || "Geral",
      vestibular_id: vestibularId,
      faculty_id: facultyId,
      year: it.year || new Date().getFullYear(),
      editora: it.editora || null,
      priority: it.priority === "alta" ? "alta" : "normal",
      difficulty: it.difficulty || null,
      slug: it.slug || null,
      keywords: Array.isArray(it.keywords) ? it.keywords : [],
      tags: baseTags,
      upload_kind: "file",
      status,
      file_hash: hash,
    };

    if (existing) {
      const { error: updErr } = await supabase.from("materials").update(fields).eq("id", existing.id);
      if (updErr) throw new Error(`update: ${updErr.message}`);
      log("•", `dup → metadados atualizados: ${label}`);
      updated++;
      continue;
    }

    // Sobe o PDF e cria o registro.
    const storagePath = `${ownerId}/tg-${materialId}.pdf`;
    const buf = readFileSync(it.localPath);
    const { error: upErr } = await supabase.storage
      .from("materials")
      .upload(storagePath, buf, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error(`upload: ${upErr.message}`);

    const { data: pub } = supabase.storage.from("materials").getPublicUrl(storagePath);

    const { error: insErr } = await supabase.from("materials").insert({
      id: materialId,
      ...fields,
      file_url: pub.publicUrl,
      storage_path: storagePath,
    });
    if (insErr) throw new Error(`insert: ${insErr.message}`);

    log("PASS", label);
    inserted++;
  } catch (e) {
    log("FAIL", `${label} — ${e.message}`);
    failed++;
  }
}

console.log(
  `\n== ${DRY ? "PRÉVIA" : "Importação"}: ${inserted} novos · ${updated} atualizados · ${skipped} pulados · ${failed} falhas ==`,
);
process.exit(failed > 0 ? 1 : 0);
