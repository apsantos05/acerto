import { NextResponse, type NextRequest } from "next/server";
import { getViewer, canSubmitEssay } from "@/lib/gating";
import { correctEssay, isExamType } from "@/lib/essay-ai";
import {
  applyCorrection,
  createProcessingSubmission,
  markFailed,
} from "@/lib/redacoes-data";

export const dynamic = "force-dynamic";

const MAX_CHARS = 8000;
const MIN_WORDS = 50;

export async function POST(request: NextRequest) {
  let body: { examType?: unknown; theme?: unknown; essay?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const examType = typeof body.examType === "string" ? body.examType : "";
  const theme = typeof body.theme === "string" ? body.theme.trim().slice(0, 300) : "";
  const essay = typeof body.essay === "string" ? body.essay.trim() : "";

  if (!isExamType(examType)) {
    return NextResponse.json({ error: "Tipo de prova inválido." }, { status: 400 });
  }
  if (!essay) {
    return NextResponse.json({ error: "A redação está vazia." }, { status: 400 });
  }
  if (essay.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Redação muito longa (máx. ${MAX_CHARS} caracteres).` },
      { status: 400 },
    );
  }
  const wordCount = essay.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_WORDS) {
    return NextResponse.json(
      { error: `Escreva ao menos ${MIN_WORDS} palavras para uma correção útil.` },
      { status: 400 },
    );
  }

  const viewer = await getViewer();
  if (!viewer.userId) {
    return NextResponse.json({ error: "É preciso estar logado." }, { status: 401 });
  }

  // Limite por plano — validado no SERVIDOR.
  const quota = await canSubmitEssay(viewer);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Limite de correções do seu plano atingido.", quota },
      { status: 403 },
    );
  }

  const id = await createProcessingSubmission({
    userId: viewer.userId,
    examType,
    theme,
    essay,
    wordCount,
  });
  if (!id) {
    return NextResponse.json({ error: "Não foi possível salvar a redação." }, { status: 500 });
  }

  // Chama a IA; em falha marca 'failed' (a página de resultado mostra mensagem amigável).
  try {
    const correction = await correctEssay({ examType, theme, essay });
    await applyCorrection(id, correction);
  } catch (aiError) {
    console.error("[redacoes] IA falhou:", aiError);
    await markFailed(id);
  }

  return NextResponse.json({ id }, { status: 200 });
}
