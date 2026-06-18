/**
 * Extrai uma mensagem útil de erros do Supabase/PostgREST.
 *
 * Erros do supabase-js (PostgrestError) são objetos simples com
 * { message, details, hint, code } e NÃO são instâncias de Error — por isso
 * um `error instanceof Error ? error.message : generico` acaba mostrando só a
 * mensagem genérica. Esta função cobre os dois casos.
 */
export function getSupabaseErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const e = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    const parts = [e.message, e.details, e.hint]
      .map((part) => (part ?? "").trim())
      .filter(Boolean);

    if (parts.length > 0) {
      return e.code ? `${parts.join(" · ")} (${e.code})` : parts.join(" · ");
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
