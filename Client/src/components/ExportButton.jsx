import { downloadCSV } from '../utils/csv.js';

export default function ExportButton({
  rows,
  columns,
  filename,
  label = 'Export CSV',
  disabled,
  className = ''
}) {
  function handleClick() {
    if (!rows || rows.length === 0) return;
    downloadCSV(filename, rows, columns);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !rows || rows.length === 0}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface
                  text-text-main text-xs font-medium px-3.5 py-2
                  hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors ${className}`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label}
    </button>
  );
}