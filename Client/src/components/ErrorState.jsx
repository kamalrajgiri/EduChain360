export default function ErrorState({
  title = "Couldn't load this data",
  message,
  onRetry
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-10 max-w-lg mx-auto text-center">
      <div className="h-14 w-14 rounded-full bg-status-tampered/10 text-status-tampered grid place-items-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <h3 className="text-sm font-bold text-text-main">{title}</h3>
      <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
        {message || "Your session and role permissions are unaffected."}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center rounded-lg bg-primary hover:bg-primary-hover
                     text-text-inverse text-xs font-semibold px-4 py-2 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}