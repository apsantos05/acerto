import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  materialsAvailable: number;
  examsAndSimulados: number;
  studentsRegistered: number;
  materialsApproved: number;
};

export type DashboardRecentMaterial = {
  id: string;
  title: string;
  materialType: string;
  subject: string;
};

export type DashboardData = {
  stats: DashboardStats;
  recentMaterials: DashboardRecentMaterial[];
};

async function safeCount(
  label: string,
  builder: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number> {
  try {
    const { count, error } = await builder;
    if (error) {
      console.error(`[dashboard] consulta "${label}" falhou:`, error);
      return 0;
    }
    return count ?? 0;
  } catch (queryError) {
    console.error(`[dashboard] consulta "${label}" lançou exceção:`, queryError);
    return 0;
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  // 1 e 4 usam a mesma consulta (materiais aprovados) — calculada uma vez.
  const [materialsApproved, examsAndSimulados, studentsRegistered] =
    await Promise.all([
      safeCount(
        "materiais aprovados",
        supabase
          .from("materials")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved"),
      ),
      safeCount(
        "provas e simulados",
        supabase
          .from("materials")
          .select("*", { count: "exact", head: true })
          .in("material_type", ["Prova", "Simulado"])
          .eq("status", "approved"),
      ),
      safeCount(
        "estudantes cadastrados",
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ),
    ]);

  let recentMaterials: DashboardRecentMaterial[] = [];
  try {
    const { data, error } = await supabase
      .from("materials")
      .select("id,title,material_type,subject")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) {
      console.error("[dashboard] materiais recentes falhou:", error);
    } else {
      recentMaterials = (
        (data ?? []) as Array<{
          id: string;
          title: string;
          material_type: string | null;
          subject: string | null;
        }>
      ).map((row) => ({
        id: row.id,
        title: row.title,
        materialType: row.material_type ?? "Material",
        subject: row.subject ?? "Geral",
      }));
    }
  } catch (recentError) {
    console.error("[dashboard] materiais recentes lançou exceção:", recentError);
  }

  return {
    stats: {
      materialsAvailable: materialsApproved,
      examsAndSimulados,
      studentsRegistered,
      materialsApproved,
    },
    recentMaterials,
  };
}
