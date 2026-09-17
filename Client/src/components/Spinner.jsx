export default function Spinner({ size = 'md', label }) {
  const dim = size === 'lg' ? 'h-10 w-10 border-4' : 'h-5 w-5 border-2';
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`${dim} animate-spin rounded-full border-primary-light border-t-primary`} />
      {label && <p className="text-xs text-text-muted">{label}</p>}
    </div>
  );
}