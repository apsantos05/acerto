/**
 * Utilitários compartilhados do pipeline de importação do Telegram.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

// Base do cache. Pode ser sobrescrita por CACHE_DIR (ex.: pipeline local),
// avaliada de forma preguiçosa para respeitar env definido antes do import.
export function cacheDir() {
  return process.env.CACHE_DIR || join("content", "telegram", "cache");
}

// Cache de texto extraído (pdf-parse ou OCR), por sha256.
export function textCachePath(hash) {
  return join(cacheDir(), "text", `${hash}.txt`);
}
export function readTextCache(hash) {
  const p = textCachePath(hash);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}
export function writeTextCache(hash, text) {
  mkdirSync(join(cacheDir(), "text"), { recursive: true });
  writeFileSync(textCachePath(hash), text ?? "");
}

// Cache de resultado da IA, por sha256.
export function aiCachePath(hash) {
  return join(cacheDir(), "ai", `${hash}.json`);
}
export function readAiCache(hash) {
  const p = aiCachePath(hash);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}
export function writeAiCache(hash, obj) {
  mkdirSync(join(cacheDir(), "ai"), { recursive: true });
  writeFileSync(aiCachePath(hash), JSON.stringify(obj, null, 2));
}

export function loadEnv(path = ".env.local") {
  const env = {};
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return env;
  }
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

export const log = (status, msg) => {
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : status === "SKIP" ? "⏭️ " : "•";
  console.log(`${icon} ${msg}`);
};

// Namespace fixo do Acerte para gerar IDs determinísticos (idempotência).
const NAMESPACE = "9b1f6d2e-6a3c-5e7b-8c4d-acer7e000001";

function parseUuid(uuid) {
  return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

function formatUuid(bytes) {
  const h = Buffer.from(bytes).toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

// UUID v5 (SHA-1) determinístico: a mesma origem sempre gera o mesmo id,
// então reimportar não duplica o material no banco nem no Storage.
export function uuidv5(name, namespace = NAMESPACE) {
  const nsBytes = parseUuid(namespace);
  const hash = createHash("sha1")
    .update(Buffer.concat([nsBytes, Buffer.from(name, "utf8")]))
    .digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // versão 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122
  return formatUuid(bytes);
}

export function sourceKey(chatId, messageId) {
  return `tg:${chatId}:${messageId}`;
}
