export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.toLowerCase();

  // Falha de rede (DNS, offline, URL do Supabase errada ou CORS).
  // O signUp() do supabase-js lança "TypeError: Failed to fetch" nestes casos.
  if (
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("err_name_not_resolved")
  ) {
    return "Não foi possível conectar ao Supabase. Verifique a NEXT_PUBLIC_SUPABASE_URL no .env.local, se reiniciou o servidor e sua conexão.";
  }

  // Credenciais ainda em valor de exemplo ou ausentes.
  if (
    message.includes("configure next_public_supabase") ||
    message.includes("valores de exemplo") ||
    message.includes("supabase_url inválida") ||
    message.includes("deve começar com https")
  ) {
    return "As variáveis do Supabase ainda não foram configuradas corretamente no .env.local.";
  }

  if (message.includes("invalid login credentials")) {
    return "E-mail ou senha inválidos.";
  }

  if (message.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (
    message.includes("user already registered") ||
    message.includes("already been registered")
  ) {
    return "Este e-mail já está cadastrado.";
  }

  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  }

  if (message.includes("password")) {
    return "A senha precisa atender aos requisitos de segurança (mínimo de 6 caracteres).";
  }

  return error.message || fallback;
}
