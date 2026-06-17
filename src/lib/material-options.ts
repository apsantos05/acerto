export const materialTypes = [
  "Prova",
  "Gabarito",
  "Simulado",
  "Resumo",
  "Lista de exercícios",
  "Mapa mental",
] as const;

export type MaterialType = (typeof materialTypes)[number];

export const materialStatuses = ["pending", "approved", "rejected"] as const;

export type MaterialStatus = (typeof materialStatuses)[number];
