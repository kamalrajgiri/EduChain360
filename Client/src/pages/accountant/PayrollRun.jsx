import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getPayrollRunDetail } from '../../api/accountant.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import ExportButton from '../../components/ExportButton.jsx';
import { todayStamp } from '../../utils/csv.js';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtMonth(ym) {
  if (!ym) return '—';
  const [y, m] = ym.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

const ROLE_CHIP = {
  Admin: 'bg-primary text-text-inverse',
  Teacher: 'bg-secondary-subtle text-secondary',
  Accountant: 'bg-status-verified/10 text-status-verified',
  Librarian: 'bg-status-pending/10 text-status-pending',
  HR: 'bg-primary-subtle text-primary',
  'Lab Assistant': 'bg-background text-text-muted'
};

export default function AccountantPayrollRun() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, retry } = useFetch(() => getPayrollRunDetail(id), [id]);

  const run = data?.run;
  const items = data?.items || [];

  return (
    <DashboardLayout
      pageTitle={run ? `Payroll · ${fmtMonth(run.month)}` : 'Payroll run'}
      pageSubtitle={run ? `${run.staff_count} staff · ${fmt(run.total_net)} net` : 'Loading…'}
    >
      <div className="mb-4 print:hidden">
        <button
          onClick={() => navigate('/accountant/payroll')}
          className="text-xs text-primary hover:text-primary-active font-medium"
        >
          ← Back to Payroll
        </button>
      </div>

      {loading && <SkeletonTable rows={6} cols={5} />}

      {!loading && error && (
        <ErrorState title="Couldn't load payroll run" message={error} onRetry={retry} />
      )}

      {!loading && !error && run && (
        <div className="space-y-5">

          {/* Summary card */}
          <section className="bg-surface border border-border rounded-2xl p-6 print-doc">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
                  Payroll summary
                </p>
                <h1 className="text-lg font-bold text-text-main mt-1">{fmtMonth(run.month)}</h1>
                <p className="text-xs text-text-muted mt-0.5">
                  Processed {new Date(run.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {run.run_by_name ? ` · by ${run.run_by_name}` : ''}
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold
                               bg-status-verified/10 text-status-verified">
                {run.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <div className="bg-background border border-border rounded-xl px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Staff</p>
                <p className="text-lg font-bold text-text-main mt-0.5">{run.staff_count}</p>
              </div>
              <div className="bg-background border border-border rounded-xl px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Total gross</p>
                <p className="text-lg font-bold text-text-main mt-0.5">{fmt(run.total_gross)}</p>
              </div>
              <div className="bg-background border border-border rounded-xl px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Deductions</p>
                <p className="text-lg font-bold text-status-tampered mt-0.5">− {fmt(run.total_deductions)}</p>
              </div>
              <div className="bg-primary-subtle border border-primary-light rounded-xl px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Net payout</p>
                <p className="text-lg font-bold text-primary mt-0.5">{fmt(run.total_net)}</p>
              </div>
            </div>

            {run.notes && (
              <div className="mt-4 bg-background border border-border rounded-lg px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Notes</p>
                <p className="text-xs text-text-main">{run.notes}</p>
              </div>
            )}
          </section>

          {/* Items table */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-text-main">Salary breakdown</h2>
                <p className="text-xs text-text-muted">{items.length} items</p>
              </div>
              <div className="print:hidden">
                <ExportButton
                  label="Export CSV"
                  filename={`payroll-${run.month}-${todayStamp()}.csv`}
                  rows={items}
                  columns={[
                    { key: 'full_name',          label: 'Staff' },
                    { key: 'school_id_number',   label: 'ID' },
                    { key: 'role',               label: 'Role' },
                    { key: 'gross',              label: 'Gross' },
                    { key: 'tax',                label: 'Tax' },
                    { key: 'pf',                 label: 'PF' },
                    { key: 'other_deduction',    label: 'Other' },
                    { key: 'total_deductions',   label: 'Total deductions' },
                    { key: 'net',                label: 'Net' }
                  ]}
                />
              </div>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="text-left  px-4 py-2.5 font-semibold">Staff</th>
                    <th className="text-left  px-4 py-2.5 font-semibold hidden lg:table-cell">Role</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Gross</th>
                    <th className="text-right px-4 py-2.5 font-semibold hidden md:table-cell">Tax</th>
                    <th className="text-right px-4 py-2.5 font-semibold hidden md:table-cell">PF</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Deductions</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Net</th>
                    <th className="text-right px-4 py-2.5 font-semibold print:hidden">Slip</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-text-main font-medium truncate">{it.full_name}</p>
                        <p className="text-[10px] text-text-muted font-mono">{it.school_id_number}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_CHIP[it.role] || ''}`}>
                          {it.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-text-main tabular-nums">{fmt(it.gross)}</td>
                      <td className="px-4 py-3 text-right text-status-tampered hidden md:table-cell tabular-nums text-xs">
                        − {fmt(it.tax)}
                      </td>
                      <td className="px-4 py-3 text-right text-status-tampered hidden md:table-cell tabular-nums text-xs">
                        − {fmt(it.pf)}
                      </td>
                      <td className="px-4 py-3 text-right text-status-tampered tabular-nums text-xs">
                        − {fmt(it.total_deductions)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-status-verified font-semibold tabular-nums">{fmt(it.net)}</span>
                      </td>
                      <td className="px-4 py-3 text-right print:hidden">
                        <Link
                          to={`/accountant/payroll/slip/${run.id}/${it.user_id}`}
                          className="text-xs font-medium text-primary hover:text-primary-active"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      )}
    </DashboardLayout>
  );
}