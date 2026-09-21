import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Spinner from '../../components/Spinner.jsx';
import { getFees, payFees } from '../../api/student.js';

const STATUS_CHIP = {
  UNPAID:  'bg-status-tampered/10 text-status-tampered',
  PAID:    'bg-status-verified/10 text-status-verified',
  PARTIAL: 'bg-status-pending/10 text-status-pending'
};

const RECEIPT_STATUS_CHIP = {
  PAID:    'bg-status-verified/10 text-status-verified',
  PENDING: 'bg-status-pending/10 text-status-pending',
  FAILED:  'bg-status-tampered/10 text-status-tampered'
};

const ADJ_CHIP = {
  FINE:       'bg-status-tampered/10 text-status-tampered',
  DISCOUNT:   'bg-status-verified/10 text-status-verified',
  ADDITIONAL: 'bg-status-pending/10 text-status-pending'
};

const ADJ_LABEL = {
  FINE:       'Fine',
  DISCOUNT:   'Discount',
  ADDITIONAL: 'Additional'
};

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* Payment type badge — Partial / Full / Advance */
function PaymentTypeBadge({ type }) {
  const map = {
    PARTIAL: { label: 'Partial', class: 'bg-status-pending/10 text-status-pending' },
    FULL:    { label: 'Full',    class: 'bg-status-verified/10 text-status-verified' },
    ADVANCE: { label: 'Advance', class: 'bg-secondary-subtle text-secondary' }
  };
  const cfg = map[type];
  if (!cfg) return <span className="text-[10px] text-text-muted">—</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}

function inferPaymentType(receipt, invoices, allReceipts) {
  const receiptAmt = Number(receipt.amount);
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaidSoFar = allReceipts.reduce((s, r) => s + Number(r.amount), 0);

  if (totalPaidSoFar > totalInvoiced) return 'ADVANCE';
  if (receiptAmt >= totalInvoiced - (totalPaidSoFar - receiptAmt)) return 'FULL';
  return 'PARTIAL';
}

/* ─── Payment modal ─────────────────────────────────────── */

function PayModal({ open, total, onClose, onPaid }) {
  const [method, setMethod] = useState('eSewa');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setAmount(String(Math.round(Number(total) || 0)));
      setErr('');
      setMethod('eSewa');
    }
  }, [open, total]);

  if (!open) return null;

  const OFFLINE = ['Cash', 'Cheque', 'Bank slip'];
  const isOffline = OFFLINE.includes(method);
  const amt = Number(amount) || 0;
  const due = Number(total) || 0;
  const isPartial = amt > 0 && amt < due;
  const isAdvance = amt > due;
  const credit = isAdvance ? amt - due : 0;
  const canSubmit = amt > 0 && !busy;

  function quickAmount(val) {
    if (val === 'full') setAmount(String(Math.round(due)));
    else if (val === 'half') setAmount(String(Math.round(due / 2)));
    else if (val === 'clear') setAmount('');
  }

  async function submit() {
    setErr('');
    if (!amt || amt <= 0) return setErr('Enter an amount');
    if (isOffline && due === 0 && !amt) return setErr('Nothing to pay');

    setBusy(true);
    try {
      const res = await payFees(amt, method);
      onPaid(res.data);
    } catch (e) {
      setErr(e.response?.data?.message || 'Payment failed');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 my-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">Pay fees</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Choose how you want to pay — online or at the counter.
            </p>
          </div>
          <button onClick={onClose} disabled={busy} className="text-text-muted hover:text-text-main text-lg leading-none">×</button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-3 py-2 text-xs text-status-tampered">
            {err}
          </div>
        )}

        <div className="space-y-4">

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">
              Amount to pay (NPR)
            </label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={busy}
              placeholder="0"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15
                         disabled:opacity-60 tabular-nums"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={() => quickAmount('full')}
                disabled={busy}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-border
                           text-text-main hover:border-primary disabled:opacity-60 transition-colors"
              >
                Full · {fmt(due)}
              </button>
              {due > 0 && (
                <button
                  type="button"
                  onClick={() => quickAmount('half')}
                  disabled={busy}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-border
                             text-text-main hover:border-primary disabled:opacity-60 transition-colors"
                >
                  Half · {fmt(Math.round(due / 2))}
                </button>
              )}
              <button
                type="button"
                onClick={() => quickAmount('clear')}
                disabled={busy}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-border
                           text-text-muted hover:text-text-main disabled:opacity-60 transition-colors"
              >
                Clear
              </button>
            </div>

            {isPartial && (
              <p className="text-[11px] text-status-pending mt-2">
                Partial payment — {fmt(due - amt)} will remain due
              </p>
            )}
            {isAdvance && (
              <p className="text-[11px] text-secondary mt-2">
                Advance payment — {fmt(credit)} will be kept as credit for future terms
              </p>
            )}
          </div>

          {/* Method */}
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">
              Payment method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['eSewa', 'Khalti', 'Bank transfer', 'Cash', 'Cheque', 'Bank slip'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  disabled={busy}
                  className={`rounded-lg border px-3 py-2.5 text-[11px] font-medium transition-colors ${
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

          {/* Method-specific hint */}
          {isOffline ? (
            <div className="bg-status-pending/5 border border-status-pending/20 rounded-xl px-4 py-3">
              <p className="text-[11px] text-status-pending font-semibold">
                Offline payment
              </p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                This creates a <strong>pending receipt</strong>. Once you physically pay
                at the accounts office and the accountant confirms, your invoices will
                be marked paid. You can view the pending receipt immediately.
              </p>
            </div>
          ) : (
            <div className="bg-primary-subtle/40 border border-primary-light rounded-xl px-4 py-3">
              <p className="text-[11px] text-primary font-semibold">Instant online payment</p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                On success, invoices are updated immediately and a receipt is generated.
                This is a mock payment — no money is transferred.
              </p>
            </div>
          )}

          {/* Actions */}
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
              disabled={!canSubmit}
              className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                         text-xs font-semibold px-5 py-2 disabled:opacity-60 transition-colors"
            >
              {busy ? 'Processing…' : `Pay ${amt > 0 ? fmt(amt) : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Due countdown banner ─────────────────────────────── */

function DueCountdownBanner({ invoices }) {
  const unpaid = (invoices || []).filter((i) => i.status !== 'PAID' && i.due_date);
  if (unpaid.length === 0) return null;

  const earliest = unpaid.reduce((min, i) =>
    new Date(i.due_date) < new Date(min.due_date) ? i : min
  );
  const dueMs = new Date(earliest.due_date).getTime() - Date.now();
  const days = Math.ceil(dueMs / (1000 * 60 * 60 * 24));
  const isOverdue = days < 0;
  const isUrgent = days >= 0 && days <= 5;

  // Skip if too far away (more than 30 days)
  if (!isOverdue && days > 30) return null;

  const tone = isOverdue
    ? 'bg-status-tampered/5 border-status-tampered/20 text-status-tampered'
    : isUrgent
      ? 'bg-status-pending/5 border-status-pending/20 text-status-pending'
      : 'bg-primary-subtle/40 border-primary-light text-primary';

  return (
    <div className={`rounded-xl border px-4 py-3 ${tone}`}>
      <p className="text-xs font-semibold">
        {isOverdue
          ? `Payment overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`
          : days === 0
            ? 'Payment due today'
            : `Due in ${days} day${days === 1 ? '' : 's'}`}
      </p>
      <p className="text-[11px] mt-0.5 opacity-90">
        Earliest deadline: {fmtDate(earliest.due_date)} · {earliest.fee_head}
      </p>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

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

  useEffect(() => {
    load();
  }, []);

  const adjustments = data?.adjustments || [];
  const adjTotals = data?.adjustmentTotals || { FINE: 0, DISCOUNT: 0, ADDITIONAL: 0 };
  const netDue = data?.netDue ?? data?.totalDue ?? 0;
  const termLabel = data?.invoices?.[0]?.term || 'Current Term';
  const hasAdjustments = adjustments.length > 0;

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

          {/* Due countdown banner */}
          <DueCountdownBanner invoices={data.invoices} />

          {/* Adjustment summary strip */}
          {hasAdjustments && (
            <section className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <h2 className="text-sm font-bold text-text-main">Fee adjustments</h2>
                  <p className="text-xs text-text-muted">
                    Fines, discounts, and additional charges applied by the accounts office
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-background border border-border rounded-lg px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Fines</p>
                  <p className="text-sm font-bold text-status-tampered mt-0.5">{fmt(adjTotals.FINE || 0)}</p>
                </div>
                <div className="bg-background border border-border rounded-lg px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Discounts</p>
                  <p className="text-sm font-bold text-status-verified mt-0.5">{fmt(adjTotals.DISCOUNT || 0)}</p>
                </div>
                <div className="bg-background border border-border rounded-lg px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Additional</p>
                  <p className="text-sm font-bold text-status-pending mt-0.5">{fmt(adjTotals.ADDITIONAL || 0)}</p>
                </div>
              </div>

              <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {adjustments.slice(0, 4).map((a) => (
                  <li key={a.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${ADJ_CHIP[a.type]}`}>
                        {ADJ_LABEL[a.type]}
                      </span>
                      <span className="text-xs text-text-muted truncate">
                        {a.reason || 'Fee adjustment'} · {fmtDate(a.created_at)}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold tabular-nums shrink-0 ${
                      a.type === 'DISCOUNT' ? 'text-status-verified' : 'text-status-tampered'
                    }`}>
                      {a.type === 'DISCOUNT' ? '−' : '+'} {fmt(a.amount)}
                    </span>
                  </li>
                ))}
                {adjustments.length > 4 && (
                  <li className="px-4 py-2 text-center text-[11px] text-text-muted">
                    +{adjustments.length - 4} more
                  </li>
                )}
              </ul>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Fee structure */}
            <section className="bg-surface border border-border rounded-2xl overflow-hidden lg:col-span-2">
              <header className="px-5 py-4 border-b border-border">
<h2 className="text-sm font-bold text-text-main">Fee structure — {termLabel}</h2>
              </header>

              <table className="w-full text-sm">
                <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="text-left  px-5 py-2.5 font-semibold">Fee head</th>
                    <th className="text-right px-5 py-2.5 font-semibold w-28">Amount</th>
                    <th className="text-right px-5 py-2.5 font-semibold w-24 hidden md:table-cell">Paid</th>
                    <th className="text-right px-5 py-2.5 font-semibold w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                      <td className="px-5 py-3 text-text-main">{inv.fee_head}</td>
                      <td className="px-5 py-3 text-right text-text-main font-medium tabular-nums">
                        {fmt(inv.amount)}
                      </td>
                      <td className="px-5 py-3 text-right hidden md:table-cell text-xs tabular-nums">
                        {Number(inv.amount_paid) > 0 ? (
                          <span className="text-status-verified font-medium">{fmt(inv.amount_paid)}</span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_CHIP[inv.status] || ''}`}>
                          {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.invoices.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-text-muted">
                        No fee invoices on record.
                      </td>
                    </tr>
                  )}
                </tbody>
                {data.invoices.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border bg-background">
                      <td colSpan={2} className="px-5 py-3 text-sm font-bold text-text-main">
                        Net amount due
                      </td>
                      <td colSpan={2} className="px-5 py-3 text-right text-sm font-bold text-primary tabular-nums">
                        {fmt(netDue)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </section>

            {/* Pay online — FIXED */}
            <section className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-sm font-bold text-text-main">Pay fees</h2>
              <p className="text-xs text-text-muted mt-0.5">Online or at the counter</p>

              <div className="mt-5 space-y-4">
                <div className="bg-background border border-border rounded-lg px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Amount due</p>
                  <p className="text-lg font-bold text-primary mt-0.5 tabular-nums">{fmt(netDue)}</p>
                  <p className="text-[11px] text-text-muted mt-1">
                    Pay any amount — partial, full, advance, or offline
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPayOpen(true)}
                  className="w-full rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-active
                             text-text-inverse text-xs font-semibold py-2.5 transition-colors"
                >
                  {netDue > 0 ? 'Make a payment' : 'Pay advance / offline'}
                </button>

                <p className="text-[11px] text-text-muted leading-relaxed">
                  Choose eSewa, Khalti, Bank transfer, Cash, Cheque, or Bank slip.
                  Online payments process instantly; offline payments create a pending
                  receipt for the accounts office to confirm.
                </p>
              </div>
            </section>
          </div>

          {/* Payment history */}
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
                    <th className="text-left  px-5 py-2.5 font-semibold hidden lg:table-cell">Type</th>
                    <th className="text-left  px-5 py-2.5 font-semibold">Status</th>
                    <th className="text-right px-5 py-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.receipts.map((r) => {
                    const ptype = inferPaymentType(r, data.invoices, data.receipts);
                    return (
                      <tr key={r.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-text-main">{r.receipt_number}</td>
                        <td className="px-5 py-3 text-text-muted hidden md:table-cell">{fmtDate(r.created_at)}</td>
                        <td className="px-5 py-3 text-right text-text-main font-medium tabular-nums">
                          {fmt(r.amount)}
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden lg:table-cell">
                          {r.payment_method || '—'}
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell">
                          <PaymentTypeBadge type={ptype} />
                        </td>
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
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

        </div>
      )}

      <PayModal
        open={payOpen}
        total={netDue}
        onClose={() => setPayOpen(false)}
        onPaid={(res) => {
          setPayOpen(false);
          navigate(`/student/fees/receipts/${res.receiptId}`);
        }}
      />
    </DashboardLayout>
  );
}