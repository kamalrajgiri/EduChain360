import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import {
  getFeeStructure,
  createFeeStructure,
  deleteFeeStructure,
  generateInvoices,
  getClasses,
  previewInvoices
} from '../../api/accountant.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function AddFeeModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    academic_year: '2083/2084',
    term: 'Term 2, 2083/2084',
    fee_head: '',
    amount: '',
    is_mandatory: true
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!form.fee_head.trim()) return setErr('Fee head is required');
    if (!form.amount || Number(form.amount) <= 0) return setErr('Amount must be positive');

    setBusy(true);
    try {
      await createFeeStructure({
        academic_year: form.academic_year,
        term: form.term,
        fee_head: form.fee_head.trim(),
        amount: Number(form.amount),
        is_mandatory: form.is_mandatory
      });
      onCreated();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to create');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">Add fee head</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Applies to the whole institution unless a specific class is chosen.
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
            <label className="block text-xs font-semibold text-text-main mb-1.5">Academic year</label>
            <input
              type="text"
              value={form.academic_year}
              onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Term</label>
            <input
              type="text"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Fee head</label>
            <input
              type="text"
              value={form.fee_head}
              onChange={(e) => setForm({ ...form, fee_head: e.target.value })}
              placeholder="e.g. Tuition fee"
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
              placeholder="3500"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
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
              disabled={busy}
              className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold
                         px-5 py-2 disabled:opacity-60 transition-colors"
            >
              {busy ? 'Saving…' : 'Add fee head'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GenerateInvoicesModal({ open, onClose }) {
  const [form, setForm] = useState({
    class_id: '',
    academic_year: '2083/2084',
    term: 'Term 2, 2083/2084'
  });
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const classesFetch = useFetch(open ? () => getClasses() : null, [open]);

  useEffect(() => {
    if (open && classesFetch.data?.length && !form.class_id) {
      setForm((f) => ({ ...f, class_id: String(classesFetch.data[0].id) }));
    }
  }, [open, classesFetch.data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recompute preview when form changes (debounced)
  useEffect(() => {
    if (!open || !form.class_id || !form.academic_year || !form.term) {
      setPreview(null);
      return;
    }
    setPreviewing(true);
    const t = setTimeout(async () => {
      try {
        const res = await previewInvoices({
          class_id: Number(form.class_id),
          academic_year: form.academic_year,
          term: form.term
        });
        setPreview(res);
      } catch {
        setPreview(null);
      } finally {
        setPreviewing(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [open, form.class_id, form.academic_year, form.term]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault();
    setErr(''); setSuccess('');
    if (!form.class_id) return setErr('Select a class');

    setBusy(true);
    try {
      const res = await generateInvoices({
        class_id: Number(form.class_id),
        academic_year: form.academic_year,
        term: form.term
      });
      setSuccess(res.message || 'Done');
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const selectedClass = (classesFetch.data || []).find((c) => String(c.id) === form.class_id);
  const canSubmit = !busy && preview && preview.newInvoices > 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 my-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">Generate invoices</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Preview the batch, then confirm.
            </p>
          </div>
          <button onClick={onClose} disabled={busy} className="text-text-muted hover:text-text-main text-lg leading-none">×</button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-3 py-2 text-xs text-status-tampered">{err}</div>
        )}
        {success && (
          <div className="mb-3 rounded-lg border border-status-verified/30 bg-status-verified/5 px-3 py-2 text-xs text-status-verified">{success}</div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Class</label>
            {classesFetch.loading ? (
              <div className="text-xs text-text-muted py-2">Loading classes…</div>
            ) : (
              <select
                value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                           text-text-main focus:outline-none focus:border-primary"
              >
                <option value="">Select a class…</option>
                {(classesFetch.data || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.student_count} student{c.student_count === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">Academic year</label>
              <input
                type="text"
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                           text-text-main focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">Term</label>
              <input
                type="text"
                value={form.term}
                onChange={(e) => setForm({ ...form, term: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                           text-text-main focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Preview block */}
          {previewing && (
            <div className="bg-background border border-border rounded-xl p-4 text-xs text-text-muted text-center">
              Computing preview…
            </div>
          )}

          {!previewing && preview && preview.reason === 'no_structure' && (
            <div className="bg-status-tampered/5 border border-status-tampered/20 rounded-xl p-4">
              <p className="text-xs text-status-tampered font-medium">
                No fee structure found for this class/term.
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                Add fee heads in the table above using this exact year and term, then retry.
              </p>
            </div>
          )}

          {!previewing && preview && preview.reason === 'all_exist' && (
            <div className="bg-status-pending/5 border border-status-pending/20 rounded-xl p-4">
              <p className="text-xs text-status-pending font-medium">
                All invoices already exist.
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                Every student in {selectedClass?.name || 'this class'} already has an invoice for this term.
                Re-running will create 0 new records.
              </p>
            </div>
          )}

          {!previewing && preview && preview.reason === 'ready' && (
            <div className="bg-primary-subtle/40 border border-primary-light rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
                What will happen
              </p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-[10px] text-text-muted">Students</p>
                  <p className="text-base font-bold text-text-main">{preview.students}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">Fee heads</p>
                  <p className="text-base font-bold text-text-main">{preview.feeHeads.length}</p>
                </div>
              </div>

              <div className="space-y-1 mb-3">
                {preview.feeHeads.map((f) => (
                  <div key={f.fee_head} className="flex items-center justify-between text-[11px]">
                    <span className="text-text-main">{f.fee_head}</span>
                    <span className="text-text-muted tabular-nums">
                      NPR {Number(f.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-primary-light pt-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-text-main">
                  Per student
                </span>
                <span className="text-xs font-bold text-primary tabular-nums">
                  NPR {preview.perStudent.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="mt-3 pt-2 border-t border-primary-light grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-text-muted">New invoices</p>
                  <p className="text-sm font-bold text-status-verified">{preview.newInvoices}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">Total billed</p>
                  <p className="text-sm font-bold text-status-verified tabular-nums">
                    NPR {(preview.perStudent * preview.students).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {preview.existing > 0 && (
                <p className="text-[10px] text-text-muted mt-2">
                  {preview.existing} existing invoice{preview.existing === 1 ? '' : 's'} will be skipped.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={busy}
              className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2
                         hover:bg-background disabled:opacity-60 transition-colors">
              Close
            </button>
            <button type="submit" disabled={!canSubmit}
              className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold
                         px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {busy ? 'Generating…' : `Confirm & create ${preview?.newInvoices || 0} invoice${(preview?.newInvoices || 0) === 1 ? '' : 's'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AccountantFeeStructure() {
  const [addOpen, setAddOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, error, retry } = useFetch(() => getFeeStructure(), []);

  async function handleDelete(id) {
    if (!window.confirm('Remove this fee head? Existing invoices are not affected.')) return;
    setDeletingId(id);
    try {
      await deleteFeeStructure(id);
      retry();
    } catch {
      alert('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardLayout
      pageTitle="Fee Structure"
      pageSubtitle="Define what students owe per term"
    >
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-xs text-text-muted">
          Fee heads applied here can be used to auto-generate invoices for an entire class.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setGenOpen(true)}
            className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2.5
                       hover:bg-background transition-colors"
          >
            Generate invoices
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold
                       px-4 py-2.5 transition-colors"
          >
            + Add fee head
          </button>
        </div>
      </div>

      {loading && <SkeletonTable rows={5} cols={5} />}

      {!loading && error && (
        <ErrorState title="Couldn't load fee structure" message={error} onRetry={retry} />
      )}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon="💰"
          title="No fee structure defined"
          message="Add your first fee head to define what students owe per term. Then use 'Generate invoices' to apply it to a whole class."
          actionLabel="Add fee head"
          actionOnClick={() => setAddOpen(true)}
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <header className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-text-main">Fee heads</h2>
              <p className="text-xs text-text-muted">
                {data.length} entr{data.length === 1 ? 'y' : 'ies'}
              </p>
            </div>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="text-left  px-5 py-2.5 font-semibold">Fee head</th>
                  <th className="text-left  px-5 py-2.5 font-semibold hidden md:table-cell">Class</th>
                  <th className="text-left  px-5 py-2.5 font-semibold hidden lg:table-cell">Year · Term</th>
                  <th className="text-right px-5 py-2.5 font-semibold">Amount</th>
                  <th className="text-right px-5 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((f) => (
                  <tr key={f.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-text-main font-medium">{f.fee_head}</p>
                      <p className="text-[10px] text-text-muted">
                        {f.is_mandatory ? 'Mandatory' : 'Optional'}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-text-muted hidden md:table-cell text-xs">
                      {f.class_name || <span className="italic">All classes</span>}
                    </td>
                    <td className="px-5 py-3 text-text-muted hidden lg:table-cell text-xs">
                      {f.academic_year} · {f.term}
                    </td>
                    <td className="px-5 py-3 text-right text-text-main font-medium tabular-nums">
                      {fmt(f.amount)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(f.id)}
                        disabled={deletingId === f.id}
                        className="text-xs font-medium text-status-tampered hover:underline disabled:opacity-60"
                      >
                        {deletingId === f.id ? 'Removing…' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AddFeeModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => { setAddOpen(false); retry(); }}
      />
      <GenerateInvoicesModal open={genOpen} onClose={() => setGenOpen(false)} />
    </DashboardLayout>
  );
}