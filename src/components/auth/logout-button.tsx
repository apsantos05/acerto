"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export function LogoutButton() {
  const { signOut } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setError("");
    setIsLoading(true);

    try {
      await signOut();
    } catch (logoutError) {
      setError(
        getAuthErrorMessage(logoutError, "Não foi possível sair da conta."),
      );
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      title={error || "Sair"}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <LogOut size={17} />
      {isLoading ? "Saindo..." : "Sair"}
    </button>
  );
}
