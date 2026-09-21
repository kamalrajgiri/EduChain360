import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getReports, getDayOfWeekReport } from '../../api/accountant.js';
import { SkeletonDashboard } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtShort(n) {
  const num = Number(n);
  if (num >= 10000000) return `NPR ${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000)   return `NPR ${(num / 100000).toFixed(2)} L`;
  return `NPR ${num.toLocaleString('en-IN')}`;
}

function monthLabel(ym) {
  const [y, m] = ym.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export default function AccountantReports() {
  const { data, loading, error, retry } = useFetch(() => getReports(), []);
  const dayFetch = useFetch(() => getDayOfWeekReport(6), []);

  return (
    <DashboardLayout
      pageTitle="Reports"
      pageSubtitle="Fee collection insights & outstanding dues"
    >
      {loading && <SkeletonDashboard />}

      {!loading && error && (
        <ErrorState title="Couldn't load reports" message={error} onRetry={retry} />
      )}

      {!loading && !error && data && (
        <div className="space-y-6">

          {/* Monthly collection trend */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-text-main">Monthly collection (last 6 months)</h2>
            </header>

            {data.monthly.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">No data yet.</div>
            ) : (
              <div className="p-5">
                {(() => {
                  const max = Math.max(...data.monthly.map((m) => Number(m.amount)));
                  return (
                    <div className="space-y-3">
                      {data.monthly.map((m) => {
                        const pct = max > 0 ? (Number(m.amount) / max) * 100 : 0;
                        return (
                          <div key={m.month}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-text-main">
                                {monthLabel(m.month)}
                              </span>
                              <span className="text-xs text-text-muted tabular-nums">
                                {fmtShort(m.amount)} · {m.receipts} receipts
                              </span>
                            </div>
                            <div className="h-2 bg-primary-light rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </section>

          {/* Day-of-week pattern */}
          {dayFetch.data && dayFetch.data.days.some((d) => d.receipts > 0) && (
            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">Collection by day of week</h2>
                <p className="text-xs text-text-muted">Last {dayFetch.data.months} months</p>
              </header>
              <div className="p-5">
                {(() => {
                  const max = Math.max(...dayFetch.data.days.map((d) => Number(d.amount)), 1);
                  const busiest = dayFetch.data.days.reduce(
                    (best, d) => Number(d.amount) > Number(best.amount) ? d : best,
                    dayFetch.data.days[0]
                  );
                  return (
                    <>
                      <div className="space-y-3">
                        {dayFetch.data.days.map((d) => {
                          const pct = (Number(d.amount) / max) * 100;
                          const isBusiest = d.day === busiest.day && Number(busiest.amount) > 0;
                          return (
                            <div key={d.day}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-xs font-medium ${
                                  isBusiest ? 'text-primary' : 'text-text-main'
                                }`}>
                                  {d.day}
                                  {isBusiest && (
                                    <span className="ml-2 text-[10px] uppercase tracking-wider
                                                     bg-primary-subtle text-primary px-1.5 py-0.5 rounded">
                                      Busiest
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-text-muted tabular-nums">
                                  {fmtShort(d.amount)} · {d.receipts} receipt{d.receipts === 1 ? '' : 's'}
                                </span>
                              </div>
                              <div className="h-2 bg-primary-light rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isBusiest ? 'bg-primary' : 'bg-primary/60'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-[11px] text-text-muted mt-4">
                        Insight: most collections happen on <span className="font-semibold text-text-main">{busiest.day}</span>.
                        Schedule fee reminders 1–2 days before high-traffic days for better response.
                      </p>
                    </>
                  );
                })()}
              </div>
            </section>
          )}

          {/* By method + Outstanding grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">Collection by method (all time)</h2>
              </header>
              {data.byMethod.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-muted">No data yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="text-left  px-5 py-2.5 font-semibold">Method</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Receipts</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byMethod.map((m) => (
                      <tr key={m.payment_method} className="border-t border-border">
                        <td className="px-5 py-3 text-text-main">{m.payment_method || 'Unknown'}</td>
                        <td className="px-5 py-3 text-right text-text-muted tabular-nums">{m.count}</td>
                        <td className="px-5 py-3 text-right text-text-main font-medium tabular-nums">
                          {fmt(m.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">Outstanding dues by class</h2>
              </header>
              {data.outstanding.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-muted">
                  No outstanding dues. All clear.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="text-left  px-5 py-2.5 font-semibold">Class</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Students</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.outstanding.map((c) => (
                      <tr key={c.id} className="border-t border-border">
                        <td className="px-5 py-3 text-text-main truncate max-w-[200px]">{c.class_name}</td>
                        <td className="px-5 py-3 text-right text-text-muted tabular-nums">{c.students}</td>
                        <td className="px-5 py-3 text-right text-status-pending font-semibold tabular-nums">
                          {fmt(c.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          {/* By class — collection */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-text-main">Collection by class</h2>
            </header>
            {data.byClass.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">No data yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="text-left  px-5 py-2.5 font-semibold">Class</th>
                    <th className="text-right px-5 py-2.5 font-semibold hidden md:table-cell">Students</th>
                    <th className="text-right px-5 py-2.5 font-semibold hidden md:table-cell">Receipts</th>
                    <th className="text-right px-5 py-2.5 font-semibold">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byClass.map((c) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="px-5 py-3 text-text-main truncate max-w-[200px]">{c.class_name}</td>
                      <td className="px-5 py-3 text-right text-text-muted tabular-nums hidden md:table-cell">
                        {c.student_count}
                      </td>
                      <td className="px-5 py-3 text-right text-text-muted tabular-nums hidden md:table-cell">
                        {c.receipt_count}
                      </td>
                      <td className="px-5 py-3 text-right text-status-verified font-semibold tabular-nums">
                        {fmt(c.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

        </div>
      )}
    </DashboardLayout>
  );
}