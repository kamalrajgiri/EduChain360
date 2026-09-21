import { useEffect, useMemo, useState } from 'react';
import { recordPayment, searchStudents, getUnpaidInvoices } from '../../api/accountant.js';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

const METHODS = ['Cash', 'Cheque', 'Bank slip', 'eSewa', 'Khalti', 'Bank transfer'];

/**
 * Given a payment amount and a list of unpaid invoices (sorted oldest first),
 * simulate how the backend will allocate it.
 */
function computeAllocation(invoices, amount) {
  let remaining = Number(amount) || 0;
  const alloc = [];
  let fullyPaid = 0;
  let partiallyPaid = 0;

  for (const inv of invoices) {
    const owed = Number(inv.amount) - Number(inv.amount_paid);
    if (owed <= 0) continue;

    if (remaining <= 0) {
      alloc.push({ ...inv, willPay: 0, statusAfter: inv.status });
      continue;
    }

    if (remaining >= owed) {
      alloc.push({ ...inv, willPay: owed, statusAfter: 'PAID' });
      remaining -= owed;
      fullyPaid++;
    } else {
      alloc.push({ ...inv, willPay: remaining, statusAfter: 'PARTIAL' });
      remaining = 0;
      partiallyPaid++;
    }
  }

  return { alloc, fullyPaid, partiallyPaid, unallocated: remaining };
}

export default function RecordPaymentModal({ open, onClose, onRecorded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);

  const [unpaid, setUnpaid] = useState([]);
  const [loadingUnpaid, setLoadingUnpaid] = useState(false);

  const [form, setForm] = useState({ amount: '', method: 'Cash', notes: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelected(null);
      setUnpaid([]);
      setForm({ amount: '', method: 'Cash', notes: '' });
      setErr('');
    }
  }, [open]);

  // Debounced student search
  useEffect(() => {
    if (!open || selected) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchStudents(trimmed);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open, selected]);

  // Fetch unpaid invoices when a student is selected
  useEffect(() => {
    if (!selected) return;
    setLoadingUnpaid(true);
    (async () => {
      try {
        const res = await getUnpaidInvoices(selected.id);
        setUnpaid(res);
      } catch {
        setUnpaid([]);
      } finally {
        setLoadingUnpaid(false);
      }
    })();
  }, [selected]);

  function pickStudent(s) {
    setSelected(s);
    setForm((f) => ({
      ...f,
      amount: s.dues > 0 ? String(Math.round(Number(s.dues))) : ''
    }));
  }

  // Live allocation preview
  const preview = useMemo(() => {
    if (!unpaid || unpaid.length === 0) return null;
    const amt = Number(form.amount) || 0;
    if (amt <= 0) return null;
    return computeAllocation(unpaid, amt);
  }, [unpaid, form.amount]);

  async function submit(e) {
    e.preventDefault();
    setErr('');

    if (!selected) return setErr('Select a student first');
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return setErr('Amount must be positive');

    setBusy(true);
    try {
      const res = await recordPayment({
        student_id: selected.id,
        amount: amt,
        method: form.method,
        notes: form.notes
      });
      onRecorded(res);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to record payment');
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-xl p-6 my-8">

        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">Record offline payment</h3>
            <p className="text-xs text-text-muted mt-0.5">
              For payments received in person — cash, cheque, or bank slip.
            </p>
          </div>
          <button onClick={onClose} disabled={busy} className="text-text-muted hover:text-text-main text-lg leading-none">×</button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-3 py-2 text-xs text-status-tampered">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">

          {/* Student picker */}
          {!selected && (
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">Student</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or school ID..."
                autoFocus
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                           text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />

              {searching && (
                <p className="text-[11px] text-text-muted mt-2">Searching…</p>
              )}

              {!searching && results.length > 0 && (
                <ul className="mt-2 border border-border rounded-lg overflow-hidden divide-y divide-border max-h-60 overflow-y-auto">
                  {results.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => pickStudent(s)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-primary-subtle/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-text-main truncate">{s.full_name}</p>
                            <p className="text-[10px] text-text-muted">
                              {s.school_id_number} · {s.class_name || 'No class'}
                            </p>
                          </div>
                          {Number(s.dues) > 0 ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                                             bg-status-pending/10 text-status-pending shrink-0">
                              {fmt(s.dues)} due
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                                             bg-status-verified/10 text-status-verified shrink-0">
                              Cleared
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!searching && query.trim().length >= 2 && results.length === 0 && (
                <p className="text-[11px] text-text-muted mt-2">No students match that search.</p>
              )}
            </div>
          )}

          {selected && (
            <>
              {/* Selected student */}
              <div className="bg-primary-subtle/40 border border-primary-light rounded-lg px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-main truncate">{selected.full_name}</p>
                    <p className="text-[11px] text-text-muted">
                      {selected.school_id_number} · {selected.class_name || 'No class'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelected(null); setUnpaid([]); }}
                    className="text-[11px] font-medium text-primary hover:text-primary-active shrink-0"
                  >
                    Change
                  </button>
                </div>
                {Number(selected.dues) > 0 && (
                  <p className="text-[11px] text-status-pending mt-2 font-medium">
                    Total outstanding: {fmt(selected.dues)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-text-main mb-1.5">Amount</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="3500"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                               text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-text-main mb-1.5">
                    Notes <span className="text-text-muted font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="e.g. Cheque #1234"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                               text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1.5">Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, method: m })}
                      className={`rounded-lg border px-3 py-2 text-[11px] font-medium transition-colors ${
                        form.method === m
                          ? 'border-primary bg-primary-subtle text-primary'
                          : 'border-border text-text-main hover:border-primary'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live allocation preview */}
              {loadingUnpaid && (
                <div className="bg-background border border-border rounded-xl p-4 text-xs text-text-muted text-center">
                  Loading invoices…
                </div>
              )}

              {!loadingUnpaid && unpaid.length === 0 && (
                <div className="bg-status-verified/5 border border-status-verified/20 rounded-xl p-4">
                  <p className="text-xs text-status-verified font-medium">
                    No outstanding invoices for this student.
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">
                    Any payment recorded will be kept as advance/credit on their account.
                  </p>
                </div>
              )}

              {!loadingUnpaid && unpaid.length > 0 && preview && (
                <div className="bg-primary-subtle/40 border border-primary-light rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
                    How this payment will be applied
                  </p>

                  <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                    {preview.alloc
                      .filter((a) => a.willPay > 0)
                      .map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 text-[11px]">
                          <div className="min-w-0 flex-1">
                            <p className="text-text-main truncate">{a.fee_head}</p>
                            {a.statusAfter === 'PARTIAL' && (
                              <p className="text-[10px] text-status-pending">
                                Partial — remaining {fmt(Number(a.amount) - Number(a.amount_paid) - a.willPay)}
                              </p>
                            )}
                            {a.statusAfter === 'PAID' && (
                              <p className="text-[10px] text-status-verified">Will be fully paid</p>
                            )}
                          </div>
                          <span className="text-text-main font-medium tabular-nums shrink-0">
                            {fmt(a.willPay)}
                          </span>
                        </li>
                      ))}
                  </ul>

                  <div className="mt-3 pt-3 border-t border-primary-light grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-text-muted">Fully paid</p>
                      <p className="text-sm font-bold text-status-verified">{preview.fullyPaid}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted">Partial</p>
                      <p className="text-sm font-bold text-status-pending">{preview.partiallyPaid}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted">Unallocated</p>
                      <p className={`text-sm font-bold ${
                        preview.unallocated > 0 ? 'text-primary' : 'text-text-muted'
                      }`}>
                        {preview.unallocated > 0 ? fmt(preview.unallocated) : '—'}
                      </p>
                    </div>
                  </div>

                  {preview.unallocated > 0 && (
                    <p className="text-[10px] text-text-muted mt-2 italic">
                      Unallocated amount will be kept as advance credit.
                    </p>
                  )}
                </div>
              )}

              {!loadingUnpaid && unpaid.length > 0 && !preview && (
                <div className="bg-background border border-border rounded-xl p-4">
                  <p className="text-[11px] text-text-muted text-center">
                    Enter an amount to see how it will be applied.
                  </p>
                </div>
              )}
            </>
          )}

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
              type="submit"
              disabled={busy || !selected}
              className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold
                         px-5 py-2 disabled:opacity-60 transition-colors"
            >
              {busy ? 'Recording…' : 'Record payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}