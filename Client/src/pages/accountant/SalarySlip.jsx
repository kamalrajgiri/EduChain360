import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getSalarySlip } from '../../api/accountant.js';
import Spinner from '../../components/Spinner.jsx';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtMonth(ym) {
  if (!ym) return '—';
  const [y, m] = ym.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export default function AccountantSalarySlip() {
  const { runId, userId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(() => getSalarySlip(runId, userId), [runId, userId]);

  return (
    <DashboardLayout
      pageTitle="Salary slip"
      pageSubtitle={data ? `${data.full_name} · ${fmtMonth(data.month)}` : 'Loading…'}
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
        <div className="py-24 grid place-items-center print:hidden">
          <Spinner size="lg" label="Loading slip..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-4 py-3 text-sm text-status-tampered print:hidden">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="max-w-3xl mx-auto print:max-w-none">

          <div className="bg-surface border border-border rounded-2xl overflow-hidden
                          print-keep print-doc">

            {/* Header */}
            <div className="bg-primary-dark text-text-inverse px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center text-sm font-bold">
                  EC
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Far Western University</p>
                  <p className="text-[11px] text-primary-light">EduChain360 · Salary Slip</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-text-inverse">
                {fmtMonth(data.month)}
              </span>
            </div>

            {/* Employee */}
            <div className="px-6 py-5 border-b border-border grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Employee</p>
                <p className="text-sm font-semibold text-text-main mt-0.5">{data.full_name}</p>
                <p className="text-[11px] text-text-muted font-mono">{data.school_id_number}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Designation</p>
                <p className="text-sm font-semibold text-text-main mt-0.5">{data.role}</p>
                <p className="text-[11px] text-text-muted">{data.email}</p>
              </div>
            </div>

            {/* Earnings + Deductions */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 md:border-r border-border">
                <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold mb-3">
                  Earnings
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-border/70">
                      <td className="py-2 text-text-main">Basic salary</td>
                      <td className="py-2 text-right text-text-main font-medium tabular-nums">
                        {fmt(data.gross)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-text-main/20">
                      <td className="py-3 text-sm font-bold text-text-main">Gross earnings</td>
                      <td className="py-3 text-right text-sm font-bold text-text-main tabular-nums">
                        {fmt(data.gross)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="p-6">
                <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold mb-3">
                  Deductions
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-border/70">
                      <td className="py-2 text-text-main">Income tax</td>
                      <td className="py-2 text-right text-text-main font-medium tabular-nums">
                        {fmt(data.tax)}
                      </td>
                    </tr>
                    <tr className="border-b border-border/70">
                      <td className="py-2 text-text-main">Provident fund (PF)</td>
                      <td className="py-2 text-right text-text-main font-medium tabular-nums">
                        {fmt(data.pf)}
                      </td>
                    </tr>
                    {Number(data.other_deduction) > 0 && (
                      <tr className="border-b border-border/70">
                        <td className="py-2 text-text-main">Other deductions</td>
                        <td className="py-2 text-right text-text-main font-medium tabular-nums">
                          {fmt(data.other_deduction)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-text-main/20">
                      <td className="py-3 text-sm font-bold text-text-main">Total deductions</td>
                      <td className="py-3 text-right text-sm font-bold text-status-tampered tabular-nums">
                        {fmt(data.total_deductions)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Net pay */}
            <div className="bg-primary-subtle px-6 py-5 border-t border-primary-light flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Net pay</p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Amount transferred to employee account
                </p>
              </div>
              <p className="text-2xl font-bold text-primary tabular-nums">{fmt(data.net)}</p>
            </div>

            {/* Print footer */}
            <div className="hidden print:block border-t border-border px-6 py-3">
              <p className="text-[10px] text-text-muted text-center">
                Generated by EduChain360 · {new Date().toLocaleString('en-GB')} · This is a computer-generated slip and does not require a signature.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between print:hidden">
            <Link
              to={`/accountant/payroll/runs/${runId}`}
              className="text-xs font-medium text-text-muted hover:text-text-main"
            >
              ← Back to payroll run
            </Link>
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
      )}
    </DashboardLayout>
  );
}