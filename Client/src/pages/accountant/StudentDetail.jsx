import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import {
  getStudentDetail,
  createAdjustment,
  deleteAdjustment
} from '../../api/accountant.js';
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

function initialsOf(name) {
  if (!name) return 'ST';
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

const STATUS_CHIP = {
  UNPAID:  'bg-status-tampered/10 text-status-tampered',
  PARTIAL: 'bg-status-pending/10 text-status-pending',
  PAID:    'bg-status-verified/10 text-status-verified'
};

const STATUS_LABEL = {
  UNPAID:  'Unpaid',
  PARTIAL: 'Partial',
  PAID:    'Paid'
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

/* ─── Add adjustment modal ───────────────────────────────── */

function AddAdjustmentModal({ student, invoices, onClose, onSaved }) {
  const [form, setForm] = useState({
    type: 'FINE',
    amount: '',
    reason: '',
    applies_to_invoice_id: ''
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const unpaidInvoices = (invoices || []).filter(
    (i) => i.status !== 'PAID'
  );

  async function submit(e) {
    e.preventDefault();
    setErr('');
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return setErr('Amount must be positive');

    setBusy(true);
    try {
      await createAdjustment({
        student_id: student.id,
        type: form.type,
        amount: amt,
        reason: form.reason.trim() || null,
        applies_to_invoice_id: form.applies_to_invoice_id
          ? Number(form.applies_to_invoice_id)
          : null
      });
      onSaved();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to save');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">Add fee adjustment</h3>
            <p className="text-xs text-text-muted mt-0.5">{student.full_name}</p>
          </div>
          <button onClick={onClose} disabled={busy} className="text-text-muted hover:text-text-main text-lg leading-none">×</button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-3 py-2 text-xs text-status-tampered">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'FINE',       label: 'Fine' },
                { value: 'DISCOUNT',   label: 'Discount' },
                { value: 'ADDITIONAL', label: 'Additional' }
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    form.type === t.value
                      ? 'border-primary bg-primary-subtle text-primary'
                      : 'border-border text-text-main hover:border-primary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-text-muted mt-1.5">
              {form.type === 'FINE' && 'Adds to what the student owes (e.g. late fee).'}
              {form.type === 'DISCOUNT' && 'Reduces what the student owes (e.g. scholarship).'}
              {form.type === 'ADDITIONAL' && 'Extra charge (e.g. exam retake, lost book).'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Amount (NPR)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="500"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">
              Applies to <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <select
              value={form.applies_to_invoice_id}
              onChange={(e) => setForm({ ...form, applies_to_invoice_id: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary"
            >
              <option value="">Whole account (no specific invoice)</option>
              {unpaidInvoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.fee_head} · {fmt(i.amount - i.amount_paid)} due
                </option>
              ))}
            </select>
            <p className="text-[11px] text-text-muted mt-1">
              Leave blank to apply to the student's overall balance.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">
              Reason <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Late fee, Scholarship, Lab damage"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={busy}
              className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2
                         hover:bg-background disabled:opacity-60 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold
                         px-5 py-2 disabled:opacity-60 transition-colors">
              {busy ? 'Saving…' : 'Add adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function AccountantStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, retry } = useFetch(() => getStudentDetail(id), [id]);
  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });

  const student = data?.student;
  const totals = data?.totals;
  const adjustments = data?.adjustments || [];

  async function handleDeleteAdjustment(adjId) {
    if (!window.confirm('Remove this adjustment?')) return;
    setDeletingId(adjId);
    try {
      await deleteAdjustment(adjId);
      setToast({ type: 'success', msg: 'Adjustment removed' });
      retry();
    } catch (e) {
      setToast({ type: 'error', msg: e.response?.data?.message || 'Failed to remove' });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardLayout
      pageTitle="Student fee detail"
      pageSubtitle={student ? `${student.full_name} · ${student.class_name || 'No class'}` : 'Loading…'}
    >
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-primary hover:text-primary-active font-medium"
        >
          ← Back
        </button>

        <Link
          to={`/accountant/students/${id}/statement`}
          className="rounded-lg border border-border bg-surface text-text-main text-xs font-medium
                     px-3.5 py-2 hover:bg-background transition-colors inline-flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Statement of account
        </Link>
      </div>

      {toast.msg && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
          toast.type === 'success'
            ? 'border-status-verified/30 bg-status-verified/5 text-status-verified'
            : 'border-status-tampered/30 bg-status-tampered/5 text-status-tampered'
        }`}>
          {toast.msg}
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          <SkeletonCard lines={4} />
          <SkeletonTable rows={4} cols={4} />
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Couldn't load student" message={error} onRetry={retry} />
      )}

      {!loading && !error && data && (
        <div className="space-y-6">

          {/* Identity + totals */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="p-5 flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-primary text-text-inverse grid place-items-center text-base font-bold shrink-0">
                {initialsOf(student.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-text-main truncate">{student.full_name}</h1>
                <p className="text-xs text-text-muted mt-0.5">
                  {student.school_id_number} · {student.class_name || 'No class'}
                  {student.roll_number ? ` · Roll ${student.roll_number}` : ''}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">{student.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-border">
              <div className="p-4 sm:border-r border-border">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Total invoiced</p>
                <p className="text-lg font-bold text-text-main mt-1">{fmt(totals.invoiced)}</p>
              </div>
              <div className="p-4 sm:border-r border-border">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Total paid</p>
                <p className="text-lg font-bold text-status-verified mt-1">{fmt(totals.paid)}</p>
              </div>
              <div className="p-4 sm:border-r border-border">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Adjustments</p>
                <p className="text-lg font-bold text-text-main mt-1">
                  {fmt((data.adjustmentTotals?.FINE || 0) + (data.adjustmentTotals?.ADDITIONAL || 0) - (data.adjustmentTotals?.DISCOUNT || 0))}
                </p>
              </div>
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Net outstanding</p>
                <p className={`text-lg font-bold mt-1 ${
                  totals.outstanding > 0 ? 'text-status-pending' : 'text-text-muted'
                }`}>
                  {fmt(totals.outstanding)}
                </p>
              </div>
            </div>
          </section>

          {/* Fee adjustments */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-text-main">Fee adjustments</h2>
                <p className="text-xs text-text-muted">
                  {adjustments.length} record{adjustments.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                onClick={() => setAddOpen(true)}
                className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                           text-xs font-semibold px-3.5 py-2 transition-colors"
              >
                + Add adjustment
              </button>
            </header>

            {adjustments.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-text-muted">
                  No fines, discounts, or additional fees applied yet.
                </p>
              </div>
            ) : (
              <>
                {/* Totals strip */}
                <div className="grid grid-cols-3 border-b border-border">
                  <div className="p-4 text-center border-r border-border">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Fines</p>
                    <p className="text-sm font-bold text-status-tampered mt-1">
                      {fmt(data.adjustmentTotals?.FINE || 0)}
                    </p>
                  </div>
                  <div className="p-4 text-center border-r border-border">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Discounts</p>
                    <p className="text-sm font-bold text-status-verified mt-1">
                      {fmt(data.adjustmentTotals?.DISCOUNT || 0)}
                    </p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Additional</p>
                    <p className="text-sm font-bold text-status-pending mt-1">
                      {fmt(data.adjustmentTotals?.ADDITIONAL || 0)}
                    </p>
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="text-left  px-5 py-2.5 font-semibold">Type</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden md:table-cell">Reason</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Amount</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden lg:table-cell">Added by</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden xl:table-cell">Date</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustments.map((a) => (
                      <tr key={a.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${ADJ_CHIP[a.type]}`}>
                            {ADJ_LABEL[a.type]}
                          </span>
                        </td>
<td className="px-5 py-3 text-text-muted hidden md:table-cell text-xs">
  {a.reason || '—'}
  {a.invoice_fee_head && (
    <span className="block text-[10px] text-primary mt-0.5">
      → {a.invoice_fee_head}
    </span>
  )}
</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`font-semibold tabular-nums ${
                            a.type === 'DISCOUNT' ? 'text-status-verified' : 'text-status-tampered'
                          }`}>
                            {a.type === 'DISCOUNT' ? '−' : '+'} {fmt(a.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden lg:table-cell text-xs">
                          {a.created_by_name || '—'}
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden xl:table-cell text-xs">
                          {fmtDate(a.created_at)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteAdjustment(a.id)}
                            disabled={deletingId === a.id}
                            className="text-xs font-medium text-status-tampered hover:underline disabled:opacity-50"
                          >
                            {deletingId === a.id ? '…' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>

          {/* Invoices */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-text-main">Fee invoices</h2>
                <p className="text-xs text-text-muted">
                  {data.invoices.length} entr{data.invoices.length === 1 ? 'y' : 'ies'}
                </p>
              </div>
              <ExportButton
                filename={`invoices-${student.school_id_number}-${todayStamp()}.csv`}
                rows={data.invoices}
                columns={[
                  { key: 'term',        label: 'Term' },
                  { key: 'fee_head',    label: 'Fee head' },
                  { key: 'amount',      label: 'Amount' },
                  { key: 'amount_paid', label: 'Paid' },
                  { key: 'due_date',    label: 'Due date' },
                  { key: 'status',      label: 'Status' }
                ]}
              />
            </header>

            {data.invoices.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">
                No invoices for this student yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="text-left  px-5 py-2.5 font-semibold">Fee head</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden md:table-cell">Term</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Amount</th>
                      <th className="text-right px-5 py-2.5 font-semibold hidden md:table-cell">Paid</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden lg:table-cell">Due</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.map((i) => (
                      <tr key={i.id} className="border-t border-border">
                        <td className="px-5 py-3 text-text-main">{i.fee_head}</td>
                        <td className="px-5 py-3 text-text-muted hidden md:table-cell text-xs">{i.term}</td>
                        <td className="px-5 py-3 text-right text-text-main font-medium tabular-nums">
                          {fmt(i.amount)}
                        </td>
                        <td className="px-5 py-3 text-right hidden md:table-cell text-xs tabular-nums">
                          {Number(i.amount_paid) > 0 ? (
                            <span className="text-status-verified font-medium">{fmt(i.amount_paid)}</span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden lg:table-cell text-xs">
                          {fmtDate(i.due_date)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            STATUS_CHIP[i.status] || ''
                          }`}>
                            {STATUS_LABEL[i.status] || i.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Receipts */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-text-main">Payment history</h2>
                <p className="text-xs text-text-muted">
                  {data.receipts.length} record{data.receipts.length === 1 ? '' : 's'}
                </p>
              </div>
              <ExportButton
                filename={`payments-${student.school_id_number}-${todayStamp()}.csv`}
                rows={data.receipts}
                columns={[
                  { key: 'receipt_number', label: 'Receipt no.' },
                  { key: 'amount',         label: 'Amount' },
                  { key: 'payment_method', label: 'Method' },
                  { key: 'payment_status', label: 'Status' },
                  { key: 'created_at',     label: 'Date' }
                ]}
              />
            </header>

            {data.receipts.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">
                No payments recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[680px]">
                  <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="text-left  px-5 py-2.5 font-semibold">Receipt no.</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Amount</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden md:table-cell">Method</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden lg:table-cell">Recorded by</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden xl:table-cell">Date</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.receipts.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-text-main">{r.receipt_number}</td>
                        <td className="px-5 py-3 text-right text-text-main font-medium tabular-nums">
                          {fmt(r.amount)}
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden md:table-cell text-xs">
                          {r.payment_method || '—'}
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden lg:table-cell text-xs">
                          {r.recorded_by_name || '—'}
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden xl:table-cell text-xs">
                          {fmtDateTime(r.created_at)}
                        </td>
                        <td className="px-5 py-3 text-right">
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
                </table>
              </div>
            )}
          </section>

        </div>
      )}

{addOpen && student && (
  <AddAdjustmentModal
    student={student}
    invoices={data.invoices}
    onClose={() => setAddOpen(false)}
    onSaved={() => {
      setAddOpen(false);
      setToast({ type: 'success', msg: 'Adjustment added' });
      retry();
    }}
  />
)}
    </DashboardLayout>
  );
}