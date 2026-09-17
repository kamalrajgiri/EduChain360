/**
 * Skeleton primitives. Compose these to match any final layout.
 * Uses a light shimmer via Tailwind's animate-pulse.
 */

function Bar({ w = 'w-full', h = 'h-3', rounded = 'rounded', className = '' }) {
  return (
    <div className={`${w} ${h} ${rounded} bg-border animate-pulse ${className}`} />
  );
}

export function SkeletonLine({ w = 'w-full', h = 'h-3' }) {
  return <Bar w={w} h={h} />;
}

/** 4 KPI cards row */
export function SkeletonKpiRow({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-5">
          <Bar w="w-9" h="h-9" rounded="rounded-lg" className="mb-3" />
          <Bar w="w-24" h="h-2.5" className="mb-2" />
          <Bar w="w-20" h="h-7" rounded="rounded" className="mb-2" />
          <Bar w="w-32" h="h-2" />
        </div>
      ))}
    </div>
  );
}

/** Card with a title bar and body lines */
export function SkeletonCard({ lines = 4, title = true }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      {title && <Bar w="w-40" h="h-3.5" className="mb-4" />}
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Bar
            key={i}
            w={i === lines - 1 ? 'w-3/4' : 'w-full'}
            h="h-2.5"
          />
        ))}
      </div>
    </div>
  );
}

/** Table skeleton with header bar + rows */
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <Bar w="w-40" h="h-3.5" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-5 py-3 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Bar key={c} w={c === cols - 1 ? 'w-16' : 'w-full'} h="h-2.5" rounded="rounded-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full-page default — a row of KPIs, then a large content block */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <SkeletonKpiRow count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={5} />
      </div>
    </div>
  );
}