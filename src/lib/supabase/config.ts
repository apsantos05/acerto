// Valores de exemplo que ainda aparecem quando o .env.local não foi preenchido.
const PLACEHOLDER_PATTERNS = [
  /seu-project/i,
  /your-project/i,
  /cole-a/i,
  /cole aqui/i,
  /sua-chave/i,
  /your-anon/i,
  /your-publishable/i,
  /example\.supabase/i,
];

function looksLikePlaceholder(value: string) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

export function getSupabaseConfig() {
  // .trim() evita espaços/quebras de linha acidentais coladas do painel.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local.",
    );
  }

  // Causa mais comum do "Failed to fetch": credenciais ainda são os exemplos.
  if (looksLikePlaceholder(supabaseUrl) || looksLikePlaceholder(supabaseKey)) {
    throw new Error(
      "As credenciais do Supabase ainda são valores de exemplo. Substitua os placeholders no .env.local pelos valores reais do painel (Settings -> API) e reinicie o servidor.",
    );
  }

  // Garante que a URL é válida e em https — uma URL malformada também gera "Failed to fetch".
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL inválida: "${supabaseUrl}". Use a URL completa do projeto, ex.: https://xxxxxxxx.supabase.co`,
    );
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL deve começar com https:// (recebido: ${parsedUrl.protocol}//...).`,
    );
  }

  return {
    // .origin remove caminhos/barras finais acidentais.
    supabaseUrl: parsedUrl.origin,
    supabaseKey,
  };
}
