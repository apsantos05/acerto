/**
 * Acerte — Etapa 1: baixar PDFs do Telegram (cliente MTProto via gramjs).
 *
 * Pré-requisitos:
 *   npm i -D telegram input
 *   Em https://my.telegram.org → API development tools, gere api_id e api_hash.
 *   No .env.local adicione:
 *     TELEGRAM_API_ID=123456
 *     TELEGRAM_API_HASH=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *     TELEGRAM_SESSION=        (deixe vazio na 1ª vez; o script imprime o valor)
 *
 * Origens em scripts/telegram/sources.json (string OU {source, editora}).
 * Suporta canais públicos (@nome / t.me/nome) e links de convite privados
 * (t.me/+HASH): nesse caso o script tenta ENTRAR no canal automaticamente.
 *
 * Uso:
 *   node scripts/telegram/pull-telegram.mjs
 *
 * Gera content/telegram/manifest.json (1 entrada por PDF, com sha256 p/ dedup).
 * A autenticação é SUA: telefone/código/2FA digitados por você no terminal.
 */
import { mkdirSync, writeFileSync, existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { loadEnv, log, sourceKey } from "./lib.mjs";

const env = { ...loadEnv(), ...process.env };
const apiId = Number(env.TELEGRAM_API_ID);
const apiHash = env.TELEGRAM_API_HASH;

if (!apiId || !apiHash) {
  log("FAIL", "Defina TELEGRAM_API_ID e TELEGRAM_API_HASH no .env.local (veja my.telegram.org).");
  process.exit(1);
}

let TelegramClient, StringSession, Api, input;
try {
  ({ TelegramClient, Api } = await import("telegram"));
  ({ StringSession } = await import("telegram/sessions/index.js"));
  input = (await import("input")).default;
} catch {
  log("FAIL", "Dependências ausentes. Rode: npm i -D telegram input");
  process.exit(1);
}

const OUT_DIR = join("content", "telegram");
const FILES_DIR = join(OUT_DIR, "files");
mkdirSync(FILES_DIR, { recursive: true });

let config;
try {
  config = JSON.parse(readFileSync(join("scripts", "telegram", "sources.json"), "utf8"));
} catch {
  log("FAIL", "Crie scripts/telegram/sources.json (copie de sources.example.json).");
  process.exit(1);
}

const rawSources = Array.isArray(config.sources) ? config.sources : [];
const sources = rawSources.map((s) =>
  typeof s === "string" ? { source: s, editora: null } : { source: s.source, editora: s.editora ?? null },
);
const maxPerChat = Number(config.maxPerChat) || 0; // 0 = todas
if (sources.length === 0) {
  log("FAIL", "Nenhuma origem em sources.json.");
  process.exit(1);
}

function slugSource(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "origem";
}

function filenameOf(doc, fallback) {
  const attr = (doc.attributes || []).find((a) => a.className === "DocumentAttributeFilename");
  return attr?.fileName || fallback;
}

function inviteHash(source) {
  const m = String(source).match(/(?:t\.me\/\+|t\.me\/joinchat\/|^\+)([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

const client = new TelegramClient(new StringSession(env.TELEGRAM_SESSION || ""), apiId, apiHash, {
  connectionRetries: 5,
});

await client.start({
  phoneNumber: async () => await input.text("Telefone (formato +55DDDNUMERO): "),
  password: async () => await input.text("Senha 2FA (se tiver, senão Enter): "),
  phoneCode: async () => await input.text("Código recebido no Telegram: "),
  onError: (err) => console.log("Erro de login:", err?.message || err),
});

if (!env.TELEGRAM_SESSION) {
  console.log("\n=== Salve esta linha no .env.local para não logar de novo ===");
  console.log(`TELEGRAM_SESSION=${client.session.save()}`);
  console.log("============================================================\n");
}

// Resolve a origem em uma entidade do gramjs, entrando em canais privados
// quando a origem é um link de convite (t.me/+HASH).
async function resolveEntity(source) {
  const hash = inviteHash(source);
  if (hash) {
    try {
      const info = await client.invoke(new Api.messages.CheckChatInvite({ hash }));
      if (info.chat) return info.chat; // já é membro
    } catch {
      /* segue para o import */
    }
    const updates = await client.invoke(new Api.messages.ImportChatInvite({ hash }));
    const chat = updates.chats?.[0];
    if (chat) return chat;
    throw new Error("não foi possível entrar pelo link de convite");
  }
  return client.getEntity(source);
}

const manifest = [];
let totalPdf = 0;

for (const { source, editora } of sources) {
  const slug = slugSource(source);
  const dir = join(FILES_DIR, slug);
  mkdirSync(dir, { recursive: true });

  let entity;
  try {
    entity = await resolveEntity(source);
  } catch (e) {
    log("FAIL", `Origem "${source}" inacessível: ${e?.message || e}`);
    continue;
  }

  const chatId = String(entity.id?.value ?? entity.id ?? source);
  let countChat = 0;

  try {
    for await (const msg of client.iterMessages(entity, maxPerChat ? { limit: maxPerChat } : {})) {
      const doc = msg.document;
      if (!doc) continue;
      const mime = doc.mimeType || "";
      const fileName = filenameOf(doc, `${msg.id}.pdf`);
      const isPdf = mime === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
      if (!isPdf) continue;

      const localPath = join(dir, `${msg.id}-${fileName}`.replace(/[\\/:*?"<>|]+/g, "_"));
      if (!existsSync(localPath)) {
        const buf = await client.downloadMedia(msg, {});
        if (!buf) continue;
        writeFileSync(localPath, buf);
      }

      const bytes = readFileSync(localPath);
      const hash = createHash("sha256").update(bytes).digest("hex");

      manifest.push({
        key: sourceKey(chatId, msg.id),
        source: String(source),
        editora: editora || null,
        chatId,
        messageId: msg.id,
        date: msg.date ? new Date(msg.date * 1000).toISOString() : null,
        fileName,
        caption: (msg.message || "").trim(),
        localPath,
        sizeBytes: statSync(localPath).size,
        sha256: hash,
      });
      countChat++;
      totalPdf++;
      if (countChat % 10 === 0) log("•", `${source}: ${countChat} PDFs...`);
    }
  } catch (e) {
    log("FAIL", `Erro ao percorrer "${source}": ${e?.message || e}`);
  }

  log("PASS", `${source}: ${countChat} PDFs baixados`);
}

writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
log("PASS", `Total: ${totalPdf} PDFs · manifesto em ${join(OUT_DIR, "manifest.json")}`);
await client.disconnect();
process.exit(0);
