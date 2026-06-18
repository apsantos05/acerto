/**
 * Verificação pós-migração (lado aplicação) — Acerte x Supabase.
 *
 * Uso:  node scripts/post-migration-check.mjs
 *
 * Roda, via Publishable Key (anon), exatamente as queries/colunas que o app
 * usa em cada fluxo. Erros de coluna/tabela/relacionamento (42703 / PGRST205)
 * aparecem mesmo sem login — então isto confirma se a migração alinhou o banco.
 *
 * NÃO valida RLS/policies/triggers (o anon não enxerga catálogo). Para isso,
 * rode supabase/verify_migration.sql no SQL Editor.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const raw = readFileSync(".env.local", "utf8");
const env = {};
raw.split(/\r?\n/).forEach((l) => {
  if (!l.trim() || l.trim().startsWith("#")) return;
  const i = l.indexOf("=");
  if (i < 0) return;
  env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
});
const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);

let pass = 0;
let fail = 0;
async function check(label, query) {
  const { error } = await query;
  if (error) {
    fail++;
    console.log("❌", label, "—", error.code || "", error.message);
  } else {
    pass++;
    console.log("✅", label);
  }
}

console.log("== Verificação pós-migração (aplicação) ==\n");

// --- profiles (perfil público + edição de perfil + faculdades de interesse) ---
await check(
  "profiles: colunas de perfil/edição",
  sb.from("profiles").select(
    "id,username,full_name,email,avatar_url,bio,objective,dream_faculty,target_exams,city,state,points,streak_days,badges",
  ).limit(1),
);

// --- materials (biblioteca, meus materiais, upload) ---
await check(
  "materials: colunas de leitura (biblioteca)",
  sb.from("materials").select(
    "id,title,description,vestibular,faculdade,year,subject,material_type,file_url,external_url,storage_path,upload_kind,tags,status,rating,views_count,created_at",
  ).limit(1),
);
await check(
  "materials: filtro owner_id (meus materiais)",
  sb.from("materials").select("id").eq("owner_id", "00000000-0000-0000-0000-000000000000").limit(1),
);
await check(
  "materials: colunas de upload (vestibular_id/faculty_id)",
  sb.from("materials").select("id,vestibular_id,faculty_id,material_type,storage_path,upload_kind").limit(1),
);

// --- posts + feed (embedded relations) ---
await check(
  "posts: colunas (incl. tags)",
  sb.from("posts").select("id,author_id,content,material_id,tags,created_at").limit(1),
);
await check(
  "feed: posts embed author+material (FK)",
  sb.from("posts").select(
    "id,content,tags,created_at,author:profiles!posts_author_id_fkey(id,full_name,email,city),material:materials!posts_material_id_fkey(id,title,subject,material_type)",
  ).limit(1),
);
await check(
  "feed: comments embed author (FK)",
  sb.from("comments").select(
    "id,post_id,content,created_at,author:profiles!comments_author_id_fkey(id,full_name,email,city)",
  ).limit(1),
);

// --- likes (polimórfico) ---
await check(
  "likes: target_type/target_id (polimórfico)",
  sb.from("likes").select("target_type,target_id,user_id").eq("target_type", "post").limit(1),
);

// --- saved_posts / saved_materials ---
await check("saved_posts: existe", sb.from("saved_posts").select("post_id,user_id").limit(1));
await check("saved_materials: existe", sb.from("saved_materials").select("user_id,material_id").limit(1));

// --- lookups usados no upload ---
await check("vestibulares: name", sb.from("vestibulares").select("id,name").limit(1));
await check("faculties: name", sb.from("faculties").select("id,name").limit(1));

// --- storage (avatar e materiais usam o bucket "materials") ---
const { error: stErr } = await sb.storage.from("materials").list("", { limit: 1 });
if (stErr) {
  fail++;
  console.log("❌", 'storage bucket "materials"', "—", stErr.message);
} else {
  pass++;
  console.log("✅", 'storage bucket "materials" acessível');
}

console.log(`\n== Resumo: ${pass} OK · ${fail} ERRO ==`);
console.log(
  fail === 0
    ? "Tudo alinhado — os fluxos do app devem funcionar."
    : "Ainda há lacunas — rode/repita a migração e verifique os itens com ❌.",
);
process.exit(fail > 0 ? 1 : 0);
