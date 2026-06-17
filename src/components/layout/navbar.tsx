"use client";

import Link from "next/link";
import { BookOpenCheck, Menu, UserCircle } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useAuth } from "@/components/auth/auth-provider";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/meus-materiais", label: "Meus materiais" },
  { href: "/feed", label: "Feed" },
  { href: "/ranking", label: "Ranking" },
  { href: "/perfil", label: "Perfil" },
];

export function Navbar() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = Boolean(user);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-cyan-300">
            <BookOpenCheck size={21} />
          </span>
          <span className="text-lg font-semibold">Acerte</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-sky-700"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                href="/perfil"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <UserCircle size={18} />
                Perfil
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Cadastrar
              </Link>
            </>
          )}
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
          aria-label={isLoading ? "Carregando sessão" : "Abrir menu"}
        >
          <Menu size={20} />
        </button>
      </nav>
    </header>
  );
}
