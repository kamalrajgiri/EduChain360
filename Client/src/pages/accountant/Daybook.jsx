import { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getDaybook } from '../../api/accountant.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ExportButton from '../../components/ExportButton.jsx';
import { todayStamp } from '../../utils/csv.js';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtShort(n) {
  const num = Number(n);
  if (num >= 100000) return `NPR ${(num / 100000).toFixed(2)} L`;
  return `NPR ${num.toLocaleString('en-IN')}`;
}

function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-GB', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });
}

function fmtDateLong(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

const METHOD_ICON = {
  'Cash':          '💵',
  'Cheque':        '📝',
  'Bank slip':     '🏦',
  'eSewa':         '📱',
  'Khalti':        '📱',
  'Bank transfer': '🏦'
};

export default function AccountantDaybook() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const { data, loading, error, retry } = useFetch(() => getDaybook(date), [date]);

  const isToday = date === today;

  return (
    <DashboardLayout
      pageTitle="Daily collection"
      pageSubtitle={data ? fmtDateLong(data.date) : 'Loading…'}
    >
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 print:hidden">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-muted">Date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs
                       text-text-main focus:outline-none focus:border-primary"
          />
          {!isToday && (
            <button
              onClick={() => setDate(today)}
              className="text-[11px] font-medium text-primary hover:text-primary-active"
            >
              Jump to today
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <ExportButton
            label="Export CSV"
            filename={`daybook-${date}-${todayStamp()}.csv`}
            rows={data?.rows || []}
            columns={[
              { key: 'receipt_number',    label: 'Receipt no.' },
              { key: 'student_name',      label: 'Student' },
              { key: 'school_id_number',  label: 'Student ID' },
              { key: 'class_name',        label: 'Class' },
              { key: 'amount',            label: 'Amount' },
              { key: 'payment_method',    label: 'Method' },
              { key: 'payment_status',    label: 'Status' },
              { key: 'created_at',        label: 'Time' }
            ]}
          />
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-hover
                       text-text-inverse text-xs font-semibold px-3.5 py-2 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {loading && <SkeletonTable rows={8} cols={6} />}

      {!loading && error && (
        <ErrorState title="Couldn't load daybook" message={error} onRetry={retry} />
      )}

      {!loading && !error && data && (
        <div className="space-y-6 print-doc">

          {/* Print header */}
          <div className="hidden print:block bg-primary-dark text-text-inverse px-6 py-5 rounded-2xl">
            <p className="text-[10px] uppercase tracking-widest text-primary-light">
              Far Western University · School of Engineering
            </p>
            <p className="text-lg font-bold mt-1">Daily Collection Report</p>
            <p className="text-[11px] text-primary-light mt-0.5">
              {fmtDateLong(data.date)} · Generated {new Date().toLocaleString('en-GB')}
            </p>
          </div>

          {/* KPI tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-surface border border-border rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                Receipts
              </p>
              <p className="text-lg font-bold text-text-main mt-0.5">
                {data.totals.count}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                Total collected
              </p>
              <p className="text-lg font-bold text-status-verified mt-0.5">
                {fmtShort(data.totals.amount)}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                Anchored
              </p>
              <p className="text-lg font-bold text-secondary mt-0.5">
                {data.totals.anchored}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                Methods used
              </p>
              <p className="text-lg font-bold text-text-main mt-0.5">
                {data.byMethod.length}
              </p>
            </div>
          </div>

          {/* Methods breakdown */}
          {data.byMethod.length > 0 && (
            <section className="bg-surface border border-border rounded-2xl overflow-hidden print-keep">
              <header className="px-5 py-3 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">By payment method</h2>
              </header>
              <div className="p-5">
                <div className="space-y-3">
                  {data.byMethod.map((m) => {
                    const pct = data.totals.amount > 0
                      ? (Number(m.amount) / data.totals.amount) * 100
                      : 0;
                    return (
                      <div key={m.payment_method}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-text-main">
                            {METHOD_ICON[m.payment_method] || '•'} {m.payment_method || 'Unknown'}
                          </span>
                          <span className="text-xs text-text-muted tabular-nums">
                            {fmt(m.amount)} · {m.count} receipt{m.count === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="h-1.5 bg-primary-light rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Transactions list */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden print-keep">
            <header className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-text-main">Receipts</h2>
              <p className="text-xs text-text-muted">
                {data.rows.length} record{data.rows.length === 1 ? '' : 's'}
              </p>
            </header>

            {data.rows.length === 0 ? (
              <EmptyState
                icon="📅"
                title="No collections on this date"
                message={
                  isToday
                    ? 'Payments received today will appear here.'
                    : 'Pick a different date to see historical collections.'
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[680px]">
                  <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="text-left  px-5 py-2.5 font-semibold">Time</th>
                      <th className="text-left  px-5 py-2.5 font-semibold">Receipt</th>
                      <th className="text-left  px-5 py-2.5 font-semibold">Student</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Amount</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden md:table-cell">Method</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden lg:table-cell">Recorded by</th>
                      <th className="text-right px-5 py-2.5 font-semibold print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                        <td className="px-5 py-3 text-text-muted text-xs whitespace-nowrap">
                          {fmtTime(r.created_at)}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-text-main">
                          {r.receipt_number}
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-text-main font-medium truncate max-w-[180px]">
                            {r.student_name}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {r.class_name || '—'}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-right text-text-main font-semibold tabular-nums">
                          {fmt(r.amount)}
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden md:table-cell text-xs">
                          {r.payment_method || '—'}
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden lg:table-cell text-xs">
                          {r.recorded_by_name || 'System'}
                        </td>
                        <td className="px-5 py-3 text-right print:hidden">
                          <Link
                            to={`/accountant/receipts/${r.id}`}
                            className="text-xs font-medium text-primary hover:text-primary-active"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-text-main/20 bg-background">
                      <td colSpan={3} className="px-5 py-3 text-xs font-bold text-text-main">
                        Day total
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-status-verified tabular-nums">
                        {fmt(data.totals.amount)}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          {/* Signature */}
          {data.rows.length > 0 && (
            <div className="hidden print:flex justify-end pt-8">
              <div className="text-center">
                <div className="h-12 w-48 border-b border-text-muted/40" />
                <p className="text-[11px] text-text-muted mt-1.5">Accounts Officer</p>
              </div>
            </div>
          )}

          {/* Print footer */}
          <div className="hidden print:block text-center text-[10px] text-text-muted pt-4 border-t border-border">
            Generated by EduChain360 · This report is valid without a signature.
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}