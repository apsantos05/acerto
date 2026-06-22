import { unstable_cache } from "next/cache";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { cleanMaterialTitle } from "@/lib/title";

export const HOME_MEDICINA_STATS_REVALIDATE_SECONDS = 300;

export type HomeMedicinaMetric = {
  label: string;
  value: string;
  rawValue: number;
};

export type HomeMedicinaMaterial = {
  id: string;
  title: string;
  subject: string;
  materialType: string;
};

export type HomeMedicinaStats = {
  materialsApproved: number;
  simuladosPublished: number;
  studentsRegistered: number;
  metrics: HomeMedicinaMetric[];
  recentMaterials: HomeMedicinaMaterial[];
};

type CountResult = {
  count: number | null;
  error: unknown;
};

const emptyStats: HomeMedicinaStats = {
  materialsApproved: 0,
  simuladosPublished: 0,
  studentsRegistered: 0,
  metrics: [
    { label: "materiais aprovados", value: "0", rawValue: 0 },
    { label: "simulados disponíveis", value: "0", rawValue: 0 },
    { label: "estudantes cadastrados", value: "0", rawValue: 0 },
  ],
  recentMaterials: [],
};

function withMetrics(
  values: Pick<
    HomeMedicinaStats,
    "materialsApproved" | "simuladosPublished" | "studentsRegistered"
  >,
  recentMaterials: HomeMedicinaMaterial[],
): HomeMedicinaStats {
  return {
    ...values,
    metrics: [
      {
        label: "materiais aprovados",
        value: formatHomeStatNumber(values.materialsApproved),
        rawValue: values.materialsApproved,
      },
      {
        label: "simulados disponíveis",
        value: formatHomeStatNumber(values.simuladosPublished),
        rawValue: values.simuladosPublished,
      },
      {
        label: "estudantes cadastrados",
        value: formatHomeStatNumber(values.studentsRegistered),
        rawValue: values.studentsRegistered,
      },
    ],
    recentMaterials,
  };
}

async function safeCount(
  label: string,
  builder: PromiseLike<CountResult>,
): Promise<{ count: number; ok: boolean }> {
  try {
    const { count, error } = await builder;

    if (error) {
      console.error(`[home] consulta "${label}" falhou:`, error);
      return { count: 0, ok: false };
    }

    return { count: count ?? 0, ok: true };
  } catch (queryError) {
    console.error(`[home] consulta "${label}" lançou exceção:`, queryError);
    return { count: 0, ok: false };
  }
}

async function countStudents(
  supabase: SupabaseClient,
) {
  const withoutAdmins = await safeCount(
    "estudantes cadastrados sem admins",
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .or("role.is.null,role.neq.admin"),
  );

  if (withoutAdmins.ok) {
    return withoutAdmins.count;
  }

  const allProfiles = await safeCount(
    "estudantes cadastrados",
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  );

  return allProfiles.count;
}

async function getRecentApprovedMaterials(
  supabase: SupabaseClient,
) {
  try {
    const { data, error } = await supabase
      .from("materials")
      .select("id,title,subject,material_type")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("[home] materiais recentes falharam:", error);
      return [];
    }

    return (
      (data ?? []) as Array<{
        id: string;
        title: string | null;
        subject: string | null;
        material_type: string | null;
      }>
    ).map((material) => ({
      id: material.id,
      title: cleanMaterialTitle(material.title ?? "Material aprovado"),
      subject: material.subject ?? "Geral",
      materialType: material.material_type ?? "Material",
    }));
  } catch (materialsError) {
    console.error("[home] materiais recentes lançaram exceção:", materialsError);
    return [];
  }
}

export function formatHomeStatNumber(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  if (value >= 10000) {
    return `${new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: 1,
    }).format(value / 1000)}k`;
  }

  return new Intl.NumberFormat("pt-BR").format(value);
}

export const getHomeMedicinaStats = unstable_cache(
  async (): Promise<HomeMedicinaStats> => {
    try {
      const { supabaseUrl, supabaseKey } = getSupabaseConfig();
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      });

      const [materialsApproved, simuladosPublished, studentsRegistered] =
        await Promise.all([
          safeCount(
            "materiais aprovados",
            supabase
              .from("materials")
              .select("id", { count: "exact", head: true })
              .eq("status", "approved"),
          ).then((result) => result.count),
          safeCount(
            "simulados publicados",
            supabase
              .from("simulados")
              .select("id", { count: "exact", head: true })
              .eq("status", "published"),
          ).then((result) => result.count),
          countStudents(supabase),
        ]);
      const recentMaterials = await getRecentApprovedMaterials(supabase);

      return withMetrics(
        {
          materialsApproved,
          simuladosPublished,
          studentsRegistered,
        },
        recentMaterials,
      );
    } catch (statsError) {
      console.error("[home] não foi possível carregar estatísticas:", statsError);
      return emptyStats;
    }
  },
  ["home-medicina-2027-stats-v1"],
  {
    revalidate: HOME_MEDICINA_STATS_REVALIDATE_SECONDS,
    tags: ["home-medicina-2027-stats"],
  },
);
