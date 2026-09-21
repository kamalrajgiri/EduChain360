import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getTransactions, confirmReceipt } from '../../api/accountant.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import RecordPaymentModal from './RecordPaymentModal.jsx';
import SendRemindersModal from './SendRemindersModal.jsx';
import { downloadCSV, todayStamp } from '../../utils/csv.js';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

const METHODS = ['', 'eSewa', 'Khalti', 'Bank transfer', 'Cash', 'Cheque', 'Bank slip'];

function StatusChip({ status, anchored }) {
  if (anchored) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold
                       bg-status-verified/10 text-status-verified">
        <span className="h-1.5 w-1.5 rounded-full bg-status-verified" />
        Verified
      </span>
    );
  }
  const tone = status === 'PAID'
    ? 'bg-status-verified/10 text-status-verified'
    : status === 'PENDING'
      ? 'bg-status-pending/10 text-status-pending'
      : 'bg-status-tampered/10 text-status-tampered';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${tone}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default function AccountantTransactions() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('');
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [recordOpen, setRecordOpen] = useState(false);
  const [remindOpen, setRemindOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirming, setConfirming] = useState(null);   // ← NEW

  const { data, loading, error, retry } = useFetch(
    () => getTransactions({ method, q, limit: 100 }),
    [method, q]
  );

  function handleSearch(e) {
    e.preventDefault();
    setQ(searchInput.trim());
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await getTransactions({ method, q, limit: 10000 });
      downloadCSV(
        `transactions-${todayStamp()}.csv`,
        res.rows,
        [
          { key: 'receipt_number',   label: 'Receipt no.' },
          { key: 'student_name',     label: 'Student' },
          { key: 'school_id_number', label: 'Student ID' },
          { key: 'class_name',       label: 'Class' },
          { key: 'amount',           label: 'Amount' },
          { key: 'payment_method',   label: 'Method' },
          { key: 'payment_status',   label: 'Status' },
          { key: 'created_at',       label: 'Date' }
        ]
      );
    } catch {
      // silent
    } finally {
      setExporting(false);
    }
  }

  // ─── NEW: Confirm a pending offline receipt ────────────
  async function handleConfirm(receipt) {
    const ok = window.confirm(
      `Confirm this offline payment?\n\n` +
      `${receipt.student_name} · ${fmt(receipt.amount)}\n\n` +
      `The receipt will be marked PAID and the student's invoices will be updated.`
    );
    if (!ok) return;

    setConfirming(receipt.id);
    try {
      const res = await confirmReceipt(receipt.id);
      alert(res.message || 'Confirmed');
      retry();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to confirm');
    } finally {
      setConfirming(null);
    }
  }

  return (
    <DashboardLayout
      pageTitle="Fee Collection"
      pageSubtitle="All fee transactions across classes"
    >
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-xs text-text-muted">
          {data ? `${data.total} transaction${data.total === 1 ? '' : 's'} recorded` : 'Loading…'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRemindOpen(true)}
            className="rounded-lg border border-border bg-surface text-text-main text-xs font-medium
                       px-3.5 py-2 hover:bg-background transition-colors"
            title="Send one private reminder to each student with outstanding dues"
          >
            Send bulk reminders
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !data || data.rows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface
                       text-text-main text-xs font-medium px-3.5 py-2
                       hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            onClick={() => setRecordOpen(true)}
            className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                       text-xs font-semibold px-4 py-2.5 transition-colors"
          >
            + Record offline payment
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-5
                      flex flex-col sm:flex-row sm:items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by student name or receipt no..."
            className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2 text-xs
                       text-text-main placeholder:text-text-muted/60
                       focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                       text-xs font-semibold px-4 py-2 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 overflow-x-auto">
          {METHODS.map((m) => (
            <button
              key={m || 'all'}
              onClick={() => setMethod(m)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                method === m
                  ? 'bg-primary text-text-inverse'
                  : 'bg-background border border-border text-text-main hover:border-primary'
              }`}
            >
              {m || 'All methods'}
            </button>
          ))}
        </div>
      </div>

      {loading && <SkeletonTable rows={8} cols={6} />}

      {!loading && error && (
        <ErrorState title="Couldn't load transactions" message={error} onRetry={retry} />
      )}

      {!loading && !error && data && data.rows.length === 0 && (
        <EmptyState
          icon="💳"
          title="No transactions found"
          message={
            q || method
              ? 'Try clearing the filters or searching with a different keyword.'
              : 'Fee payments recorded here will appear in this list.'
          }
          actionLabel={!q && !method ? 'Record first payment' : undefined}
          actionOnClick={!q && !method ? () => setRecordOpen(true) : undefined}
        />
      )}

      {!loading && !error && data && data.rows.length > 0 && (
        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-main">Transactions</h2>
            <p className="text-xs text-text-muted">
              {data.total} record{data.total === 1 ? '' : 's'}
              {data.rows.length < data.total && ` · showing first ${data.rows.length}`}
            </p>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="text-left  px-5 py-2.5 font-semibold">Receipt no.</th>
                  <th className="text-left  px-5 py-2.5 font-semibold">Student</th>
                  <th className="text-left  px-5 py-2.5 font-semibold hidden lg:table-cell">Class</th>
                  <th className="text-right px-5 py-2.5 font-semibold">Amount</th>
                  <th className="text-left  px-5 py-2.5 font-semibold hidden md:table-cell">Method</th>
                  <th className="text-left  px-5 py-2.5 font-semibold">Status</th>
                  <th className="text-left  px-5 py-2.5 font-semibold hidden xl:table-cell">Date</th>
                  <th className="text-right px-5 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-border hover:bg-primary-subtle/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/accountant/receipts/${r.id}`)}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-text-main">{r.receipt_number}</td>
                    <td className="px-5 py-3">
                      <p className="text-text-main font-medium truncate max-w-[180px]">{r.student_name}</p>
                      <p className="text-[10px] text-text-muted font-mono">{r.school_id_number}</p>
                    </td>
                    <td className="px-5 py-3 text-text-muted hidden lg:table-cell text-xs">
                      {r.class_name || '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-text-main font-medium tabular-nums">
                      {fmt(r.amount)}
                    </td>
                    <td className="px-5 py-3 text-text-muted hidden md:table-cell text-xs">
                      {r.payment_method || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusChip status={r.payment_status} anchored={r.is_anchored} />
                    </td>
                    <td className="px-5 py-3 text-text-muted hidden xl:table-cell text-xs">
                      {fmtDateTime(r.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {r.payment_status === 'PENDING' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleConfirm(r); }}
                            disabled={confirming === r.id}
                            className="text-[11px] font-semibold text-status-verified hover:underline disabled:opacity-50"
                            title="Mark offline payment as received and update invoices"
                          >
                            {confirming === r.id ? '…' : 'Confirm'}
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/accountant/receipts/${r.id}`); }}
                          className="text-xs font-medium text-primary hover:text-primary-active"
                        >
                          View →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <RecordPaymentModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        onRecorded={(res) => {
          setRecordOpen(false);
          navigate(`/accountant/receipts/${res.data.receiptId}`);
        }}
      />

      <SendRemindersModal
        open={remindOpen}
        onClose={() => setRemindOpen(false)}
      />
    </DashboardLayout>
  );
}