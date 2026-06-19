// Reclassificador conservador de materiais (browser-safe; usado pela UI admin).
// Só altera um campo quando há detecção CONFIANTE — nunca rebaixa um valor
// específico para "Geral"/"Apostila". Espelha os heurísticos de
// scripts/telegram/classify-lib.mjs (mantenha os dois em sincronia).

type UniRule = [RegExp, string, string]; // regex, faculdade, vestibular

const UNIVERSITIES: UniRule[] = [
  [/fuvest|\busp\b/, "USP", "FUVEST"],
  [/comvest|unicamp/, "UNICAMP", "UNICAMP"],
  [/unifesp/, "UNIFESP", "UNIFESP"],
  [/vunesp|unesp/, "UNESP", "UNESP"],
  [/ufmg/, "UFMG", "UFMG"],
  [/famerp/, "FAMERP", "FAMERP"],
  [/famema/, "FAMEMA", "FAMEMA"],
  [/ufrj/, "UFRJ", "UFRJ"],
  [/ufscar/, "UFSCAR", "UFSCAR"],
  [/ufsc/, "UFSC", "UFSC"],
  [/ufpr/, "UFPR", "UFPR"],
  [/einstein/, "ALBERT EINSTEIN", "ALBERT EINSTEIN"],
  [/santa\s*casa/, "SANTA CASA", "SANTA CASA"],
  [/mandic/, "SLMANDIC", "MANDIC"],
  [/puc[\s-]*sp|pucsp/, "PUC-SP", "PUC-SP"],
  [/\bpuc\b/, "PUC", "PUC"],
  [/enem|sisu/, "ENEM / SISU", "ENEM"],
];

const PRIORITY_UNIS = new Set([
  "USP", "UNICAMP", "UNESP", "UFMG", "UNIFESP", "FAMERP", "UFRJ", "UFSC",
  "UFPR", "PUC", "PUC-SP", "ALBERT EINSTEIN", "SANTA CASA", "SLMANDIC",
]);

const EDITORAS: [RegExp, string][] = [
  [/bernoulli/, "Bernoulli"],
  [/poliedro/, "Poliedro"],
  [/hexag/, "Hexag"],
  [/farias\s*brito/, "Farias Brito"],
  [/\bcoc\b/, "COC"],
  [/\banglo\b/, "Anglo"],
  [/objetivo/, "Objetivo"],
  [/\betapa\b/, "Etapa"],
  [/\bsas\b/, "SAS"],
  [/ari\s*de\s*s[áa]/, "Ari de Sá"],
];
const PRIORITY_EDITORAS = new Set([
  "Bernoulli", "Poliedro", "Hexag", "Farias Brito", "COC", "Anglo",
  "Objetivo", "SAS", "Ari de Sá",
]);

const SUBJECTS: [RegExp, string][] = [
  [/biolog/, "Biologia"], [/qu[íi]mic/, "Química"], [/f[íi]sic/, "Física"],
  [/matem[áa]t/, "Matemática"], [/hist[óo]ri/, "História"], [/geografi/, "Geografia"],
  [/portugu|gram[áa]tic/, "Português"], [/literatur/, "Literatura"], [/reda[çc]/, "Redação"],
  [/filosofi/, "Filosofia"], [/sociolog/, "Sociologia"], [/ingl[êe]s/, "Inglês"],
];

function detectUniversity(text: string): { faculdade: string; vestibular: string } | null {
  for (const [re, faculdade, vestibular] of UNIVERSITIES) {
    if (re.test(text)) return { faculdade, vestibular };
  }
  return null;
}

function detectSubject(text: string): string | null {
  for (const [re, name] of SUBJECTS) if (re.test(text)) return name;
  return null;
}

function detectEditora(text: string): string | null {
  for (const [re, name] of EDITORAS) if (re.test(text)) return name;
  return null;
}

function detectType(text: string): string | null {
  if (/gabarito|resolu[çc]|resolvid/.test(text)) return "Gabarito";
  if (/corre[çc][ãa]o\s*coment|coment[ad]/.test(text)) return "Correção comentada";
  if (/simulad/.test(text)) return "Simulado";
  if (/caderno\s*de\s*quest/.test(text)) return "Caderno de questões";
  if (/discursiv/.test(text)) return "Questões discursivas";
  if (/objetiv/.test(text)) return "Questões objetivas";
  if (/lista|exerc[íi]cio/.test(text)) return "Lista de exercícios";
  if (/revis[ãa]/.test(text)) return "Revisão";
  if (/resumo|s[íi]ntese|esquematiz/.test(text)) return "Resumo";
  if (/mapa\s*mental/.test(text)) return "Mapa mental";
  if (/reda[çc]/.test(text)) return "Redação";
  if (/edital/.test(text)) return "Edital";
  if (/apostila/.test(text)) return "Apostila";
  if (/\bprova\b|vestibular/.test(text)) return "Prova";
  if (/teoria|te[óo]ric|m[óo]dulo|cap[íi]tulo|frente/.test(text)) return "Material teórico";
  return null; // sem keyword confiável → não altera
}

function detectDifficulty(text: string): string | null {
  if (/dif[íi]cil|avan[çc]ad|aprofund|extensiv/.test(text)) return "difícil";
  if (/b[áa]sic|f[áa]cil|introdut|iniciante/.test(text)) return "fácil";
  return null;
}

function detectYear(text: string): number | null {
  const match = text.match(/\b(19\d{2}|20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

function computePriority(faculdade: string, editora: string): "alta" | "normal" {
  return PRIORITY_UNIS.has(faculdade) || (editora && PRIORITY_EDITORAS.has(editora))
    ? "alta"
    : "normal";
}

const STOPWORDS = new Set([
  "para", "como", "com", "sem", "dos", "das", "uma", "uns", "que", "por", "pdf",
  "the", "and", "vol", "ano", "pages", "page", "edição", "edicao", "completo",
]);

function keywordsFrom(text: string, extras: (string | null | undefined)[]): string[] {
  const freq = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[a-záàâãéêíóôõúüç]{4,}/gi) || []) {
    if (STOPWORDS.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map((e) => e[0]);
  return [
    ...new Set([
      ...extras.filter(Boolean).map((s) => String(s).toLowerCase()),
      ...top,
    ]),
  ].slice(0, 10);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export type ReclassifyInput = {
  id: string;
  title?: string;
  description?: string;
  summary?: string;
  keywords?: string[];
  slug?: string;
  editora?: string;
  faculdade?: string;
  vestibular?: string;
  subject?: string;
  materialType?: string;
  year?: number | null;
  difficulty?: string;
  priority?: string;
};

// Patch com nomes de COLUNA do banco (pronto para supabase.update()).
export type ReclassifyPatch = {
  subject?: string;
  faculdade?: string;
  vestibular?: string;
  material_type?: string;
  editora?: string;
  year?: number;
  difficulty?: string;
  priority?: string;
  keywords?: string[];
  slug?: string;
};

export type ReclassifyResult = { patch: ReclassifyPatch; changes: string[] };

export function reclassifyMaterial(m: ReclassifyInput): ReclassifyResult {
  const text = [
    m.title,
    m.description,
    m.summary,
    (m.keywords ?? []).join(" "),
    m.slug,
    m.editora,
    m.faculdade,
    m.vestibular,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const patch: ReclassifyPatch = {};
  const changes: string[] = [];

  const uni = detectUniversity(text);
  if (uni) {
    if (uni.faculdade !== m.faculdade) {
      patch.faculdade = uni.faculdade;
      changes.push("faculdade");
    }
    if (uni.vestibular !== m.vestibular) {
      patch.vestibular = uni.vestibular;
      changes.push("vestibular");
    }
  }

  const subject = detectSubject(text);
  if (subject && subject !== m.subject) {
    patch.subject = subject;
    changes.push("subject");
  }

  const type = detectType(text);
  if (type && type !== m.materialType) {
    patch.material_type = type;
    changes.push("material_type");
  }

  const editora = detectEditora(text);
  if (editora && !m.editora) {
    patch.editora = editora;
    changes.push("editora");
  }

  const year = detectYear(text);
  if (year && year !== m.year) {
    patch.year = year;
    changes.push("year");
  }

  const difficulty = detectDifficulty(text);
  if (difficulty && difficulty !== m.difficulty) {
    patch.difficulty = difficulty;
    changes.push("difficulty");
  }

  const finalFaculdade = patch.faculdade ?? m.faculdade ?? "";
  const finalEditora = patch.editora ?? m.editora ?? "";
  const priority = computePriority(finalFaculdade, finalEditora);
  if (priority !== (m.priority ?? "normal")) {
    patch.priority = priority;
    changes.push("priority");
  }

  if (!m.keywords || m.keywords.length === 0) {
    const kw = keywordsFrom(text, [
      patch.vestibular ?? m.vestibular,
      patch.subject ?? m.subject,
      patch.material_type ?? m.materialType,
      patch.editora ?? m.editora,
    ]);
    if (kw.length > 0) {
      patch.keywords = kw;
      changes.push("keywords");
    }
  }

  if (!m.slug) {
    const vest = patch.vestibular ?? m.vestibular ?? "todos";
    const yr = patch.year ?? m.year ?? "";
    const type2 = patch.material_type ?? m.materialType ?? "material";
    const slug = `${slugify(`${m.title ?? "material"}-${vest}-${yr}-${type2}`)}-${m.id.slice(0, 6)}`;
    patch.slug = slug;
    changes.push("slug");
  }

  return { patch, changes };
}
