import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
        <Icon size={22} />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{description}</p>
    </article>
  );
}
