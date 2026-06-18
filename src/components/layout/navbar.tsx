"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpenCheck, Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useAuth } from "@/components/auth/auth-provider";
import { ProfileAvatar } from "@/components/profile/profile-avatar";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/meus-materiais", label: "Meus materiais" },
  { href: "/feed", label: "Feed" },
  { href: "/ranking", label: "Ranking" },
  { href: "/perfil", label: "Perfil" },
];

const mobileNavItems = [
  { href: "/", label: "Início" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/feed", label: "Feed" },
  { href: "/ranking", label: "Ranking" },
];

export function Navbar() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = Boolean(user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    "Perfil";

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
                className="inline-flex items-center gap-2 rounded-lg py-1 pl-1 pr-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <ProfileAvatar
                  name={displayName}
                  avatarUrl={avatarUrl}
                  size="sm"
                />
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
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {isMenuOpen ? (
        <div
          id="mobile-menu"
          className="border-t border-slate-200 bg-white md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="rounded-lg px-3 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-4">
              {isLoading ? (
                <span className="px-3 py-2 text-sm text-slate-400">
                  Carregando sessão...
                </span>
              ) : isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/perfil"
                    onClick={closeMenu}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <ProfileAvatar
                      name={displayName}
                      avatarUrl={avatarUrl}
                      size="sm"
                    />
                    Perfil
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-3 text-center text-base font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    onClick={closeMenu}
                    className="rounded-lg bg-slate-950 px-3 py-3 text-center text-base font-semibold text-white transition hover:bg-slate-800"
                  >
                    Cadastrar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
