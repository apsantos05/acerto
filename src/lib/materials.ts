import { createClient } from "@/lib/supabase/server";
import {
  materialTypes,
  type MaterialStatus,
  type MaterialType,
} from "@/lib/material-options";

export type MaterialAuthor = {
  id: string;
  username: string | null;
  fullName: string;
  avatarUrl: string | null;
};

export type LibraryMaterial = {
  id: string;
  title: string;
  description: string;
  vestibular: string;
  faculdade: string;
  year: number;
  subject: string;
  materialType: MaterialType;
  fileUrl: string | null;
  externalUrl: string | null;
  storagePath: string | null;
  uploadKind: "file" | "link";
  tags: string[];
  status: MaterialStatus;
  rating: number;
  ratingsCount: number;
  viewsCount: number;
  author: MaterialAuthor | null;
  createdAt: string;
  isMock?: boolean;
};

export type LibraryFilters = {
  search?: string;
  vestibular?: string;
  faculdade?: string;
  year?: string;
  subject?: string;
  materialType?: string;
};

export type LibraryFilterOptions = {
  vestibulares: string[];
  faculdades: string[];
  years: string[];
  subjects: string[];
  materialTypes: string[];
};

const mockLibraryMaterials: LibraryMaterial[] = [
  {
    id: "mock-fuvest-2025-prova",
    title: "Prova Fuvest 2025 - 1a fase",
    description:
      "Caderno completo com questões objetivas comentadas para revisão de Medicina.",
    vestibular: "Fuvest",
    faculdade: "USP",
    year: 2025,
    subject: "Interdisciplinar",
    materialType: "Prova",
    fileUrl: null,
    externalUrl: null,
    storagePath: null,
    uploadKind: "file",
    tags: ["fuvest", "primeira fase", "medicina"],
    status: "approved",
    rating: 4.9,
    viewsCount: 1280,
    ratingsCount: 0,
    author: null,
    createdAt: "2026-05-15T12:00:00.000Z",
    isMock: true,
  },
  {
    id: "mock-enem-2024-gabarito",
    title: "Gabarito ENEM 2024 - Ciências da Natureza",
    description:
      "Gabarito organizado por habilidade com marcações para temas recorrentes.",
    vestibular: "ENEM",
    faculdade: "Sisu Medicina",
    year: 2024,
    subject: "Ciências da Natureza",
    materialType: "Gabarito",
    fileUrl: null,
    externalUrl: null,
    storagePath: null,
    uploadKind: "file",
    tags: ["enem", "gabarito", "natureza"],
    status: "approved",
    rating: 4.8,
    viewsCount: 934,
    ratingsCount: 0,
    author: null,
    createdAt: "2026-05-08T12:00:00.000Z",
    isMock: true,
  },
  {
    id: "mock-unicamp-2026-simulado",
    title: "Simulado Unicamp Medicina - Semana 04",
    description:
      "Simulado autoral com 72 questões no estilo Unicamp e grade de correção.",
    vestibular: "Unicamp",
    faculdade: "Unicamp",
    year: 2026,
    subject: "Interdisciplinar",
    materialType: "Simulado",
    fileUrl: null,
    externalUrl: null,
    storagePath: null,
    uploadKind: "file",
    tags: ["unicamp", "simulado", "medicina"],
    status: "approved",
    rating: 4.7,
    viewsCount: 721,
    ratingsCount: 0,
    author: null,
    createdAt: "2026-05-01T12:00:00.000Z",
    isMock: true,
  },
  {
    id: "mock-biologia-resumo",
    title: "Resumo de Fisiologia Humana",
    description:
      "Resumo visual sobre sistemas digestório, respiratório e circulatório.",
    vestibular: "Todos",
    faculdade: "Medicina",
    year: 2026,
    subject: "Biologia",
    materialType: "Resumo",
    fileUrl: null,
    externalUrl: null,
    storagePath: null,
    uploadKind: "file",
    tags: ["biologia", "fisiologia", "resumo"],
    status: "approved",
    rating: 4.9,
    viewsCount: 1532,
    ratingsCount: 0,
    author: null,
    createdAt: "2026-04-20T12:00:00.000Z",
    isMock: true,
  },
  {
    id: "mock-quimica-lista",
    title: "Lista de exercícios - Estequiometria",
    description:
      "Lista progressiva com exercícios de vestibulares recentes e respostas finais.",
    vestibular: "ENEM",
    faculdade: "Sisu Medicina",
    year: 2026,
    subject: "Química",
    materialType: "Lista de exercícios",
    fileUrl: null,
    externalUrl: null,
    storagePath: null,
    uploadKind: "file",
    tags: ["química", "estequiometria", "exercícios"],
    status: "approved",
    rating: 4.6,
    viewsCount: 812,
    ratingsCount: 0,
    author: null,
    createdAt: "2026-04-12T12:00:00.000Z",
    isMock: true,
  },
  {
    id: "mock-redacao-mapa",
    title: "Mapa mental - Repertórios de Redação",
    description:
      "Mapa mental com repertórios socioculturais separados por eixo temático.",
    vestibular: "ENEM",
    faculdade: "Sisu Medicina",
    year: 2026,
    subject: "Redação",
    materialType: "Mapa mental",
    fileUrl: null,
    externalUrl: null,
    storagePath: null,
    uploadKind: "file",
    tags: ["redação", "repertório", "mapa mental"],
    status: "approved",
    rating: 4.8,
    viewsCount: 1044,
    ratingsCount: 0,
    author: null,
    createdAt: "2026-04-03T12:00:00.000Z",
    isMock: true,
  },
];

type OwnerRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type MaterialRow = {
  id: string;
  title: string;
  description: string | null;
  vestibular: string | null;
  faculdade: string | null;
  year: number | null;
  subject: string | null;
  material_type: string | null;
  file_url: string | null;
  external_url: string | null;
  storage_path: string | null;
  upload_kind: string | null;
  tags: string[] | null;
  status: string | null;
  rating: number | string | null;
  ratings_count: number | null;
  views_count: number | null;
  owner: OwnerRow | OwnerRow[] | null;
  created_at: string;
};

const materialSelect =
  "id,title,description,vestibular,faculdade,year,subject,material_type,file_url,external_url,storage_path,upload_kind,tags,status,rating,ratings_count,views_count,created_at,owner:profiles!materials_owner_id_fkey(id,username,full_name,avatar_url)";

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function normalizeOwner(value: OwnerRow | OwnerRow[] | null): MaterialAuthor | null {
  const owner = firstRelation(value);

  if (!owner?.id) {
    return null;
  }

  return {
    id: owner.id,
    username: owner.username,
    fullName: owner.full_name || "Estudante Acerte",
    avatarUrl: owner.avatar_url,
  };
}

function normalizeMaterial(row: MaterialRow): LibraryMaterial {
  const type = materialTypes.includes(row.material_type as MaterialType)
    ? (row.material_type as MaterialType)
    : "Resumo";

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "Material compartilhado pela comunidade.",
    vestibular: row.vestibular ?? "Todos",
    faculdade: row.faculdade ?? "Medicina",
    year: row.year ?? new Date(row.created_at).getFullYear(),
    subject: row.subject ?? "Interdisciplinar",
    materialType: type,
    fileUrl: row.file_url,
    externalUrl: row.external_url,
    storagePath: row.storage_path,
    uploadKind: row.upload_kind === "link" ? "link" : "file",
    tags: row.tags ?? [],
    status:
      row.status === "approved" || row.status === "rejected"
        ? row.status
        : "pending",
    rating: Number(row.rating ?? 0),
    ratingsCount: row.ratings_count ?? 0,
    viewsCount: row.views_count ?? 0,
    author: normalizeOwner(row.owner),
    createdAt: row.created_at,
  };
}

function uniqueSorted(values: Array<number | string>) {
  return Array.from(new Set(values.map(String).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true }),
  );
}

export function getLibraryFilterOptions(
  materials: LibraryMaterial[],
): LibraryFilterOptions {
  return {
    vestibulares: uniqueSorted(materials.map((material) => material.vestibular)),
    faculdades: uniqueSorted(materials.map((material) => material.faculdade)),
    years: uniqueSorted(materials.map((material) => material.year)).reverse(),
    subjects: uniqueSorted(materials.map((material) => material.subject)),
    materialTypes: [...materialTypes],
  };
}

export function filterMaterials(
  materials: LibraryMaterial[],
  filters: LibraryFilters,
) {
  const search = filters.search?.trim().toLowerCase();

  return materials.filter((material) => {
    const matchesSearch =
      !search ||
      [
        material.title,
        material.description,
        material.vestibular,
        material.faculdade,
        material.subject,
        material.materialType,
        material.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);

    return (
      matchesSearch &&
      (!filters.vestibular || material.vestibular === filters.vestibular) &&
      (!filters.faculdade || material.faculdade === filters.faculdade) &&
      (!filters.year || String(material.year) === filters.year) &&
      (!filters.subject || material.subject === filters.subject) &&
      (!filters.materialType || material.materialType === filters.materialType)
    );
  });
}

export const LIBRARY_PAGE_SIZE = 24;

export type LibraryPage = {
  materials: LibraryMaterial[];
  options: LibraryFilterOptions;
  isMock: boolean;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Remove caracteres que quebrariam a sintaxe do .or()/ilike do PostgREST.
function sanitizeTerm(term?: string) {
  return (term ?? "").replace(/[,()%*]/g, " ").trim();
}

// Consulta paginada e filtrada DIRETO no banco — escala para milhares de
// materiais (nada de baixar tudo e filtrar no cliente).
export async function queryMaterials(
  filters: LibraryFilters,
  page = 1,
  pageSize = LIBRARY_PAGE_SIZE,
): Promise<{ materials: LibraryMaterial[]; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("materials")
    .select(materialSelect, { count: "exact" })
    .eq("status", "approved");

  if (filters.vestibular) query = query.eq("vestibular", filters.vestibular);
  if (filters.faculdade) query = query.eq("faculdade", filters.faculdade);
  if (filters.subject) query = query.eq("subject", filters.subject);
  if (filters.materialType) query = query.eq("material_type", filters.materialType);
  if (filters.year) query = query.eq("year", Number(filters.year));

  const term = sanitizeTerm(filters.search);
  if (term) {
    query = query.or(
      [
        `title.ilike.%${term}%`,
        `description.ilike.%${term}%`,
        `subject.ilike.%${term}%`,
        `vestibular.ilike.%${term}%`,
        `faculdade.ilike.%${term}%`,
      ].join(","),
    );
  }

  const from = Math.max(0, (page - 1) * pageSize);
  query = query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    materials: (data ?? []).map((row) => normalizeMaterial(row as MaterialRow)),
    total: count ?? 0,
  };
}

// Opções de filtro (facetas) a partir de uma amostra leve dos aprovados.
async function getLibraryFacets(): Promise<{
  options: LibraryFilterOptions;
  total: number;
}> {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("materials")
    .select("subject,vestibular,faculdade,year", { count: "exact" })
    .eq("status", "approved")
    .limit(2000);

  const rows = (data ?? []) as Array<{
    subject: string | null;
    vestibular: string | null;
    faculdade: string | null;
    year: number | null;
  }>;

  return {
    total: count ?? 0,
    options: {
      vestibulares: uniqueSorted(
        rows.map((r) => r.vestibular).filter(Boolean) as string[],
      ),
      faculdades: uniqueSorted(
        rows.map((r) => r.faculdade).filter(Boolean) as string[],
      ),
      years: uniqueSorted(
        rows.map((r) => r.year).filter((y) => y != null) as number[],
      ).reverse(),
      subjects: uniqueSorted(
        rows.map((r) => r.subject).filter(Boolean) as string[],
      ),
      materialTypes: [...materialTypes],
    },
  };
}

function mockPage(filters: LibraryFilters): LibraryPage {
  const materials = filterMaterials(mockLibraryMaterials, filters);
  return {
    materials,
    options: getLibraryFilterOptions(mockLibraryMaterials),
    isMock: true,
    total: materials.length,
    page: 1,
    pageSize: Math.max(1, materials.length),
    totalPages: 1,
  };
}

export async function getLibraryData(
  filters: LibraryFilters,
  page = 1,
): Promise<LibraryPage> {
  try {
    const { options, total: approvedTotal } = await getLibraryFacets();

    // Banco vazio (dev): mantém o fallback mock para a página não ficar nua.
    if (approvedTotal === 0) {
      return mockPage(filters);
    }

    const { materials, total } = await queryMaterials(filters, page);
    return {
      materials,
      options,
      isMock: false,
      total,
      page,
      pageSize: LIBRARY_PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / LIBRARY_PAGE_SIZE)),
    };
  } catch {
    return mockPage(filters);
  }
}

export async function getMaterialById(id: string) {
  if (id.startsWith("mock-")) {
    return mockLibraryMaterials.find((material) => material.id === id) ?? null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("materials")
      .select(
        materialSelect,
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      throw error ?? new Error("Material não encontrado.");
    }

    return normalizeMaterial(data as MaterialRow);
  } catch {
    return mockLibraryMaterials.find((material) => material.id === id) ?? null;
  }
}

export async function getMyMaterials() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        materials: [],
        error: "Entre para ver seus materiais enviados.",
      };
    }

    const { data, error } = await supabase
      .from("materials")
      .select(
        materialSelect,
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      materials: (data ?? []).map((row) => normalizeMaterial(row as MaterialRow)),
      error: null,
    };
  } catch (loadError) {
    // Loga a causa real (ex.: coluna ausente) para diagnóstico no servidor,
    // mas mostra estado vazio normal ao usuário em vez de uma mensagem falsa.
    console.error("[meus-materiais] falha ao carregar materiais:", loadError);
    return {
      materials: [],
      error: null,
    };
  }
}

export async function incrementMaterialViews(id: string) {
  if (id.startsWith("mock-")) {
    return;
  }

  try {
    const supabase = await createClient();
    await supabase.rpc("increment_material_view", {
      material_id: id,
    });
  } catch {
    // View counting is best-effort and should not block the detail page.
  }
}
