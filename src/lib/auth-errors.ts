export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "E-mail ou senha inválidos.";
  }

  if (message.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (message.includes("user already registered")) {
    return "Este e-mail já está cadastrado.";
  }

  if (message.includes("password")) {
    return "A senha precisa atender aos requisitos de segurança.";
  }

  if (message.includes("configure next_public_supabase")) {
    return "As variáveis do Supabase ainda não foram configuradas.";
  }

  return error.message || fallback;
}
