// Catálogo canônico para as páginas de SEO (universidades, matérias,
// vestibulares). Os valores de `filter` espelham o que a ingestão grava em
// materials (faculdade/subject/vestibular), para que os hubs reusem a mesma
// consulta da biblioteca.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://acertavest.com.br"
).replace(/\/$/, "");

export const SITE_NAME = "AcertaVest";

export type CatalogEntry = {
  slug: string;
  name: string; // nome curto exibido (ex.: USP)
  label: string; // título da página (ex.: Medicina USP)
  filter: string; // valor usado em materials
  blurb: string; // descrição (meta description + intro)
};

// FASE 2 — universidades prioritárias de Medicina.
export const UNIVERSITIES: CatalogEntry[] = [
  { slug: "usp", name: "USP", label: "Medicina USP", filter: "USP", blurb: "Materiais de Medicina na USP (vestibular Fuvest): provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "unicamp", name: "Unicamp", label: "Medicina Unicamp", filter: "UNICAMP", blurb: "Materiais de Medicina na Unicamp (vestibular Comvest): provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "unesp", name: "Unesp", label: "Medicina Unesp", filter: "UNESP", blurb: "Materiais de Medicina na Unesp: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "ufsc", name: "UFSC", label: "Medicina UFSC", filter: "UFSC", blurb: "Materiais de Medicina na UFSC: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "ufpr", name: "UFPR", label: "Medicina UFPR", filter: "UFPR", blurb: "Materiais de Medicina na UFPR: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "ufmg", name: "UFMG", label: "Medicina UFMG", filter: "UFMG", blurb: "Materiais de Medicina na UFMG: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "unifesp", name: "Unifesp", label: "Medicina Unifesp", filter: "UNIFESP", blurb: "Materiais de Medicina na Unifesp: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "famerp", name: "Famerp", label: "Medicina Famerp", filter: "FAMERP", blurb: "Materiais de Medicina na Famerp: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "einstein", name: "Einstein", label: "Medicina Albert Einstein", filter: "ALBERT EINSTEIN", blurb: "Materiais de Medicina no Albert Einstein: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "santa-casa", name: "Santa Casa", label: "Medicina Santa Casa", filter: "SANTA CASA", blurb: "Materiais de Medicina na Santa Casa SP: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "slmandic", name: "SLMandic", label: "Medicina SLMandic", filter: "SLMANDIC", blurb: "Materiais de Medicina na SLMandic: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "ufrj", name: "UFRJ", label: "Medicina UFRJ", filter: "UFRJ", blurb: "Materiais de Medicina na UFRJ: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "famema", name: "Famema", label: "Medicina Famema", filter: "FAMEMA", blurb: "Materiais de Medicina na Famema: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "ufscar", name: "UFSCar", label: "Medicina UFSCar", filter: "UFSCAR", blurb: "Materiais de Medicina na UFSCar: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "puc-sp", name: "PUC-SP", label: "Medicina PUC-SP", filter: "PUC-SP", blurb: "Materiais de Medicina na PUC-SP: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "puc", name: "PUC", label: "Medicina PUC", filter: "PUC", blurb: "Materiais de Medicina nas PUCs: provas, gabaritos, apostilas, simulados, revisões e redações." },
  { slug: "enem", name: "ENEM / SISU", label: "Medicina pelo ENEM / SISU", filter: "ENEM / SISU", blurb: "Materiais para entrar em Medicina pelo ENEM e SISU: provas, gabaritos, apostilas, simulados, revisões e redações." },
];

// FASE 6 — matérias.
export const SUBJECTS: CatalogEntry[] = [
  { slug: "biologia", name: "Biologia", label: "Biologia para Medicina", filter: "Biologia", blurb: "Materiais de Biologia para vestibulares de Medicina: provas, listas, resumos e revisões." },
  { slug: "quimica", name: "Química", label: "Química para Medicina", filter: "Química", blurb: "Materiais de Química para vestibulares de Medicina: provas, listas, resumos e revisões." },
  { slug: "fisica", name: "Física", label: "Física para Medicina", filter: "Física", blurb: "Materiais de Física para vestibulares de Medicina: provas, listas, resumos e revisões." },
  { slug: "matematica", name: "Matemática", label: "Matemática para Medicina", filter: "Matemática", blurb: "Materiais de Matemática para vestibulares de Medicina: provas, listas, resumos e revisões." },
  { slug: "historia", name: "História", label: "História para Medicina", filter: "História", blurb: "Materiais de História para vestibulares de Medicina: provas, listas, resumos e revisões." },
  { slug: "geografia", name: "Geografia", label: "Geografia para Medicina", filter: "Geografia", blurb: "Materiais de Geografia para vestibulares de Medicina: provas, listas, resumos e revisões." },
  { slug: "portugues", name: "Português", label: "Português para Medicina", filter: "Português", blurb: "Materiais de Português para vestibulares de Medicina: provas, listas, resumos e revisões." },
  { slug: "literatura", name: "Literatura", label: "Literatura para Medicina", filter: "Literatura", blurb: "Materiais de Literatura para vestibulares de Medicina: provas, listas, resumos e revisões." },
  { slug: "redacao", name: "Redação", label: "Redação para Medicina", filter: "Redação", blurb: "Materiais de Redação para vestibulares de Medicina: temas, repertórios, modelos e correções." },
  { slug: "filosofia", name: "Filosofia", label: "Filosofia para Medicina", filter: "Filosofia", blurb: "Materiais de Filosofia para vestibulares de Medicina: provas, listas, resumos e revisões." },
  { slug: "sociologia", name: "Sociologia", label: "Sociologia para Medicina", filter: "Sociologia", blurb: "Materiais de Sociologia para vestibulares de Medicina: provas, listas, resumos e revisões." },
  { slug: "ingles", name: "Inglês", label: "Inglês para Medicina", filter: "Inglês", blurb: "Materiais de Inglês para vestibulares de Medicina: provas, listas, resumos e revisões." },
];

// FASE 6 — vestibulares. `filter` é o valor da coluna `vestibular`.
export const VESTIBULARES: CatalogEntry[] = [
  { slug: "fuvest", name: "Fuvest", label: "Vestibular Fuvest (USP)", filter: "FUVEST", blurb: "Provas, gabaritos e materiais da Fuvest — o vestibular da USP — para quem busca Medicina." },
  { slug: "comvest", name: "Comvest", label: "Vestibular Comvest (Unicamp)", filter: "UNICAMP", blurb: "Provas, gabaritos e materiais da Comvest — o vestibular da Unicamp — para quem busca Medicina." },
  { slug: "unesp", name: "Unesp", label: "Vestibular Unesp", filter: "UNESP", blurb: "Provas, gabaritos e materiais do vestibular da Unesp para quem busca Medicina." },
  { slug: "famerp", name: "Famerp", label: "Vestibular Famerp", filter: "FAMERP", blurb: "Provas, gabaritos e materiais do vestibular da Famerp para quem busca Medicina." },
  { slug: "ufsc", name: "UFSC", label: "Vestibular UFSC", filter: "UFSC", blurb: "Provas, gabaritos e materiais do vestibular da UFSC para quem busca Medicina." },
  { slug: "ufpr", name: "UFPR", label: "Vestibular UFPR", filter: "UFPR", blurb: "Provas, gabaritos e materiais do vestibular da UFPR para quem busca Medicina." },
  { slug: "ufmg", name: "UFMG", label: "Vestibular UFMG", filter: "UFMG", blurb: "Provas, gabaritos e materiais do vestibular da UFMG para quem busca Medicina." },
  { slug: "unifesp", name: "Unifesp", label: "Vestibular Unifesp", filter: "UNIFESP", blurb: "Provas, gabaritos e materiais do vestibular da Unifesp para quem busca Medicina." },
  { slug: "ufrj", name: "UFRJ", label: "Vestibular UFRJ", filter: "UFRJ", blurb: "Provas, gabaritos e materiais do vestibular da UFRJ para quem busca Medicina." },
  { slug: "famema", name: "Famema", label: "Vestibular Famema", filter: "FAMEMA", blurb: "Provas, gabaritos e materiais do vestibular da Famema para quem busca Medicina." },
  { slug: "ufscar", name: "UFSCar", label: "Vestibular UFSCar", filter: "UFSCAR", blurb: "Provas, gabaritos e materiais do vestibular da UFSCar para quem busca Medicina." },
  { slug: "puc-sp", name: "PUC-SP", label: "Vestibular PUC-SP", filter: "PUC-SP", blurb: "Provas, gabaritos e materiais do vestibular da PUC-SP para quem busca Medicina." },
  { slug: "puc", name: "PUC", label: "Vestibular PUC", filter: "PUC", blurb: "Provas, gabaritos e materiais dos vestibulares das PUCs para quem busca Medicina." },
  { slug: "einstein", name: "Einstein", label: "Vestibular Albert Einstein", filter: "ALBERT EINSTEIN", blurb: "Provas, gabaritos e materiais do vestibular do Albert Einstein para quem busca Medicina." },
  { slug: "santa-casa", name: "Santa Casa", label: "Vestibular Santa Casa", filter: "SANTA CASA", blurb: "Provas, gabaritos e materiais do vestibular da Santa Casa para quem busca Medicina." },
  { slug: "mandic", name: "Mandic", label: "Vestibular SLMandic", filter: "MANDIC", blurb: "Provas, gabaritos e materiais do vestibular da SLMandic para quem busca Medicina." },
  { slug: "enem", name: "ENEM", label: "ENEM", filter: "ENEM", blurb: "Provas, gabaritos e materiais do ENEM para quem busca Medicina pelo SiSU." },
];

const bySlug = (list: CatalogEntry[], slug: string) =>
  list.find((e) => e.slug === slug);

export const getUniversity = (slug: string) => bySlug(UNIVERSITIES, slug);
export const getSubject = (slug: string) => bySlug(SUBJECTS, slug);
export const getVestibular = (slug: string) => bySlug(VESTIBULARES, slug);
