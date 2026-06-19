import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-[#f7fbff]">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:px-8">
        {children}
      </div>
      <SiteFooter />
    </main>
  );
}
