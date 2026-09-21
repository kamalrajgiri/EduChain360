export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendType = "positive",
}) {
  return (
    <div className="dashboard-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-text-main">
            {value}
          </p>
        </div>

        {Icon && (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-subtle text-primary">
            <Icon size={19} />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {trend && (
          <span
            className={`rounded-md px-1.5 py-1 text-[9px] font-bold ${
              trendType === "positive"
                ? "bg-green-50 text-success"
                : trendType === "negative"
                ? "bg-red-50 text-danger"
                : "bg-amber-50 text-warning"
            }`}
          >
            {trend}
          </span>
        )}

        {description && (
          <span className="text-[10px] text-text-muted">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}