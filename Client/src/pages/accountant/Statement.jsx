import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getStudentStatement } from '../../api/accountant.js';
import { SkeletonCard, SkeletonTable } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import ExportButton from '../../components/ExportButton.jsx';
import { todayStamp } from '../../utils/csv.js';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

export default function AccountantStatement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, retry } = useFetch(() => getStudentStatement(id), [id]);

  const student = data?.student;
  const ledger = data?.ledger || [];
  const totals = data?.totals;

  return (
    <DashboardLayout
      pageTitle="Statement of account"
      pageSubtitle={student ? `${student.full_name} · ${student.school_id_number}` : 'Loading…'}
    >
      <div className="mb-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-primary hover:text-primary-active font-medium"
        >
          ← Back
        </button>
      </div>

      {loading && (
        <div className="space-y-6">
          <SkeletonCard lines={4} />
          <SkeletonTable rows={6} cols={4} />
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Couldn't load statement" message={error} onRetry={retry} />
      )}

      {!loading && !error && data && (
        <div className="max-w-4xl mx-auto print:max-w-none">

          <div className="bg-surface border border-border rounded-2xl overflow-hidden print-doc">

            {/* Header */}
            <div className="bg-primary-dark text-text-inverse px-6 py-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center text-sm font-bold">
                    EC
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary-light">
                      Far Western University · School of Engineering
                    </p>
                    <p className="text-base font-bold mt-0.5">Statement of Account</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-primary-light">Generated</p>
                  <p className="text-xs font-medium">{fmtDateTime(data.generated_at)}</p>
                </div>
              </div>
            </div>

            {/* Student block */}
            <div className="px-6 py-5 border-b border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Student</p>
                <p className="text-sm font-bold text-text-main mt-0.5">{student.full_name}</p>
                <p className="text-[11px] text-text-muted font-mono">{student.school_id_number}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Class</p>
                <p className="text-sm font-medium text-text-main mt-0.5">
                  {student.class_name || 'No class'}
                </p>
                <p className="text-[11px] text-text-muted">
                  {student.roll_number ? `Roll ${student.roll_number}` : ''}
                  {student.academic_year ? ` · ${student.academic_year}` : ''}
                </p>
              </div>
            </div>

            {/* Summary tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-border">
              <div className="px-6 py-4 sm:border-r border-border">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Total invoiced</p>
                <p className="text-base font-bold text-text-main mt-1">{fmt(totals.invoiced)}</p>
              </div>
              <div className="px-6 py-4 sm:border-r border-border">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Total paid</p>
                <p className="text-base font-bold text-status-verified mt-1">{fmt(totals.paid)}</p>
              </div>
              <div className="px-6 py-4 sm:border-r border-border">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Outstanding</p>
                <p className={`text-base font-bold mt-1 ${
                  totals.outstanding > 0 ? 'text-status-pending' : 'text-text-muted'
                }`}>
                  {fmt(totals.outstanding)}
                </p>
              </div>
              <div className="px-6 py-4 bg-primary-subtle">
                <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Closing balance</p>
                <p className="text-base font-bold text-primary mt-1">{fmt(totals.balance)}</p>
              </div>
            </div>

            {/* Ledger */}
            <div className="px-6 py-5">
              <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold mb-3">
                Account activity
              </p>

              {ledger.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-muted">
                  No transactions on record.
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden print-keep">
                  <table className="w-full text-sm">
                    <thead className="bg-background text-[10px] uppercase tracking-wider text-text-muted">
                      <tr>
                        <th className="text-left  px-4 py-2 font-semibold">Date</th>
                        <th className="text-left  px-4 py-2 font-semibold">Description</th>
                        <th className="text-right px-4 py-2 font-semibold w-24">Debit</th>
                        <th className="text-right px-4 py-2 font-semibold w-24">Credit</th>
                        <th className="text-right px-4 py-2 font-semibold w-28">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-4 py-2.5 text-text-muted text-xs whitespace-nowrap">
                            {fmtDate(row.when)}
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="text-text-main font-medium text-xs">{row.label}</p>
                            {row.sublabel && (
                              <p className="text-[10px] text-text-muted">{row.sublabel}</p>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-xs">
                            {row.debit > 0 ? (
                              <span className="text-text-main font-medium">{fmt(row.debit)}</span>
                            ) : <span className="text-text-muted">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-xs">
                            {row.credit > 0 ? (
                              <span className="text-status-verified font-medium">{fmt(row.credit)}</span>
                            ) : <span className="text-text-muted">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-xs">
                            <span className={`font-semibold ${
                              row.balance > 0 ? 'text-status-pending' : 'text-status-verified'
                            }`}>
                              {fmt(Math.abs(row.balance))}
                              {row.balance < 0 ? ' Cr' : ''}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-text-main/20 bg-background">
                        <td colSpan={2} className="px-4 py-3 text-xs font-bold text-text-main">
                          Totals
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-text-main tabular-nums">
                          {fmt(totals.invoiced)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-status-verified tabular-nums">
                          {fmt(totals.paid)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-primary tabular-nums">
                          {fmt(Math.abs(totals.balance))}
                          {totals.balance < 0 ? ' Cr' : ''}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <p className="text-[10px] text-text-muted mt-3 italic">
                Debit = amount billed to the student. Credit = amount paid by the student.
                A negative balance (marked &quot;Cr&quot;) means the student has an advance/credit.
              </p>
            </div>

            {/* Signature */}
            <div className="px-6 pb-6 grid grid-cols-2 gap-8 border-t border-border pt-6">
              <div>
                <div className="h-10 border-b border-text-muted/40" />
                <p className="text-[11px] text-text-muted mt-1.5">Accounts Officer</p>
              </div>
              <div>
                <div className="h-10 border-b border-text-muted/40" />
                <p className="text-[11px] text-text-muted mt-1.5">Registrar</p>
              </div>
            </div>

            {/* Print footer */}
            <div className="hidden print:block border-t border-border px-6 py-3">
              <p className="text-[10px] text-text-muted text-center">
                Generated by EduChain360 · Verify at educhain360.fwu.edu.np/verify · This statement is valid without a signature.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <Link
              to={`/accountant/students/${id}`}
              className="text-xs font-medium text-text-muted hover:text-text-main"
            >
              ← Back to student detail
            </Link>
            <div className="flex gap-2">
              <ExportButton
                label="Export ledger (CSV)"
                filename={`statement-${student.school_id_number}-${todayStamp()}.csv`}
                rows={ledger}
                columns={[
                  { key: 'when',     label: 'Date' },
                  { key: 'type',     label: 'Type' },
                  { key: 'label',    label: 'Description' },
                  { key: 'sublabel', label: 'Reference' },
                  { key: 'debit',    label: 'Debit' },
                  { key: 'credit',   label: 'Credit' },
                  { key: 'balance',  label: 'Balance' }
                ]}
              />
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold px-4 py-2
                           transition-colors"
              >
                Download / print (PDF)
              </button>
            </div>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}