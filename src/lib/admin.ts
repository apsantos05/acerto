import { createClient } from "@/lib/supabase/server";

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
  vestibular: string;
  faculdade: string;
  year: number | null;
  subject: string;
  materialType: string;
  status: AdminMaterialStatus;
  fileUrl: string | null;
  externalUrl: string | null;
  storagePath: string | null;
  createdAt: string;
  author: AdminAuthor | null;
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
    fullName: owner.full_name || "Estudante Acerte",
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
  vestibular: string | null;
  faculdade: string | null;
  year: number | null;
  subject: string | null;
  material_type: string | null;
  status: string | null;
  file_url: string | null;
  external_url: string | null;
  storage_path: string | null;
  created_at: string;
  owner: OwnerRow | OwnerRow[] | null;
};

export async function getAdminMaterials(): Promise<AdminMaterial[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("materials")
      .select(
        "id,title,description,vestibular,faculdade,year,subject,material_type,status,file_url,external_url,storage_path,created_at,owner:profiles!materials_owner_id_fkey(id,username,full_name,avatar_url)",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[admin] falha ao carregar materiais:", error);
      return [];
    }

    return ((data ?? []) as MaterialRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      vestibular: row.vestibular ?? "Todos",
      faculdade: row.faculdade ?? "Medicina",
      year: row.year,
      subject: row.subject ?? "Interdisciplinar",
      materialType: row.material_type ?? "Material",
      status:
        row.status === "approved" || row.status === "rejected"
          ? row.status
          : "pending",
      fileUrl: row.file_url,
      externalUrl: row.external_url,
      storagePath: row.storage_path,
      createdAt: row.created_at,
      author: toAuthor(row.owner),
    }));
  } catch (loadError) {
    console.error("[admin] erro inesperado em materiais:", loadError);
    return [];
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
  status: "draft" | "published";
};

export async function getAdminSimulados(): Promise<AdminSimulado[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("simulados")
      .select("id,title,vestibular,faculty,question_count,status")
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
        status: string | null;
      }>
    ).map((row) => ({
      id: row.id,
      title: row.title,
      vestibular: row.vestibular ?? "Geral",
      faculty: row.faculty ?? "Medicina",
      questionCount: row.question_count ?? 0,
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
