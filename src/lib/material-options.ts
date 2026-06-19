export const materialTypes = [
  "Apostila",
  "Material teórico",
  "Resumo",
  "Revisão",
  "Mapa mental",
  "Lista de exercícios",
  "Caderno de questões",
  "Questões discursivas",
  "Questões objetivas",
  "Simulado",
  "Prova",
  "Gabarito",
  "Correção comentada",
  "Redação",
  "Discursiva",
  "Edital",
  "Leitura",
] as const;

export type MaterialType = (typeof materialTypes)[number];

export const materialStatuses = ["pending", "approved", "rejected"] as const;

export type MaterialStatus = (typeof materialStatuses)[number];
