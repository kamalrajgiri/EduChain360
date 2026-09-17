import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Spinner from '../../components/Spinner.jsx';
import { getFees, payFees } from '../../api/student.js';

const STATUS_CHIP = {
  UNPAID: 'bg-status-tampered/10 text-status-tampered',
  PAID:   'bg-status-verified/10 text-status-verified',
  PARTIAL:'bg-status-pending/10 text-status-pending'
};

const RECEIPT_STATUS_CHIP = {
  PAID:    'bg-status-verified/10 text-status-verified',
  PENDING: 'bg-status-pending/10 text-status-pending',
  FAILED:  'bg-status-tampered/10 text-status-tampered'
};

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── Payment modal ─────────────────────────────────────── */

function PayModal({ open, total, onClose, onPaid }) {
  const [method, setMethod] = useState('eSewa');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;

  async function submit() {
    setBusy(true);
    setErr('');
    try {
      const res = await payFees(method);
      onPaid(res.data);
    } catch (e) {
      setErr(e.response?.data?.message || 'Payment failed');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">Pay fees online</h3>
            <p className="text-xs text-text-muted mt-0.5">
              You will be redirected to {method} to complete the payment.
            </p>
          </div>
          <button onClick={onClose} disabled={busy} className="text-text-muted hover:text-text-main text-lg leading-none">×</button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-3 py-2 text-xs text-status-tampered">
            {err}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Payment method</label>
            <div className="grid grid-cols-3 gap-2">
              {['eSewa', 'Khalti', 'Bank transfer'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  disabled={busy}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                    method === m
                      ? 'border-primary bg-primary-subtle text-primary'
                      : 'border-border text-text-main hover:border-primary'
                  } disabled:opacity-60`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-text-muted">Amount to pay</span>
            <span className="text-sm font-bold text-primary">{fmt(total)}</span>
          </div>

          <p className="text-[11px] text-text-muted leading-relaxed">
            On success, a receipt is generated instantly and anchored to the
            blockchain ledger. This is a mock payment — no money is transferred.
          </p>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2
                         hover:bg-background disabled:opacity-60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                         text-xs font-semibold px-5 py-2 disabled:opacity-60 transition-colors"
            >
              {busy ? 'Processing…' : `Pay ${fmt(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */

export default function StudentFees() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payOpen, setPayOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await getFees();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fees');
    } finally {
      setLoading(false);
    }
  }

 useEffect(() => { load(); }, []);

  return (
    <DashboardLayout pageTitle="Fees" pageSubtitle="Fee structure, online payment & receipts">
      {loading && (
        <div className="py-24 grid place-items-center">
          <Spinner size="lg" label="Loading fees..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-4 py-3 text-sm text-status-tampered">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <section className="bg-surface border border-border rounded-2xl overflow-hidden lg:col-span-2">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">Fee structure — Term 2, 2083/2084</h2>
              </header>

              <table className="w-full text-sm">
                <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="text-left  px-5 py-2.5 font-semibold">Fee head</th>
                    <th className="text-right px-5 py-2.5 font-semibold w-32">Amount</th>
                    <th className="text-right px-5 py-2.5 font-semibold w-28">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                      <td className="px-5 py-3 text-text-main">{inv.fee_head}</td>
                      <td className="px-5 py-3 text-right text-text-main font-medium">{fmt(inv.amount)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_CHIP[inv.status] || ''}`}>
                          {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.invoices.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-sm text-text-muted">
                        No fee invoices on record.
                      </td>
                    </tr>
                  )}
                </tbody>
                {data.invoices.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border bg-background">
                      <td className="px-5 py-3 text-sm font-bold text-text-main">Total due</td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-primary">{fmt(data.totalDue)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </section>

            <section className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-sm font-bold text-text-main">Pay online</h2>
              <p className="text-xs text-text-muted mt-0.5">Fee payment via eSewa or Khalti</p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">Payment method</label>
                  <select
                    disabled
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text-main"
                  >
                    <option>eSewa</option>
                    <option>Khalti</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">Amount to pay</label>
                  <input
                    type="text"
                    disabled
                    value={fmt(data.totalDue)}
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text-main"
                  />
                </div>

                <button
                  type="button"
                  disabled={data.totalDue === 0}
                  onClick={() => setPayOpen(true)}
                  className="w-full rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-active
                             disabled:bg-primary/40 disabled:cursor-not-allowed
                             text-text-inverse text-xs font-semibold py-2.5 transition-colors"
                >
                  {data.totalDue > 0 ? `Pay ${fmt(data.totalDue)} securely` : 'No dues — all cleared'}
                </button>

                <p className="text-[11px] text-text-muted leading-relaxed">
                  On successful payment, a fee receipt is generated, hashed with SHA-256,
                  and anchored to the blockchain ledger automatically.
                </p>
              </div>
            </section>
          </div>

          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-text-main">Payment history</h2>
            </header>

            {data.receipts.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">
                No payments on record yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="text-left  px-5 py-2.5 font-semibold">Receipt no.</th>
                    <th className="text-left  px-5 py-2.5 font-semibold hidden md:table-cell">Date</th>
                    <th className="text-right px-5 py-2.5 font-semibold">Amount</th>
                    <th className="text-left  px-5 py-2.5 font-semibold hidden lg:table-cell">Method</th>
                    <th className="text-left  px-5 py-2.5 font-semibold">Status</th>
                    <th className="text-right px-5 py-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.receipts.map((r) => (
                    <tr key={r.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-text-main">{r.receipt_number}</td>
                      <td className="px-5 py-3 text-text-muted hidden md:table-cell">{fmtDate(r.created_at)}</td>
                      <td className="px-5 py-3 text-right text-text-main font-medium">{fmt(r.amount)}</td>
                      <td className="px-5 py-3 text-text-muted hidden lg:table-cell">{r.payment_method || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${RECEIPT_STATUS_CHIP[r.payment_status] || ''}`}>
                          {r.is_anchored ? 'Verified' : (r.payment_status || '').charAt(0) + (r.payment_status || '').slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/student/fees/receipts/${r.id}`}
                          className="text-xs font-medium text-primary hover:text-primary-active"
                        >
                          View receipt →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

        </div>
      )}

      <PayModal
        open={payOpen}
        total={data?.totalDue || 0}
        onClose={() => setPayOpen(false)}
        onPaid={(res) => {
          setPayOpen(false);
          navigate(`/student/fees/receipts/${res.receiptId}`);
        }}
      />
    </DashboardLayout>
  );
}