import { NextResponse, type NextRequest } from "next/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { getDiagnosticsForExport } from "@/lib/diagnostico-data";

export const dynamic = "force-dynamic";

// Separador ";" (Excel pt-BR). UTF-8 com BOM para acentos abrirem certo no Excel.
const SEP = ";";

function cell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (s.includes(SEP) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  } catch {
    return iso;
  }
}

const HEADERS = [
  "Data do diagnóstico",
  "Email",
  "Usuário",
  "Universidade alvo",
  "Vestibular alvo",
  "Curso",
  "Horas de estudo",
  "Fase do aluno",
  "Média em simulados",
  "Matérias fortes",
  "Matérias fracas",
  "Simulados por mês",
  "Maior dificuldade",
  "Prazo do vestibular",
  "Score de preparação",
  "Chance estimada",
  "Perfil do aluno",
  "Trilha recomendada",
  "Plano recomendado",
];

export async function GET(request: NextRequest) {
  // Segurança: só admin exporta.
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json(
      { error: "Acesso restrito a administradores." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const rows = await getDiagnosticsForExport({
    university: url.searchParams.get("uni") ?? "",
    plan: url.searchParams.get("plan") ?? "",
    period: url.searchParams.get("period") ?? "",
  });

  const lines: string[] = [HEADERS.map(cell).join(SEP)];
  for (const r of rows) {
    lines.push(
      [
        fmtDate(r.createdAt),
        r.email ?? "",
        r.userId ? "logado" : "anônimo",
        r.targetUniversity ?? "",
        r.targetVestibular ?? "",
        r.targetCourse ?? "",
        r.studyHours ?? "",
        r.studentPhase ?? "",
        r.mockAverage ?? "",
        r.strongSubjects.join(" | "),
        r.weakSubjects.join(" | "),
        r.mocksPerMonth ?? "",
        r.mainDifficulty ?? "",
        r.examTimeline ?? "",
        r.preparationScore ?? "",
        r.approvalChance ?? "",
        r.studentProfile ?? "",
        r.recommendedTrackSlug ?? "",
        r.recommendedPlan ?? "",
      ]
        .map(cell)
        .join(SEP),
    );
  }

  const BOM = String.fromCharCode(0xfeff);
  const csv = BOM + lines.join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  const filename = `diagnosticos-acertavest-${date}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
