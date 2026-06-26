import { createClient } from "@/lib/supabase/server";
import { SUBJECTS } from "@/lib/catalog";
import { cleanMaterialTitle } from "@/lib/title";

export type AdminAuthor = {
  id: string;
  username: string | null;
  fullName: string;
  avatarUrl: string | null;
};

export type AdminMaterialStatus = "pending" | "approved" | "rejected";

export type AdminMaterial = {
  id: string;
  title: string;
  description: string;
  summary: string;
  vestibular: string;
  faculdade: string;
  year: number | null;
  subject: string;
  materialType: string;
  difficulty: string;
  priority: string;
  editora: string;
  keywords: string[];
  slug: string;
  status: AdminMaterialStatus;
  uploadKind: "file" | "link";
  fileUrl: string | null;
  externalUrl: string | null;
  storagePath: string | null;
  createdAt: string;
  author: AdminAuthor | null;
};

export type AdminFacets = {
  faculdades: string[];
  vestibulares: string[];
  subjects: string[];
};

export type AdminPost = {
  id: string;
  content: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  author: AdminAuthor | null;
};

type OwnerRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toAuthor(value: OwnerRow | OwnerRow[] | null): AdminAuthor | null {
  const owner = firstRelation(value);
  if (!owner?.id) {
    return null;
  }
  return {
    id: owner.id,
    username: owner.username,
    fullName: owner.full_name || "Estudante AcertaVest",
    avatarUrl: owner.avatar_url,
  };
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    return data?.role === "admin";
  } catch {
    return false;
  }
}

type MaterialRow = {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  vestibular: string | null;
  faculdade: string | null;
  year: number | null;
  subject: string | null;
  material_type: string | null;
  difficulty: string | null;
  priority: string | null;
  editora: string | null;
  keywords: string[] | null;
  slug: string | null;
  status: string | null;
  upload_kind: string | null;
  file_url: string | null;
  external_url: string | null;
  storage_path: string | null;
  created_at: string;
  owner: OwnerRow | OwnerRow[] | null;
};

const ADMIN_MATERIAL_COLS =
  "id,title,description,summary,vestibular,faculdade,year,subject,material_type,difficulty,priority,editora,keywords,slug,status,upload_kind,file_url,external_url,storage_path,created_at,owner:profiles!materials_owner_id_fkey(id,username,full_name,avatar_url)";

function mapMaterial(row: MaterialRow): AdminMaterial {
  return {
    id: row.id,
    title: cleanMaterialTitle(row.title),
    description: row.description ?? "",
    summary: row.summary ?? "",
    vestibular: row.vestibular ?? "Todos",
    faculdade: row.faculdade ?? "Medicina",
    year: row.year,
    subject: row.subject ?? "Interdisciplinar",
    materialType: row.material_type ?? "Material",
    difficulty: row.difficulty ?? "",
    priority: row.priority === "alta" ? "alta" : "normal",
    editora: row.editora ?? "",
    keywords: row.keywords ?? [],
    slug: row.slug ?? "",
    status:
      row.status === "approved" || row.status === "rejected"
        ? row.status
        : "pending",
    uploadKind: row.upload_kind === "link" ? "link" : "file",
    fileUrl: row.file_url,
    externalUrl: row.external_url,
    storagePath: row.storage_path,
    createdAt: row.created_at,
    author: toAuthor(row.owner),
  };
}

export const ADMIN_PAGE_SIZE = 50;

export type AdminCounts = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  posts: number;
  simulados: number;
  tracks: number;
  diagnostics: number;
  essays: number;
};

// Contagens reais (head:true não traz linhas — barato).
export async function getAdminCounts(): Promise<AdminCounts> {
  const empty: AdminCounts = {
    pending: 0, approved: 0, rejected: 0, total: 0, posts: 0, simulados: 0, tracks: 0, diagnostics: 0, essays: 0,
  };
  try {
    const supabase = await createClient();
    const headCount = async (table: string, status?: string) => {
      let query = supabase.from(table).select("*", { count: "exact", head: true });
      if (status) query = query.eq("status", status);
      const { count } = await query;
      return count ?? 0;
    };
    const [pending, approved, rejected, total, posts, simulados, tracks, diagnostics, essays] = await Promise.all([
      headCount("materials", "pending"),
      headCount("materials", "approved"),
      headCount("materials", "rejected"),
      headCount("materials"),
      headCount("posts"),
      headCount("simulados"),
      headCount("study_tracks"),
      headCount("approval_diagnostics"),
      headCount("essay_submissions"),
    ]);
    return { pending, approved, rejected, total, posts, simulados, tracks, diagnostics, essays };
  } catch (countError) {
    console.error("[admin] falha nas contagens:", countError);
    return empty;
  }
}

// Remove caracteres que quebrariam a sintaxe do .or()/ilike do PostgREST.
function sanitizeTerm(term?: string) {
  return (term ?? "").replace(/[,()%*]/g, " ").trim();
}

// Página de materiais (server-side). status "pending" filtra; "all" traz todos.
// `search` busca em title/description/summary/subject/faculdade/vestibular/
// editora/material_type (ilike) e em year (igualdade, quando for um ano).
export async function getAdminMaterials(
  status: "pending" | "all" = "pending",
  page = 1,
  pageSize = ADMIN_PAGE_SIZE,
  search?: string,
): Promise<{ materials: AdminMaterial[]; total: number }> {
  try {
    const supabase = await createClient();
    const from = Math.max(0, (page - 1) * pageSize);
    let query = supabase
      .from("materials")
      .select(ADMIN_MATERIAL_COLS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (status === "pending") query = query.eq("status", "pending");

    const term = sanitizeTerm(search);
    if (term) {
      const ors = [
        `title.ilike.%${term}%`,
        `description.ilike.%${term}%`,
        `summary.ilike.%${term}%`,
        `subject.ilike.%${term}%`,
        `faculdade.ilike.%${term}%`,
        `vestibular.ilike.%${term}%`,
        `editora.ilike.%${term}%`,
        `material_type.ilike.%${term}%`,
      ];
      if (/^\d{4}$/.test(term)) ors.push(`year.eq.${term}`);
      query = query.or(ors.join(","));
    }

    const { data, count, error } = await query;
    if (error) {
      console.error("[admin] falha ao carregar materiais:", error);
      return { materials: [], total: 0 };
    }
    return {
      materials: ((data ?? []) as MaterialRow[]).map(mapMaterial),
      total: count ?? 0,
    };
  } catch (loadError) {
    console.error("[admin] erro inesperado em materiais:", loadError);
    return { materials: [], total: 0 };
  }
}

// Opções dos selects com busca da edição (carregadas do banco).
export async function getAdminFacets(): Promise<AdminFacets> {
  const empty: AdminFacets = { faculdades: [], vestibulares: [], subjects: [] };
  try {
    const supabase = await createClient();
    const [facsRes, vestsRes, subsRes] = await Promise.all([
      supabase.from("faculties").select("name").order("name"),
      supabase.from("vestibulares").select("name").order("name"),
      supabase.from("materials").select("subject").not("subject", "is", null).limit(1000),
    ]);

    const uniq = (values: string[]) =>
      Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      );

    return {
      faculdades: uniq(((facsRes.data ?? []) as { name: string }[]).map((r) => r.name)),
      vestibulares: uniq(((vestsRes.data ?? []) as { name: string }[]).map((r) => r.name)),
      subjects: uniq([
        ...SUBJECTS.map((s) => s.filter),
        ...((subsRes.data ?? []) as { subject: string | null }[]).map(
          (r) => r.subject ?? "",
        ),
      ]),
    };
  } catch (facetError) {
    console.error("[admin] facets falharam:", facetError);
    return empty;
  }
}

type PostRow = {
  id: string;
  content: string;
  created_at: string;
  author: OwnerRow | OwnerRow[] | null;
  comments: { count: number }[] | null;
};

export type AdminSimulado = {
  id: string;
  title: string;
  vestibular: string;
  faculty: string;
  questionCount: number;
  durationMinutes: number;
  rules: string;
  status: "draft" | "published";
};

export async function getAdminSimulados(): Promise<AdminSimulado[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("simulados")
      .select("id,title,vestibular,faculty,question_count,duration_minutes,rules,status")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[admin] simulados falharam:", error);
      return [];
    }
    return (
      (data ?? []) as Array<{
        id: string;
        title: string;
        vestibular: string | null;
        faculty: string | null;
        question_count: number | null;
        duration_minutes: number | null;
        rules: string | null;
        status: string | null;
      }>
    ).map((row) => ({
      id: row.id,
      title: row.title,
      vestibular: row.vestibular ?? "Geral",
      faculty: row.faculty ?? "Medicina",
      questionCount: row.question_count ?? 0,
      durationMinutes: row.duration_minutes ?? 60,
      rules: row.rules ?? "",
      status: row.status === "draft" ? "draft" : "published",
    }));
  } catch (simError) {
    console.error("[admin] simulados exceção:", simError);
    return [];
  }
}

export async function getRecentPosts(): Promise<AdminPost[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id,content,created_at,author:profiles!posts_author_id_fkey(id,username,full_name,avatar_url),comments(count)",
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[admin] falha ao carregar posts:", error);
      return [];
    }

    const rows = (data ?? []) as PostRow[];
    const postIds = rows.map((row) => row.id);

    // Curtidas são polimórficas (sem FK), então contamos à parte.
    const likesByPost: Record<string, number> = {};
    if (postIds.length > 0) {
      const { data: likesData } = await supabase
        .from("likes")
        .select("target_id")
        .eq("target_type", "post")
        .in("target_id", postIds);

      for (const like of (likesData ?? []) as { target_id: string }[]) {
        likesByPost[like.target_id] = (likesByPost[like.target_id] ?? 0) + 1;
      }
    }

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      likesCount: likesByPost[row.id] ?? 0,
      commentsCount: row.comments?.[0]?.count ?? 0,
      author: toAuthor(row.author),
    }));
  } catch (loadError) {
    console.error("[admin] erro inesperado em posts:", loadError);
    return [];
  }
}
