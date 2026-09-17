import { Link } from 'react-router-dom';

export default function EmptyState({
  icon = '📭',
  title,
  message,
  actionLabel,
  actionTo,
  actionOnClick
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-12 text-center max-w-lg mx-auto">
      <div className="h-14 w-14 rounded-full bg-primary-subtle text-primary grid place-items-center mx-auto mb-4">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-sm font-bold text-text-main">{title}</h3>
      {message && (
        <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{message}</p>
      )}

      {actionLabel && (actionTo || actionOnClick) && (
        <div className="mt-5">
          {actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex items-center rounded-lg bg-primary hover:bg-primary-hover
                         text-text-inverse text-xs font-semibold px-4 py-2 transition-colors"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={actionOnClick}
              className="inline-flex items-center rounded-lg bg-primary hover:bg-primary-hover
                         text-text-inverse text-xs font-semibold px-4 py-2 transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}