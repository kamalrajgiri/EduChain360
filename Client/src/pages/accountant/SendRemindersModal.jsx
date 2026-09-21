import { useEffect, useState } from 'react';
import { getRemindersPreview, sendFeeReminder } from '../../api/accountant.js';
import Spinner from '../../components/Spinner.jsx';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

export default function SendRemindersModal({ open, onClose, onSent }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: 'Fee payment reminder',
    message: '',
    deadline: ''
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!open) return;
    setErr('');
    setSuccess('');
    setLoading(true);
    (async () => {
      try {
        const res = await getRemindersPreview();
        setPreview(res);
      } catch {
        setErr('Failed to load preview');
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setSuccess('');
    setBusy(true);
    try {
      const res = await sendFeeReminder({
        title: form.title,
        message: form.message,
        deadline: form.deadline
      });
      setSuccess(res.message || 'Reminders sent');
      if (typeof onSent === 'function') onSent(res);
      setTimeout(() => onClose(), 1400);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to send');
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 my-8">

        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">Send fee reminders</h3>
            <p className="text-xs text-text-muted mt-0.5">
              A private notice will be sent to each student with outstanding dues.
            </p>
          </div>
          <button onClick={onClose} disabled={busy} className="text-text-muted hover:text-text-main text-lg leading-none">×</button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-3 py-2 text-xs text-status-tampered">
            {err}
          </div>
        )}
        {success && (
          <div className="mb-3 rounded-lg border border-status-verified/30 bg-status-verified/5 px-3 py-2 text-xs text-status-verified">
            {success}
          </div>
        )}

        {/* Preview */}
        {loading && (
          <div className="py-8 grid place-items-center">
            <Spinner label="Loading recipients..." />
          </div>
        )}

        {!loading && preview && (
          <div className="bg-primary-subtle/40 border border-primary-light rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                  Students with dues
                </p>
                <p className="text-lg font-bold text-text-main mt-0.5">{preview.studentCount}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                  Total dues
                </p>
                <p className="text-lg font-bold text-status-pending mt-0.5">
                  {fmt(preview.totalAmount)}
                </p>
              </div>
            </div>

            {preview.topDebtors.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
                  Top debtors
                </p>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {preview.topDebtors.map((d) => (
                    <li key={d.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-text-main truncate">{d.full_name}</span>
                      <span className="text-text-muted font-medium shrink-0 ml-2 tabular-nums">
                        {fmt(d.dues)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {!loading && preview && preview.studentCount === 0 && (
          <div className="bg-status-verified/10 border border-status-verified/20 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-status-verified font-medium">
              No outstanding dues — nothing to remind about.
            </p>
          </div>
        )}

        {/* Form */}
        {!loading && preview && preview.studentCount > 0 && (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                           text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">
                Deadline <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                           text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">
                Custom message <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                placeholder="Leave blank to use a default personalised message."
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                           text-text-main resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <p className="text-[11px] text-text-muted mt-1">
                Each student gets their own notice addressed to them by name.
              </p>
            </div>

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
                disabled={busy}
                className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                           text-xs font-semibold px-5 py-2 disabled:opacity-60 transition-colors"
              >
                {busy
                  ? 'Sending…'
                  : `Send to ${preview.studentCount} student${preview.studentCount === 1 ? '' : 's'}`}
              </button>
            </div>
          </form>
        )}

        {!loading && preview && preview.studentCount === 0 && (
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2
                         hover:bg-background transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}