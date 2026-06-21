// Remove prefixos numéricos ARTIFICIAIS no início do título de materiais
// (ex.: "999 ", "998 " — contadores que vieram do nome do arquivo na
// importação), preservando:
//   - números de seção com ponto: "13.7 Áreas das figuras planas"
//   - anos plausíveis: "2024 Prova ENEM"
//
// "999 13.7 ÁREAS DAS FIGURAS PLANAS"  → "13.7 ÁREAS DAS FIGURAS PLANAS"
// "998 BIOLOGIA MOLECULAR"             → "BIOLOGIA MOLECULAR"
// "13.7 ÁREAS..."                      → "13.7 ÁREAS..." (preservado)
// "2024 Prova ENEM"                    → "2024 Prova ENEM" (preservado)
// Tokens que devem permanecer em CAIXA ALTA ao aplicar Title Case.
const ACRONYMS = new Set([
  "ENEM", "SISU", "FUVEST", "USP", "UNICAMP", "UNESP", "UFMG", "UNIFESP",
  "UFRJ", "UFSC", "UFPR", "FAMERP", "FAMEMA", "UFSCAR", "PUC", "PUC-SP",
  "UECE", "ITA", "IME", "SP", "RJ", "MG", "SC", "PR", "BR", "COC", "SAS",
  "II", "III", "IV", "V", "VI",
]);
const CONTEXT_MARKER =
  /\b(conte[úu]do|quest[õo]es|exerc[íi]cios|gabarito|revis[ãa]o|resumo|caderno|corre[çc][ãa]o|simulado|prova|lista|teoria)\b/i;
const SMALL_WORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "para", "com", "a", "o", "na", "no", "ao", "aos",
]);
// Quando o número inicial é seguido por um destes substantivos, ele é uma
// CONTAGEM e faz parte do título (ex.: "1000 questões"), não um prefixo de lote.
const QUANTITY_NOUNS = new Set([
  "questões", "questoes", "exercícios", "exercicios", "mapas", "resumos", "resumo",
  "aulas", "aula", "provas", "prova", "simulados", "simulado", "listas", "lista",
  "páginas", "paginas", "atividades", "vídeos", "videos", "flashcards", "questões.",
]);

// Remove um prefixo artificial: número (1–4 dígitos, exceto ano) opcionalmente
// seguido de uma única letra. Ex.: "999 ", "5 B ", "12 A ". Só separador por
// espaço — assim "13.7" (ponto) é preservado. Aplica em loop (códigos de lote).
// NÃO remove quando o número é uma contagem ("1000 questões").
function stripPrefixes(input: string): string {
  let t = input;
  for (let i = 0; i < 3; i++) {
    const m = t.match(/^(\d{1,4})(\s+[A-Za-z])?\s+(\S[\s\S]*)$/);
    if (!m) break;
    const n = Number(m[1]);
    if (n >= 1900 && n <= 2099) break; // ano: mantém
    const nextWord = m[3].split(/\s+/)[0]?.toLowerCase() ?? "";
    if (QUANTITY_NOUNS.has(nextWord)) break; // contagem: mantém o número
    t = m[3].trim();
  }
  return t;
}

// Título "cru" = tudo MAIÚSCULO ou tudo minúsculo. Caixa mista = já legível.
function isMixedCase(t: string): boolean {
  let hasUpper = false;
  let hasLower = false;
  for (const ch of t) {
    if (!/[a-zà-ÿ]/i.test(ch)) continue;
    if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) hasUpper = true;
    else if (ch === ch.toLowerCase() && ch !== ch.toUpperCase()) hasLower = true;
    if (hasUpper && hasLower) return true;
  }
  return false;
}

function titleCase(t: string): string {
  const words = t.split(/\s+/).map((w, idx) => {
    if (ACRONYMS.has(w.toUpperCase())) return w.toUpperCase();
    if (/[0-9]/.test(w)) return w; // anos, seções "13.7"
    const letters = w.replace(/[^a-zà-ÿ]/gi, "");
    if (letters.length === 0) return w; // "+", pontuação isolada
    if (letters.length === 1) return w; // letra isolada (ex.: "(Q", "Y)") — preserva
    const lower = w.toLowerCase();
    if (idx > 0 && SMALL_WORDS.has(letters.toLowerCase())) return lower;
    // Capitaliza a 1ª LETRA (ignora "(" inicial): "(amarela)" → "(Amarela)".
    return lower.replace(/[a-zà-ÿ]/i, (c) => c.toUpperCase());
  });
  let out = words.join(" ");
  // Insere " — " antes do primeiro marcador de contexto (se houver título antes).
  const marker = out.match(CONTEXT_MARKER);
  if (marker && marker.index && marker.index > 0) {
    const before = out.slice(0, marker.index).trim();
    const after = out.slice(marker.index).trim();
    // Só insere se houver uma palavra real antes (evita "1000 — Questões...").
    if (/[a-zà-ÿ]{3,}/i.test(before) && !/[—–-]$/.test(before)) {
      out = `${before} — ${after}`;
    }
  }
  return out;
}

// Normaliza o título de um material:
//  1) remove extensão (.pdf / pdf / .PDF — inclusive colada: "ORIENTADASpdf")
//  2) remove lixo (underscores, "(1)", "download", espaços múltiplos)
//  3) remove prefixos artificiais ("999", "5 B", "12 A", códigos de lote)
//  4) se estiver "cru" (CAIXA ALTA), aplica Title Case + em-dash, preservando
//     acrônimos (ENEM/FUVEST/...) e seções com ponto ("13.7").
export function cleanMaterialTitle(title: string | null | undefined): string {
  if (!title) return title ?? "";
  const original = title.trim();
  let t = original;

  t = t.replace(/\.?pdf$/i, "").trim(); // extensão (com ou sem ponto, colada)
  t = t
    .replace(/_+/g, " ")
    .replace(/\bdownload\b/gi, " ")
    .replace(/\(\d+\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  t = stripPrefixes(t);
  // Title Case só quando o título está "cru" (tudo maiúsculo ou tudo minúsculo).
  // Títulos já em caixa mista (ex.: "UFSC 2015 - Prova 1 (Amarela)") ficam iguais.
  if (!isMixedCase(t)) t = titleCase(t);

  return (t.trim() || original).slice(0, 160);
}

const GENERIC_TITLES = new Set([
  "apostila", "material", "materiais", "pdf", "documento", "arquivo",
  "sem titulo", "sem título", "untitled", "doc", "scan", "imagem",
  "novo documento", "material de estudo",
]);

// UUID (8-4-4-4-12) com separador espaço OU hífen (ex.: "8643c68e 9b7a ...").
const UUID_LIKE =
  /[0-9a-f]{8}[\s-][0-9a-f]{4}[\s-][0-9a-f]{4}[\s-][0-9a-f]{4}[\s-]?[0-9a-f]{12}/i;

// Considera o título inválido quando parece UUID/hash/ID de arquivo,
// tem poucas palavras reais ou é genérico ("Apostila", "Material", "PDF").
export function isInvalidTitle(title: string | null | undefined): boolean {
  const t = (title ?? "").trim();
  if (!t || t.length < 3) return true;
  if (GENERIC_TITLES.has(t.toLowerCase())) return true;
  if (UUID_LIKE.test(t)) return true;

  const tokens = t.split(/[\s_\-.]+/).filter(Boolean);
  const realWords = tokens.filter(
    (tok) => /^[a-zA-ZÀ-ÿ]{3,}$/.test(tok) && !/^[0-9a-f]{6,}$/i.test(tok),
  );
  const junk = tokens.filter(
    (tok) => /^[0-9a-f]{6,}$/i.test(tok) || /^\d{4,}$/.test(tok),
  );

  if (realWords.length === 0) return true;
  if (realWords.length < 2 && junk.length >= 2) return true;
  if (tokens.length >= 4 && junk.length / tokens.length >= 0.5) return true;
  return false;
}

type TitleMeta = {
  editora?: string;
  subject?: string;
  vestibular?: string;
  materialType?: string;
  year?: number | null;
};

// Gera um título a partir dos METADADOS (sem ler o PDF). Retorna null quando
// não há informação suficiente para ficar melhor que um genérico — nesse caso
// o material precisa do script (que lê o PDF) / OCR.
export function titleFromMetadata(m: TitleMeta): string | null {
  const subj =
    m.subject && m.subject !== "Geral" && m.subject !== "Interdisciplinar"
      ? m.subject
      : "";
  const vest = m.vestibular && m.vestibular !== "Todos" ? m.vestibular : "";
  const type = m.materialType && m.materialType !== "Material" ? m.materialType : "";

  if (["Prova", "Simulado", "Gabarito", "Caderno de questões"].includes(type)) {
    let t = type;
    if (vest) t += ` ${vest}`;
    if (m.year) t += ` ${m.year}`;
    if (subj) t += ` — ${subj}`;
    return t;
  }
  if (m.editora && subj) return `Apostila ${m.editora} — ${subj}`;
  if (m.editora && type) return `${type} ${m.editora}`;
  if (subj && type) return `${type} — ${subj}`;
  if (subj) return `Material — ${subj}`;
  if (vest && type) return `${type} — ${vest}`;
  return null;
}
