import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeDiagnostic, sanitizeAnswers } from "@/lib/diagnostico";
import { saveDiagnostic } from "@/lib/diagnostico-data";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  // Defesa no servidor: só aceitamos opções conhecidas.
  const answers = sanitizeAnswers(body);
  if (!answers) {
    return NextResponse.json(
      { error: "Respostas incompletas ou inválidas." },
      { status: 400 },
    );
  }

  // Score SEMPRE calculado no servidor (cliente não influencia).
  const result = computeDiagnostic(answers);

  // Usuário logado (se houver) — vincula o diagnóstico.
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const id = await saveDiagnostic(answers, result, userId);
  if (!id) {
    return NextResponse.json(
      { error: "Não foi possível salvar o diagnóstico." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id }, { status: 200 });
}
