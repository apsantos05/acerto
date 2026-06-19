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
