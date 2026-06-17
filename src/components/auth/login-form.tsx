"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export function LoginForm() {
  const router = useRouter();
  const { signIn, isLoading: isAuthLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signIn(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (clientError) {
      setError(
        getAuthErrorMessage(clientError, "Não foi possível entrar agora."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">E-mail</span>
        <input
          type="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Senha</span>
        <input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        />
      </label>
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        disabled={isLoading || isAuthLoading}
        className="w-full rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Entrando..." : "Entrar na plataforma"}
      </button>
      <p className="text-center text-sm text-slate-600">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-sky-700">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
