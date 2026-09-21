import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import {
  getPayrollStaff,
  upsertStaffSalary,
  getPayrollRuns,
  createPayrollRun
} from '../../api/accountant.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtShort(n) {
  const num = Number(n);
  if (num >= 100000) return `NPR ${(num / 100000).toFixed(2)} L`;
  return `NPR ${num.toLocaleString('en-IN')}`;
}

function fmtMonth(ym) {
  if (!ym) return '—';
  const [y, m] = ym.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function initialsOf(name) {
  if (!name) return 'ST';
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

const ROLE_CHIP = {
  Admin: 'bg-primary text-text-inverse',
  Teacher: 'bg-secondary-subtle text-secondary',
  Accountant: 'bg-status-verified/10 text-status-verified',
  Librarian: 'bg-status-pending/10 text-status-pending',
  HR: 'bg-primary-subtle text-primary',
  'Lab Assistant': 'bg-background text-text-muted'
};

/* ─── Edit salary modal ──────────────────────────────────── */

function EditSalaryModal({ staff, onClose, onSaved }) {
  const [form, setForm] = useState({
    gross_salary: staff.gross_salary ? String(staff.gross_salary) : '',
    tax_rate: staff.tax_rate ? String(staff.tax_rate) : '10',
    pf_rate: staff.pf_rate ? String(staff.pf_rate) : '5',
    other_deduction: staff.other_deduction ? String(staff.other_deduction) : '0',
    effective_from: staff.effective_from ? String(staff.effective_from).slice(0, 10) : new Date().toISOString().slice(0, 10)
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const gross = Number(form.gross_salary) || 0;
  const taxAmt = Math.round(gross * Number(form.tax_rate) / 100 * 100) / 100;
  const pfAmt = Math.round(gross * Number(form.pf_rate) / 100 * 100) / 100;
  const otherAmt = Number(form.other_deduction) || 0;
  const net = gross - taxAmt - pfAmt - otherAmt;

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (gross <= 0) return setErr('Gross salary must be positive');

    setBusy(true);
    try {
      await upsertStaffSalary(staff.id, {
        gross_salary: gross,
        tax_rate: Number(form.tax_rate),
        pf_rate: Number(form.pf_rate),
        other_deduction: otherAmt,
        effective_from: form.effective_from
      });
      onSaved();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to save');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 my-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">Salary details</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {staff.full_name} · {staff.role}
            </p>
          </div>
          <button onClick={onClose} disabled={busy} className="text-text-muted hover:text-text-main text-lg leading-none">×</button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-3 py-2 text-xs text-status-tampered">{err}</div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Gross salary (NPR)</label>
            <input
              type="number"
              value={form.gross_salary}
              onChange={(e) => setForm({ ...form, gross_salary: e.target.value })}
              placeholder="62000"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">Tax %</label>
              <input
                type="number"
                step="0.01"
                value={form.tax_rate}
                onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                           text-text-main focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">PF %</label>
              <input
                type="number"
                step="0.01"
                value={form.pf_rate}
                onChange={(e) => setForm({ ...form, pf_rate: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                           text-text-main focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">Other (NPR)</label>
              <input
                type="number"
                step="0.01"
                value={form.other_deduction}
                onChange={(e) => setForm({ ...form, other_deduction: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                           text-text-main focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Effective from</label>
            <input
              type="date"
              value={form.effective_from}
              onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary"
            />
          </div>

          {/* Live calculation */}
          <div className="bg-primary-subtle/40 border border-primary-light rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
              Net pay preview
            </p>
            <ul className="space-y-1 text-xs">
              <li className="flex justify-between">
                <span className="text-text-muted">Gross</span>
                <span className="text-text-main tabular-nums">{fmt(gross)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-text-muted">Tax</span>
                <span className="text-status-tampered tabular-nums">− {fmt(taxAmt)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-text-muted">PF</span>
                <span className="text-status-tampered tabular-nums">− {fmt(pfAmt)}</span>
              </li>
              {otherAmt > 0 && (
                <li className="flex justify-between">
                  <span className="text-text-muted">Other</span>
                  <span className="text-status-tampered tabular-nums">− {fmt(otherAmt)}</span>
                </li>
              )}
              <li className="flex justify-between pt-1 border-t border-primary-light">
                <span className="font-semibold text-text-main">Net pay</span>
                <span className="font-bold text-primary tabular-nums">{fmt(net)}</span>
              </li>
            </ul>
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
              {busy ? 'Saving…' : 'Save salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Run payroll modal ──────────────────────────────────── */

function RunPayrollModal({ open, onClose, onRan, staffWithSalary }) {
const [month, setMonth] = useState(() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  if (!open) return null;

  const totalGross = staffWithSalary.reduce((s, st) => s + Number(st.gross_salary), 0);
  const totalDed = staffWithSalary.reduce((s, st) => {
    const g = Number(st.gross_salary);
    return s + Math.round(g * Number(st.tax_rate) / 100 * 100) / 100
             + Math.round(g * Number(st.pf_rate) / 100 * 100) / 100
             + Number(st.other_deduction);
  }, 0);
  const totalNet = totalGross - totalDed;

  async function submit(e) {
    e.preventDefault();
    setErr(''); setSuccess('');
    setBusy(true);
    try {
      const res = await createPayrollRun(month, notes);
      setSuccess(res.message || 'Payroll processed');
      setTimeout(() => { onRan(); onClose(); }, 1500);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">Run payroll</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Processes salaries for all {staffWithSalary.length} active staff.
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
            <label className="block text-xs font-semibold text-text-main mb-1.5">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Displays as <strong>{fmtMonth(month)}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">
              Notes <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Festival bonus included"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary"
            />
          </div>

          <div className="bg-primary-subtle/40 border border-primary-light rounded-lg p-4">
            <ul className="space-y-1 text-xs">
              <li className="flex justify-between">
                <span className="text-text-muted">Staff</span>
                <span className="text-text-main tabular-nums">{staffWithSalary.length}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-text-muted">Total gross</span>
                <span className="text-text-main tabular-nums">{fmtShort(totalGross)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-text-muted">Total deductions</span>
                <span className="text-status-tampered tabular-nums">− {fmtShort(totalDed)}</span>
              </li>
              <li className="flex justify-between pt-1 border-t border-primary-light">
                <span className="font-semibold text-text-main">Total net payout</span>
                <span className="font-bold text-primary tabular-nums">{fmtShort(totalNet)}</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={busy}
              className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2
                         hover:bg-background disabled:opacity-60 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={busy || staffWithSalary.length === 0}
              className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold
                         px-5 py-2 disabled:opacity-60 transition-colors">
              {busy ? 'Processing…' : `Process ${fmtMonth(month)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function AccountantPayroll() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('staff'); // 'staff' | 'history'
  const [editStaff, setEditStaff] = useState(null);
  const [runOpen, setRunOpen] = useState(false);

  const staffFetch = useFetch(() => getPayrollStaff(), []);
  const runsFetch  = useFetch(() => getPayrollRuns(), []);

  const staff = staffFetch.data || [];
  const staffWithSalary = staff.filter((s) => s.gross_salary);

  return (
    <DashboardLayout
      pageTitle="Payroll"
      pageSubtitle="Staff salaries & monthly payroll runs"
    >
      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('staff')}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              tab === 'staff'
                ? 'bg-primary text-text-inverse'
                : 'bg-surface border border-border text-text-main hover:border-primary'
            }`}
          >
            Staff salaries ({staff.length})
          </button>
          <button
            onClick={() => setTab('history')}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              tab === 'history'
                ? 'bg-primary text-text-inverse'
                : 'bg-surface border border-border text-text-main hover:border-primary'
            }`}
          >
            Payroll history ({(runsFetch.data || []).length})
          </button>
        </div>

        <button
          onClick={() => setRunOpen(true)}
          disabled={staffWithSalary.length === 0}
          className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                     text-xs font-semibold px-4 py-2.5 disabled:opacity-50 transition-colors"
        >
          + Run payroll
        </button>
      </div>

      {/* Staff tab */}
      {tab === 'staff' && (
        <>
          {staffFetch.loading && <SkeletonTable rows={6} cols={5} />}
          {!staffFetch.loading && staffFetch.error && (
            <ErrorState title="Couldn't load staff" message={staffFetch.error} onRetry={staffFetch.retry} />
          )}
          {!staffFetch.loading && !staffFetch.error && staff.length === 0 && (
            <EmptyState
              icon="👥"
              title="No staff accounts yet"
              message="Once users are created for staff roles, they'll appear here for salary assignment."
            />
          )}
          {!staffFetch.loading && !staffFetch.error && staff.length > 0 && (
            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">Staff salaries</h2>
                <p className="text-xs text-text-muted">
                  {staffWithSalary.length} of {staff.length} staff have salaries set
                </p>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                  <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="text-left  px-5 py-2.5 font-semibold">Staff</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden lg:table-cell">Role</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Gross</th>
                      <th className="text-right px-5 py-2.5 font-semibold hidden md:table-cell">Deductions</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Net</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((s) => {
                      const g = Number(s.gross_salary || 0);
                      const ded = s.gross_salary
                        ? Math.round(g * Number(s.tax_rate) / 100 * 100) / 100
                          + Math.round(g * Number(s.pf_rate) / 100 * 100) / 100
                          + Number(s.other_deduction)
                        : 0;
                      const net = g - ded;
                      return (
                        <tr key={s.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary text-text-inverse grid place-items-center text-[10px] font-bold shrink-0">
                                {initialsOf(s.full_name)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-text-main font-medium truncate">{s.full_name}</p>
                                <p className="text-[10px] text-text-muted truncate">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 hidden lg:table-cell">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_CHIP[s.role] || ''}`}>
                              {s.role}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {s.gross_salary ? (
                              <span className="text-text-main font-medium">{fmt(g)}</span>
                            ) : (
                              <span className="text-text-muted italic text-xs">Not set</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right hidden md:table-cell text-xs tabular-nums">
                            {s.gross_salary ? (
                              <span className="text-status-tampered">− {fmt(ded)}</span>
                            ) : <span className="text-text-muted">—</span>}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {s.gross_salary ? (
                              <span className="text-status-verified font-semibold tabular-nums">{fmt(net)}</span>
                            ) : <span className="text-text-muted">—</span>}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => setEditStaff(s)}
                              className="text-xs font-medium text-primary hover:text-primary-active"
                            >
                              {s.gross_salary ? 'Edit' : 'Set salary'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <>
          {runsFetch.loading && <SkeletonTable rows={5} cols={5} />}
          {!runsFetch.loading && runsFetch.error && (
            <ErrorState title="Couldn't load payroll history" message={runsFetch.error} onRetry={runsFetch.retry} />
          )}
          {!runsFetch.loading && !runsFetch.error && (runsFetch.data || []).length === 0 && (
            <EmptyState
              icon="💼"
              title="No payroll runs yet"
              message="Click 'Run payroll' to process salaries for a month."
              actionLabel="Run payroll"
              actionOnClick={() => setRunOpen(true)}
            />
          )}
          {!runsFetch.loading && !runsFetch.error && (runsFetch.data || []).length > 0 && (
            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">Payroll runs</h2>
                <p className="text-xs text-text-muted">Click a run to view individual slips</p>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[680px]">
                  <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="text-left  px-5 py-2.5 font-semibold">Month</th>
                      <th className="text-right px-5 py-2.5 font-semibold hidden md:table-cell">Staff</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Gross</th>
                      <th className="text-right px-5 py-2.5 font-semibold hidden md:table-cell">Deductions</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Net</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden lg:table-cell">Run by</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(runsFetch.data || []).map((r) => (
                      <tr
                        key={r.id}
                        className="border-t border-border hover:bg-primary-subtle/40 transition-colors cursor-pointer"
                        onClick={() => navigate(`/accountant/payroll/runs/${r.id}`)}
                      >
                        <td className="px-5 py-3 text-text-main font-medium">{fmtMonth(r.month)}</td>
                        <td className="px-5 py-3 text-right text-text-muted hidden md:table-cell tabular-nums">
                          {r.staff_count}
                        </td>
                        <td className="px-5 py-3 text-right text-text-main tabular-nums">
                          {fmtShort(r.total_gross)}
                        </td>
                        <td className="px-5 py-3 text-right hidden md:table-cell tabular-nums">
                          <span className="text-status-tampered">− {fmtShort(r.total_deductions)}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-status-verified font-semibold tabular-nums">
                            {fmtShort(r.total_net)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden lg:table-cell text-xs">
                          {r.run_by_name || '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/accountant/payroll/runs/${r.id}`); }}
                            className="text-xs font-medium text-primary hover:text-primary-active"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {editStaff && (
        <EditSalaryModal
          staff={editStaff}
          onClose={() => setEditStaff(null)}
          onSaved={() => {
            setEditStaff(null);
            staffFetch.retry();
          }}
        />
      )}

      <RunPayrollModal
        open={runOpen}
        onClose={() => setRunOpen(false)}
        onRan={() => { runsFetch.retry(); }}
        staffWithSalary={staffWithSalary}
      />
    </DashboardLayout>
  );
}