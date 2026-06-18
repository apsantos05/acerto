import { createClient } from "@/lib/supabase/server";

export type PendingMaterialAuthor = {
  id: string;
  username: string | null;
  fullName: string;
  avatarUrl: string | null;
};

export type PendingMaterial = {
  id: string;
  title: string;
  description: string;
  vestibular: string;
  faculdade: string;
  year: number | null;
  subject: string;
  materialType: string;
  fileUrl: string | null;
  externalUrl: string | null;
  createdAt: string;
  author: PendingMaterialAuthor | null;
};

type OwnerRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type PendingRow = {
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
  created_at: string;
  owner: OwnerRow | OwnerRow[] | null;
};

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
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

export async function getPendingMaterials(): Promise<PendingMaterial[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("materials")
      .select(
        "id,title,description,vestibular,faculdade,year,subject,material_type,file_url,external_url,created_at,owner:profiles!materials_owner_id_fkey(id,username,full_name,avatar_url)",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin] falha ao carregar materiais pendentes:", error);
      return [];
    }

    return ((data ?? []) as PendingRow[]).map((row) => {
      const owner = firstRelation(row.owner);

      return {
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        vestibular: row.vestibular ?? "Todos",
        faculdade: row.faculdade ?? "Medicina",
        year: row.year,
        subject: row.subject ?? "Interdisciplinar",
        materialType: row.material_type ?? "Material",
        fileUrl: row.file_url,
        externalUrl: row.external_url,
        createdAt: row.created_at,
        author: owner?.id
          ? {
              id: owner.id,
              username: owner.username,
              fullName: owner.full_name || "Estudante Acerte",
              avatarUrl: owner.avatar_url,
            }
          : null,
      };
    });
  } catch (loadError) {
    console.error("[admin] erro inesperado em materiais pendentes:", loadError);
    return [];
  }
}
