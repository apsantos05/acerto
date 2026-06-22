import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { SignupForm } from "@/components/auth/signup-form";

export default function CadastroPage() {
  return (
    <main className="grid min-h-screen bg-[#f7fbff] lg:grid-cols-[1.1fr_0.9fr] dark:bg-slate-950">
      <section className="hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-300 text-slate-950">
            <BookOpenCheck size={21} />
          </span>
          <span className="text-lg font-semibold">AcertaVest</span>
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase text-cyan-300">
            Preparação compartilhada
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight">
            Entre em uma comunidade que transforma estudo em rotina mensurável.
          </h1>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-sky-950/10 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Cadastro</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Crie sua conta para compartilhar e salvar materiais.
          </p>

          <SignupForm />
        </div>
      </section>
    </main>
  );
}
