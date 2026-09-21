export default function PageHeader({
  title,
  subtitle,
  action,
  eyebrow = "ADMINISTRATION",
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>

        <h1 className="text-xl font-bold tracking-tight text-text-main sm:text-[21px]">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 max-w-2xl text-xs leading-5 text-text-muted">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}