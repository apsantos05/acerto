import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f7fbff] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-sky-950/10">
          <Link href="/" className="mb-8 flex items-center gap-2 text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-cyan-300">
              <BookOpenCheck size={21} />
            </span>
            <span className="text-lg font-semibold">Acerte</span>
          </Link>
          <h1 className="text-3xl font-semibold text-slate-950">Entrar</h1>
          <p className="mt-2 text-slate-600">
            Acesse sua biblioteca, ranking e materiais salvos.
          </p>

          <LoginForm />
        </div>
      </section>
      <section className="hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-end">
        <p className="max-w-xl text-4xl font-semibold leading-tight">
          Materiais organizados, revisão constante e evolução clara até a
          aprovação.
        </p>
      </section>
    </main>
  );
}
