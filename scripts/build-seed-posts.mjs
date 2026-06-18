/**
 * Acerte — Builder do seed do feed inicial (perfil "Acerte Oficial" + 50 posts).
 * Lê content/feed-posts.json e gera supabase/seed_feed.sql (idempotente).
 * Nenhum usuário comum é criado — só o perfil oficial assina o conteúdo inicial.
 */
import { readFileSync, writeFileSync } from "node:fs";

const OFFICIAL_ID = "ace00000-0000-4000-a000-000000000001";
const data = JSON.parse(readFileSync("content/feed-posts.json", "utf8"));

const esc = (s) => s.replace(/'/g, "''");
const out = [];
out.push("-- ACERTE — Seed do feed inicial: perfil 'Acerte Oficial' + 50 posts. Idempotente.");
out.push("-- Pré-requisito: supabase/admin_role.sql (coluna profiles.role).");
out.push("");
out.push("-- 1) Usuário de sistema (sem login) para o perfil oficial.");
out.push("--    Requer pgcrypto (gen_salt/crypt) — habilitado por padrão no Supabase.");
out.push("--    Alternativa: crie o usuário no painel (Authentication > Add user) e pule este insert.");
out.push(`insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '${OFFICIAL_ID}',
  'authenticated', 'authenticated', 'oficial@acerte.app',
  crypt('seed-acerte-oficial', gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Acerte Oficial","username":"acerteoficial"}',
  false, '', '', '', ''
) on conflict (id) do nothing;`);
out.push("");
out.push("-- 2) Perfil oficial (sobrescreve username/role mesmo se a trigger já criou).");
out.push(`insert into public.profiles (id, username, full_name, bio, role)
values ('${OFFICIAL_ID}', 'acerteoficial', 'Acerte Oficial', 'Perfil oficial da comunidade Acerte.', 'official')
on conflict (id) do update set
  username = excluded.username,
  full_name = excluded.full_name,
  bio = excluded.bio,
  role = excluded.role;`);
out.push("");
out.push("-- 3) 50 posts iniciais (não duplica: insere só se ainda não existir o mesmo conteúdo do autor).");

const categoryTag = { duvidas: "dúvida", dicas: "dica", motivacionais: "motivação" };
let total = 0;
for (const [cat, posts] of Object.entries(data)) {
  const tag = categoryTag[cat] ?? "acerte";
  for (const content of posts) {
    total += 1;
    out.push(
      `insert into public.posts (author_id, content, tags)\n` +
        `select '${OFFICIAL_ID}', '${esc(content)}', ARRAY['${esc(tag)}']::text[]\n` +
        `where not exists (select 1 from public.posts where author_id = '${OFFICIAL_ID}' and content = '${esc(content)}');`,
    );
  }
}
out.push("");
out.push("select count(*) as posts_do_oficial from public.posts where author_id = '" + OFFICIAL_ID + "';");

writeFileSync("supabase/seed_feed.sql", out.join("\n"), "utf8");
console.log(`seed_feed.sql gerado com ${total} posts do perfil Acerte Oficial (${OFFICIAL_ID}).`);
