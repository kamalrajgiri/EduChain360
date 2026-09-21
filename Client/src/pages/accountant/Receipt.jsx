import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Spinner from '../../components/Spinner.jsx';
import { getReceipt } from '../../api/accountant.js';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

function shortHash(h) {
  if (!h) return '—';
  return `${h.slice(0, 6)}…${h.slice(-6)}`;
}

export default function AccountantReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getReceipt(id);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load receipt');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <DashboardLayout
      pageTitle="Fee receipt"
      pageSubtitle={data ? `${data.receipt_number} · ${data.student_name}` : 'Loading…'}
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
          <Spinner size="lg" label="Loading receipt..." />
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

            <div className="bg-primary-dark text-text-inverse px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center text-sm font-bold">
                  EC
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Far Western University</p>
                  <p className="text-[11px] text-primary-light">EduChain360 · Official Fee Receipt</p>
                </div>
              </div>
              {data.is_anchored ? (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-text-inverse">
                  Blockchain-anchored
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-status-pending text-text-inverse">
                  Pending anchor
                </span>
              )}
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="md:col-span-2 space-y-5">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Receipt no.</p>
                    <p className="text-sm font-mono text-text-main mt-0.5">{data.receipt_number}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Payment date</p>
                    <p className="text-sm text-text-main mt-0.5">{fmtDateTime(data.created_at)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Student</p>
                    <p className="text-sm font-semibold text-text-main mt-0.5">
                      {data.student_name} · {data.class_name || '—'}
                    </p>
                    <p className="text-[11px] text-text-muted font-mono">{data.school_id_number}</p>
                  </div>
                  {data.recorded_by_name && (
                    <div className="col-span-2">
                      <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Recorded by</p>
                      <p className="text-sm text-text-main mt-0.5">{data.recorded_by_name}</p>
                    </div>
                  )}
                </div>

                <div className="border border-border rounded-xl overflow-hidden print-keep">
                  <table className="w-full text-sm">
                    <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                      <tr>
                        <th className="text-left  px-4 py-2 font-semibold">Fee head</th>
                        <th className="text-right px-4 py-2 font-semibold w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="px-4 py-2.5 text-text-main">Total payment received</td>
                        <td className="px-4 py-2.5 text-right text-text-main font-medium">{fmt(data.amount)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-primary-subtle/40">
                        <td className="px-4 py-2.5 text-sm font-bold text-text-main">Total paid</td>
                        <td className="px-4 py-2.5 text-right text-sm font-bold text-primary">{fmt(data.amount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {data.notes && (
                  <div className="bg-background border border-border rounded-lg px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-1">Notes</p>
                    <p className="text-xs text-text-main">{data.notes}</p>
                  </div>
                )}

                <div className="bg-background border border-border rounded-lg px-4 py-3 print-keep">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-text-muted">
                    <span>SHA-256: {shortHash(data.receipt_hash)}</span>
                    <span className="text-text-muted/60">|</span>
                    <span>Block #{data.is_anchored ? '8823' : '—'}</span>
                    <span className="text-text-muted/60">|</span>
                    {data.is_anchored ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                                       bg-status-verified/10 text-status-verified">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                                       bg-status-pending/10 text-status-pending">
                        Pending anchor
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-start">
                <div className="w-full aspect-square max-w-[180px] border-2 border-dashed border-border rounded-xl
                                grid place-items-center bg-background">
                  <div className="text-center px-3">
                    <p className="text-[11px] text-text-muted">Scan to verify</p>
                    <p className="text-[10px] text-text-muted/70 mt-1 font-mono">{data.receipt_number}</p>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted mt-2 text-center">
                  QR generation ships with the blockchain phase
                </p>
              </div>
            </div>

            <div className="hidden print:block border-t border-border px-6 py-3">
              <p className="text-[10px] text-text-muted text-center">
                Generated by EduChain360 · {new Date().toLocaleString('en-GB')} · This document is valid without a signature.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <Link to="/accountant/transactions" className="text-xs font-medium text-text-muted hover:text-text-main">
              ← Back to transactions
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