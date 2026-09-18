import Badge from "../ui/Badge";

export default function DashboardPageHeader({
  badge,
  title,
  description,
  children,
}) {
  return (
    <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div>
        {badge && <Badge variant="cyan">{badge}</Badge>}

        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          {title}
        </h1>

        {description && (
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            {description}
          </p>
        )}
      </div>

      {children && <div className="flex flex-col gap-3 sm:flex-row">{children}</div>}
    </section>
  );
}