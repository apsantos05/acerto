import { Navbar } from "@/components/layout/navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7fbff]">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        {children}
      </div>
    </main>
  );
}
