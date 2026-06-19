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
export function cleanMaterialTitle(title: string | null | undefined): string {
  if (!title) return title ?? "";
  const trimmed = title.trim();

  // Captura UM inteiro inicial (1–4 dígitos) seguido de espaço e mais conteúdo.
  // O `\s+` exige espaço logo após os dígitos, então "13.7" (ponto) não casa.
  const match = trimmed.match(/^(\d{1,4})\s+(\S[\s\S]*)$/);
  if (!match) return trimmed;

  const leading = Number(match[1]);
  if (leading >= 1900 && leading <= 2099) {
    return trimmed; // provável ano — mantém
  }

  return match[2].trim();
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
