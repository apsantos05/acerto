type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase text-sky-700">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">{description}</p>
    </div>
  );
}
