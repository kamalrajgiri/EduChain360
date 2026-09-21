import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import {
  getInvoices,
  updateInvoice,
  remindStudent,
  getClasses,
  bulkInvoiceAction
} from '../../api/accountant.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ExportButton from '../../components/ExportButton.jsx';
import { todayStamp } from '../../utils/csv.js';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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

const AGING_OPTIONS = [
  { value: '',       label: 'All ages' },
  { value: '0-30',   label: '0–30 days' },
  { value: '31-60',  label: '31–60 days' },
  { value: '61-90',  label: '61–90 days' },
  { value: '90+',    label: '90+ days' }
];

/* ─── Edit modal ─────────────────────────────────────────── */

function EditInvoiceModal({ invoice, onClose, onSaved }) {
  const [form, setForm] = useState({
    fee_head: invoice.fee_head,
    amount: String(invoice.amount),
    due_date: invoice.due_date ? String(invoice.due_date).slice(0, 10) : ''
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    const amt = Number(form.amount);
    if (amt <= 0) return setErr('Amount must be positive');
    if (amt < Number(invoice.amount_paid)) {
      return setErr(`Amount cannot be less than already paid (${fmt(invoice.amount_paid)})`);
    }

    setBusy(true);
    try {
      await updateInvoice(invoice.id, {
        fee_head: form.fee_head.trim(),
        amount: amt,
        due_date: form.due_date || null
      });
      onSaved();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to update');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">Edit invoice</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {invoice.student_name} · {invoice.fee_head}
            </p>
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
            <label className="block text-xs font-semibold text-text-main mb-1.5">Fee head</label>
            <input
              type="text"
              value={form.fee_head}
              onChange={(e) => setForm({ ...form, fee_head: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Amount (NPR)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary"
            />
            {Number(invoice.amount_paid) > 0 && (
              <p className="text-[11px] text-text-muted mt-1">
                Already paid: {fmt(invoice.amount_paid)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Due date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary"
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
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Cancel confirmation ─────────────────────────────────── */

function CancelInvoiceModal({ invoice, onClose, onCancelled }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function confirm() {
    setBusy(true);
    setErr('');
    try {
      await updateInvoice(invoice.id, { cancel: true });
      onCancelled();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to cancel');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6">
        <div className="h-10 w-10 rounded-lg bg-status-tampered/10 text-status-tampered grid place-items-center mb-3">
          <span className="text-lg font-bold">!</span>
        </div>
        <h3 className="text-sm font-bold text-text-main">Cancel this invoice?</h3>
        <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
          <span className="font-semibold text-text-main">{invoice.fee_head}</span> for{' '}
          <span className="font-semibold text-text-main">{invoice.student_name}</span> ({fmt(invoice.amount)})
          will be removed. If any amount has been paid, contact support first.
        </p>

        {err && (
          <div className="mt-3 rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-3 py-2 text-xs text-status-tampered">
            {err}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} disabled={busy}
            className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2
                       hover:bg-background disabled:opacity-60 transition-colors">
            Keep invoice
          </button>
          <button onClick={confirm} disabled={busy}
            className="rounded-lg bg-status-tampered text-text-inverse text-xs font-semibold px-5 py-2
                       disabled:opacity-60 transition-colors">
            {busy ? 'Cancelling…' : 'Yes, cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Bulk confirm modal ──────────────────────────────────── */

function BulkConfirmModal({ count, action, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function confirm() {
    setBusy(true);
    setErr('');
    try {
      await onConfirm();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed');
      setBusy(false);
    }
  }

  const isDestructive = action === 'cancel';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6">
        <div className={`h-10 w-10 rounded-lg grid place-items-center mb-3 ${
          isDestructive ? 'bg-status-tampered/10 text-status-tampered' : 'bg-primary-subtle text-primary'
        }`}>
          <span className="text-lg font-bold">{isDestructive ? '!' : '✓'}</span>
        </div>
        <h3 className="text-sm font-bold text-text-main">
          {isDestructive ? `Cancel ${count} invoice${count === 1 ? '' : 's'}?` : `Send ${count} reminder${count === 1 ? '' : 's'}?`}
        </h3>
        <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
          {isDestructive
            ? `This will delete ${count} unpaid/partial invoice${count === 1 ? '' : 's'}. Paid invoices are skipped. This action cannot be silently undone.`
            : `One private notice will be sent to each student who owns these invoices. Only they will see it.`}
        </p>

        {err && (
          <div className="mt-3 rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-3 py-2 text-xs text-status-tampered">
            {err}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} disabled={busy}
            className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2
                       hover:bg-background disabled:opacity-60 transition-colors">
            Cancel
          </button>
          <button onClick={confirm} disabled={busy}
            className={`rounded-lg text-text-inverse text-xs font-semibold px-5 py-2
                       disabled:opacity-60 transition-colors ${
              isDestructive ? 'bg-status-tampered' : 'bg-primary hover:bg-primary-hover'
            }`}>
            {busy ? 'Working…' : isDestructive ? 'Yes, cancel all' : 'Send reminders'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function AccountantInvoices() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get('status') || '';
  const initialAging  = searchParams.get('aging')  || '';

  const [status, setStatus] = useState(initialStatus);
  const [aging,  setAging]  = useState(initialAging);
  const [classId, setClassId] = useState('');
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [editInvoice, setEditInvoice] = useState(null);
  const [cancelInvoice, setCancelInvoice] = useState(null);
  const [remindingId, setRemindingId] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });

  const classesFetch = useFetch(() => getClasses(), []);

  const invoicesFetch = useFetch(
    () => getInvoices({ status, aging, class_id: classId, q, limit: 200 }),
    [status, aging, classId, q]
  );

  // Sync URL params (shareable links)
  useEffect(() => {
    const params = new URLSearchParams();
    if (status)  params.set('status', status);
    if (aging)   params.set('aging', aging);
    if (classId) params.set('class_id', classId);
    if (q)       params.set('q', q);
    setSearchParams(params, { replace: true });
  }, [status, aging, classId, q, setSearchParams]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [status, aging, classId, q]);

  useEffect(() => {
    if (!toast.msg) return;
    const t = setTimeout(() => setToast({ type: '', msg: '' }), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const data = invoicesFetch.data;
  const rows = data?.rows || [];

  const selectableRows = useMemo(
    () => rows.filter((r) => r.status === 'UNPAID' || r.status === 'PARTIAL'),
    [rows]
  );

  const allSelectableSelected =
    selectableRows.length > 0 &&
    selectableRows.every((r) => selectedIds.has(r.id));

  function toggleSelectAll() {
    if (allSelectableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableRows.map((r) => r.id)));
    }
  }

  function toggleOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleSearch(e) {
    e.preventDefault();
    setQ(searchInput.trim());
  }

  async function handleRemind(inv) {
    setRemindingId(inv.id);
    try {
      await remindStudent(inv.student_id);
      setToast({ type: 'success', msg: `Private reminder sent to ${inv.student_name}` });
    } catch (e) {
      setToast({ type: 'error', msg: e.response?.data?.message || 'Failed to send reminder' });
    } finally {
      setRemindingId(null);
    }
  }

  async function handleBulkConfirm() {
    const ids = Array.from(selectedIds);
    const res = await bulkInvoiceAction(ids, bulkAction);
    setToast({ type: 'success', msg: res.message || 'Done' });
    setBulkAction(null);
    clearSelection();
    invoicesFetch.retry();
  }

  const summary = useMemo(() => {
    const unpaid = rows.filter((r) => r.status === 'UNPAID');
    const partial = rows.filter((r) => r.status === 'PARTIAL');
    const overdue = rows.filter((r) => r.status !== 'PAID' && r.days_overdue > 0);
    const outstandingAmount = [...unpaid, ...partial].reduce(
      (s, r) => s + (Number(r.amount) - Number(r.amount_paid)), 0
    );
    const overdueAmount = overdue.reduce(
      (s, r) => s + (Number(r.amount) - Number(r.amount_paid)), 0
    );
    return {
      unpaidCount: unpaid.length,
      partialCount: partial.length,
      overdueCount: overdue.length,
      outstandingAmount,
      overdueAmount
    };
  }, [rows]);

  const selectedCount = selectedIds.size;

  return (
    <DashboardLayout
      pageTitle="Invoices"
      pageSubtitle="All student fee invoices across classes"
    >
      {toast.msg && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
          toast.type === 'success'
            ? 'border-status-verified/30 bg-status-verified/5 text-status-verified'
            : 'border-status-tampered/30 bg-status-tampered/5 text-status-tampered'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-surface border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Unpaid</p>
          <p className="text-lg font-bold text-status-tampered mt-0.5">{summary.unpaidCount}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Partial</p>
          <p className="text-lg font-bold text-status-pending mt-0.5">{summary.partialCount}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Overdue</p>
          <p className="text-lg font-bold text-status-tampered mt-0.5">{summary.overdueCount}</p>
          <p className="text-[10px] text-text-muted mt-0.5">{fmt(summary.overdueAmount)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Outstanding</p>
          <p className="text-lg font-bold text-primary mt-0.5">{fmt(summary.outstandingAmount)}</p>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="bg-primary-dark text-text-inverse rounded-2xl px-4 py-3 mb-5
                        flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs">
            <span className="font-bold">{selectedCount}</span> invoice{selectedCount === 1 ? '' : 's'} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkAction('remind')}
              className="rounded-lg bg-white/10 hover:bg-white/20 text-text-inverse
                         text-xs font-medium px-3.5 py-2 transition-colors"
              title="One private notice will be sent to each student"
            >
              Send private reminders
            </button>
            <button
              onClick={() => setBulkAction('cancel')}
              className="rounded-lg bg-status-tampered hover:bg-status-tampered/90 text-text-inverse
                         text-xs font-semibold px-3.5 py-2 transition-colors"
            >
              Cancel invoices
            </button>
            <button
              onClick={clearSelection}
              className="text-xs text-primary-light hover:text-text-inverse px-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-5 space-y-3">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: '',        label: 'All' },
            { value: 'UNPAID',  label: 'Unpaid' },
            { value: 'PARTIAL', label: 'Partial' },
            { value: 'PAID',    label: 'Paid' }
          ].map((tab) => (
            <button
              key={tab.value || 'all'}
              onClick={() => setStatus(tab.value)}
              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                status === tab.value
                  ? 'bg-primary text-text-inverse'
                  : 'bg-background border border-border text-text-main hover:border-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Aging + class + search + export */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <select
            value={aging}
            onChange={(e) => setAging(e.target.value)}
            disabled={status === 'PAID'}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs
                       text-text-main focus:outline-none focus:border-primary disabled:opacity-50"
          >
            {AGING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs
                       text-text-main focus:outline-none focus:border-primary"
          >
            <option value="">All classes</option>
            {(classesFetch.data || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.student_count})
              </option>
            ))}
          </select>

          <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-[240px]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search student name, ID, or fee head..."
              className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2 text-xs
                         text-text-main placeholder:text-text-muted/60
                         focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button type="submit"
              className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                         text-xs font-semibold px-4 py-2 transition-colors">
              Search
            </button>
          </form>

          <ExportButton
            label="Export CSV"
            filename={`invoices-${todayStamp()}.csv`}
            rows={rows}
            columns={[
              { key: 'student_name',    label: 'Student' },
              { key: 'school_id_number',label: 'Student ID' },
              { key: 'class_name',      label: 'Class' },
              { key: 'term',            label: 'Term' },
              { key: 'fee_head',        label: 'Fee head' },
              { key: 'amount',          label: 'Amount' },
              { key: 'amount_paid',     label: 'Paid' },
              { key: 'due_date',        label: 'Due date' },
              { key: 'status',          label: 'Status' },
              { key: 'days_overdue',    label: 'Days overdue' }
            ]}
          />
        </div>
      </div>

      {invoicesFetch.loading && <SkeletonTable rows={8} cols={7} />}

      {!invoicesFetch.loading && invoicesFetch.error && (
        <ErrorState title="Couldn't load invoices" message={invoicesFetch.error} onRetry={invoicesFetch.retry} />
      )}

      {!invoicesFetch.loading && !invoicesFetch.error && rows.length === 0 && (
        <EmptyState
          icon="🧾"
          title="No invoices match your filters"
          message="Try a different status, aging bucket, or clear the search."
          actionLabel="Reset filters"
          actionOnClick={() => { setStatus(''); setAging(''); setClassId(''); setQ(''); setSearchInput(''); }}
        />
      )}

      {!invoicesFetch.loading && !invoicesFetch.error && rows.length > 0 && (
        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-main">Invoices</h2>
            <p className="text-xs text-text-muted">
              {data.total} record{data.total === 1 ? '' : 's'}
              {rows.length < data.total && ` · showing first ${rows.length}`}
            </p>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={allSelectableSelected}
                      onChange={toggleSelectAll}
                      disabled={selectableRows.length === 0}
                      className="rounded border-border"
                      aria-label="Select all selectable invoices"
                    />
                  </th>
                  <th className="text-left  px-4 py-2.5 font-semibold">Student</th>
                  <th className="text-left  px-4 py-2.5 font-semibold hidden lg:table-cell">Class</th>
                  <th className="text-left  px-4 py-2.5 font-semibold">Fee head</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Amount</th>
                  <th className="text-right px-4 py-2.5 font-semibold hidden md:table-cell">Paid</th>
                  <th className="text-left  px-4 py-2.5 font-semibold hidden xl:table-cell">Due</th>
                  <th className="text-left  px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((inv) => {
                  const remaining = Number(inv.amount) - Number(inv.amount_paid);
                  const isOverdue = inv.status !== 'PAID' && inv.days_overdue > 0;
                  const canSelect = inv.status === 'UNPAID' || inv.status === 'PARTIAL';
                  const isSelected = selectedIds.has(inv.id);
                  return (
                    <tr
                      key={inv.id}
                      className={`border-t border-border transition-colors ${
                        isSelected ? 'bg-primary-subtle/60' : 'hover:bg-primary-subtle/40'
                      }`}
                    >
                      <td className="px-4 py-3">
                        {canSelect ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(inv.id)}
                            className="rounded border-border"
                            aria-label={`Select invoice ${inv.id}`}
                          />
                        ) : (
                          <span className="inline-block w-4 h-4" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/accountant/students/${inv.student_id}`)}
                          className="text-left hover:text-primary transition-colors"
                        >
                          <p className="text-text-main font-medium truncate max-w-[160px]">{inv.student_name}</p>
                          <p className="text-[10px] text-text-muted font-mono">{inv.school_id_number}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-text-muted hidden lg:table-cell text-xs">
                        {inv.class_name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-text-main text-xs">{inv.fee_head}</p>
                        <p className="text-[10px] text-text-muted">{inv.term}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-text-main font-medium tabular-nums">
                        {fmt(inv.amount)}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-xs tabular-nums">
                        {Number(inv.amount_paid) > 0 ? (
                          <span className="text-status-verified font-medium">{fmt(inv.amount_paid)}</span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-xs">
                        <p className="text-text-muted">{fmtDate(inv.due_date)}</p>
                        {isOverdue && (
                          <p className="text-[10px] text-status-tampered font-medium mt-0.5">
                            {inv.days_overdue}d overdue
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CHIP[inv.status] || ''}`}>
                          {STATUS_LABEL[inv.status] || inv.status}
                        </span>
                        {remaining > 0 && inv.status === 'PARTIAL' && (
                          <p className="text-[10px] text-text-muted mt-0.5">{fmt(remaining)} left</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {inv.status !== 'PAID' ? (
                            <>
                              <button
                                onClick={() => setEditInvoice(inv)}
                                className="text-[11px] font-medium text-primary hover:text-primary-active"
                                title="Edit amount, fee head, or due date"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleRemind(inv)}
                                disabled={remindingId === inv.id}
                                className="text-[11px] font-medium text-secondary hover:text-secondary-hover disabled:opacity-50"
                                title="Send a private reminder to this student only"
                              >
                                {remindingId === inv.id ? '…' : 'Remind'}
                              </button>
                              <button
                                onClick={() => setCancelInvoice(inv)}
                                className="text-[11px] font-medium text-status-tampered hover:underline"
                                title="Delete this unpaid invoice"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => navigate(`/accountant/students/${inv.student_id}`)}
                              className="text-[11px] font-medium text-primary hover:text-primary-active"
                              title="Open this student's fee detail"
                            >
                              Student →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {editInvoice && (
        <EditInvoiceModal
          invoice={editInvoice}
          onClose={() => setEditInvoice(null)}
          onSaved={() => {
            setEditInvoice(null);
            invoicesFetch.retry();
            setToast({ type: 'success', msg: 'Invoice updated' });
          }}
        />
      )}

      {cancelInvoice && (
        <CancelInvoiceModal
          invoice={cancelInvoice}
          onClose={() => setCancelInvoice(null)}
          onCancelled={() => {
            setCancelInvoice(null);
            invoicesFetch.retry();
            setToast({ type: 'success', msg: 'Invoice cancelled' });
          }}
        />
      )}

      {bulkAction && (
        <BulkConfirmModal
          count={selectedCount}
          action={bulkAction}
          onClose={() => setBulkAction(null)}
          onConfirm={handleBulkConfirm}
        />
      )}
    </DashboardLayout>
  );
}