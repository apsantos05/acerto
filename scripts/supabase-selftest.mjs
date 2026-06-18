/**
 * Autoteste da integração Acerte <-> Supabase.
 *
 * Uso:
 *   node scripts/supabase-selftest.mjs
 *
 * Lê o .env.local, valida as credenciais e executa, em sequência:
 *   1. Carga das variáveis de ambiente
 *   2. Validação da URL e da chave (publishable/anon, nunca service_role)
 *   3. Conexão (alcançabilidade do endpoint de auth)
 *   4. Cadastro (signUp) com um e-mail de teste aleatório
 *   5. Login (signIn) com o mesmo usuário
 *   6. Criação automática de perfil na tabela profiles
 *   7. Acesso às tabelas do banco
 *   8. Acesso ao bucket "materials" do Storage
 *
 * Não fabrica resultados: cada passo imprime PASS / FAIL / SKIP com o motivo.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const TABLES = [
  "profiles",
  "vestibulares",
  "faculties",
  "materials",
  "posts",
  "comments",
  "likes",
  "saved_materials",
];
const BUCKET = "materials";

function loadEnv(path = ".env.local") {
  const env = {};
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return { env, error: `Não foi possível ler ${path}` };
  }
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { env };
}

const PLACEHOLDER = /seu-project|your-project|cole-a|sua-chave|your-anon|your-publishable|example\.supabase/i;

function classifyKey(k) {
  if (k.startsWith("sb_publishable_")) return { kind: "publishable", safe: true };
  if (k.startsWith("sb_secret_")) return { kind: "secret", safe: false };
  if (k.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(Buffer.from(k.split(".")[1], "base64").toString());
      return { kind: `jwt:${payload.role}`, safe: payload.role === "anon", ref: payload.ref };
    } catch {
      return { kind: "jwt:?", safe: true };
    }
  }
  return { kind: "desconhecido", safe: false };
}

const results = [];
const log = (step, status, detail = "") => {
  results.push({ step, status, detail });
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️ ";
  console.log(`${icon} ${step}${detail ? " — " + detail : ""}`);
};

async function main() {
  console.log("== Autoteste Supabase — Acerte ==\n");

  // 1. ENV
  const { env, error } = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (error || !url || !key) {
    log("1. Variáveis de ambiente", "FAIL", error || "URL ou KEY ausente no .env.local");
    return finish();
  }
  log("1. Variáveis de ambiente", "PASS", `URL e KEY presentes`);

  // 2. Validação
  if (PLACEHOLDER.test(url) || PLACEHOLDER.test(key)) {
    log("2. Validação de credenciais", "FAIL", "ainda são valores de exemplo (placeholder)");
    return finish();
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    log("2. Validação de credenciais", "FAIL", `URL inválida: ${url}`);
    return finish();
  }
  if (parsed.protocol !== "https:") {
    log("2. Validação de credenciais", "FAIL", "URL deve ser https://");
    return finish();
  }
  const kc = classifyKey(key);
  if (!kc.safe) {
    log("2. Validação de credenciais", "FAIL", `chave do tipo "${kc.kind}" — use a Publishable/anon, NUNCA service_role`);
    return finish();
  }
  log("2. Validação de credenciais", "PASS", `host=${parsed.host} key=${kc.kind}`);

  // 3. Conexão
  try {
    const res = await fetch(`${parsed.origin}/auth/v1/health`, { headers: { apikey: key } });
    log("3. Conexão (auth/health)", res.ok ? "PASS" : "FAIL", `HTTP ${res.status}`);
    if (!res.ok) return finish();
  } catch (e) {
    log("3. Conexão (auth/health)", "FAIL", `${e.message} (URL inalcançável / DNS)`);
    return finish();
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // 4. Cadastro
  const stamp = process.argv[2] || Math.abs(hashCode(url + key + Date.now())).toString(36);
  // mailinator.com tem MX real e aceita qualquer endereço — o Supabase rejeita
  // domínios sem MX (example.com, etc.) quando a confirmação de e-mail está ativa.
  const testEmail = `acerte.selftest.${stamp}@mailinator.com`;
  const testPass = "Teste123!" + stamp;
  let userId = null;
  try {
    const { data, error: e } = await supabase.auth.signUp({
      email: testEmail,
      password: testPass,
      options: { data: { full_name: "Selftest Acerte" } },
    });
    if (e) {
      log("4. Cadastro (signUp)", "FAIL", e.message);
    } else {
      userId = data.user?.id ?? null;
      log("4. Cadastro (signUp)", "PASS", `user=${userId ?? "(sem id)"} session=${data.session ? "sim" : "não (confirmação por e-mail ativa)"}`);
    }
  } catch (e) {
    log("4. Cadastro (signUp)", "FAIL", e.message);
  }

  // 5. Login
  try {
    const { data, error: e } = await supabase.auth.signInWithPassword({ email: testEmail, password: testPass });
    if (e) {
      log("5. Login (signIn)", "FAIL", e.message + " (pode ser confirmação de e-mail obrigatória)");
    } else {
      userId = data.user?.id ?? userId;
      log("5. Login (signIn)", "PASS", `sessão obtida para user=${data.user?.id}`);
    }
  } catch (e) {
    log("5. Login (signIn)", "FAIL", e.message);
  }

  // 6. Perfil automático
  if (userId) {
    try {
      const { data, error: e } = await supabase.from("profiles").select("id, username").eq("id", userId).maybeSingle();
      if (e) log("6. Perfil automático", "FAIL", e.message);
      else log("6. Perfil automático", data ? "PASS" : "FAIL", data ? `profile id=${data.id}` : "trigger não criou a linha em profiles");
    } catch (e) {
      log("6. Perfil automático", "FAIL", e.message);
    }
  } else {
    log("6. Perfil automático", "SKIP", "sem userId (cadastro/login não retornou usuário)");
  }

  // 7. Tabelas
  for (const t of TABLES) {
    try {
      const { error: e } = await supabase.from(t).select("*", { count: "exact", head: true });
      log(`7. Tabela ${t}`, e ? "FAIL" : "PASS", e ? e.message : "acessível");
    } catch (e) {
      log(`7. Tabela ${t}`, "FAIL", e.message);
    }
  }

  // 8. Storage
  try {
    const { data, error: e } = await supabase.storage.from(BUCKET).list("", { limit: 1 });
    if (e) log(`8. Storage bucket "${BUCKET}"`, "FAIL", e.message);
    else log(`8. Storage bucket "${BUCKET}"`, "PASS", `acessível (itens na raiz: ${data?.length ?? 0})`);
  } catch (e) {
    log(`8. Storage bucket "${BUCKET}"`, "FAIL", e.message);
  }

  finish();
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function finish() {
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const skip = results.filter((r) => r.status === "SKIP").length;
  console.log(`\n== Resumo: ${pass} PASS · ${fail} FAIL · ${skip} SKIP ==`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Erro inesperado no autoteste:", e);
  process.exit(1);
});
