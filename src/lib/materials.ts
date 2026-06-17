import { createClient } from "@/lib/supabase/server";
import {
  materialTypes,
  type MaterialStatus,
  type MaterialType,
} from "@/lib/material-options";

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
  viewsCount: number;
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
    createdAt: "2026-04-03T12:00:00.000Z",
    isMock: true,
  },
];

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
  views_count: number | null;
  created_at: string;
};

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
    viewsCount: row.views_count ?? 0,
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

async function getSupabaseMaterials() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select(
      "id,title,description,vestibular,faculdade,year,subject,material_type,file_url,external_url,storage_path,upload_kind,tags,status,rating,views_count,created_at",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => normalizeMaterial(row as MaterialRow));
}

export async function getLibraryData(filters: LibraryFilters) {
  try {
    const materials = await getSupabaseMaterials();
    const sourceMaterials = materials.length > 0 ? materials : mockLibraryMaterials;

    return {
      materials: filterMaterials(sourceMaterials, filters),
      options: getLibraryFilterOptions(sourceMaterials),
      isMock: materials.length === 0,
    };
  } catch {
    return {
      materials: filterMaterials(mockLibraryMaterials, filters),
      options: getLibraryFilterOptions(mockLibraryMaterials),
      isMock: true,
    };
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
        "id,title,description,vestibular,faculdade,year,subject,material_type,file_url,external_url,storage_path,upload_kind,tags,status,rating,views_count,created_at",
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
        "id,title,description,vestibular,faculdade,year,subject,material_type,file_url,external_url,storage_path,upload_kind,tags,status,rating,views_count,created_at",
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
  } catch {
    return {
      materials: [],
      error:
        "Não foi possível carregar seus materiais. Confira a configuração do Supabase.",
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
