export default function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}) {
  return (
    <section
      className={`dashboard-card overflow-hidden ${className}`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-text-main">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-[10px] text-text-muted">
              {subtitle}
            </p>
          )}
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}