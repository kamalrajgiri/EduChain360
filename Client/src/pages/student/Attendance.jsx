import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Spinner from '../../components/Spinner.jsx';
import { getAttendance } from '../../api/student.js';

const DAY_LABEL = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday'
};

const STATUS_STYLE = {
  PRESENT: { chip: 'bg-status-verified/10 text-status-verified', dot: 'bg-status-verified' },
  LATE:    { chip: 'bg-status-pending/10  text-status-pending',  dot: 'bg-status-pending' },
  ABSENT:  { chip: 'bg-status-tampered/10 text-status-tampered', dot: 'bg-status-tampered' }
};

function fmtDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getAttendance();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load attendance');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const enrollment = data?.enrollment;
  const summary = data?.summary;

  // Build a Mon–Fri grid for the last ~4 weeks (5 columns × 4 rows = 20 slots)
  // Each cell = one school day, coloured by its status.
  const recentDays = (() => {
    if (!data?.history) return [];
    return [...data.history]
      .sort((a, b) => new Date(a.attendance_date) - new Date(b.attendance_date))
      .slice(-20);
  })();

  // Group weekly timetable rows by day
  const weekByDay = (() => {
    const out = { MON: [], TUE: [], WED: [], THU: [], FRI: [] };
    for (const r of (data?.weekTimetable || [])) {
      if (out[r.day_of_week]) out[r.day_of_week].push(r);
    }
    return out;
  })();

  return (
    <DashboardLayout
      pageTitle="Attendance & timetable"
      pageSubtitle={enrollment ? `${enrollment.class_name} · ${enrollment.academic_year}` : 'Your records'}
    >
      {loading && (
        <div className="py-24 grid place-items-center">
          <Spinner size="lg" label="Loading attendance..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-4 py-3 text-sm text-status-tampered">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">

          {/* Row 1 — Monthly % + Weekly timetable snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Monthly attendance */}
            <section className="bg-surface border border-border rounded-2xl p-6 lg:col-span-2">
              <h2 className="text-sm font-bold text-text-main">Monthly attendance</h2>
              <p className="text-xs text-text-muted">Academic year {enrollment?.academic_year || '—'}</p>

              <div className="mt-5 flex items-baseline gap-2">
                <p className={`text-4xl font-bold ${
                  summary.pct >= summary.requirement ? 'text-status-verified' : 'text-status-tampered'
                }`}>
                  {summary.pct}%
                </p>
              </div>
              <p className="text-xs text-text-muted mt-1">
                {summary.present} of {summary.total} school days present
              </p>

              {/* Progress bar */}
              <div className="mt-4 h-2 rounded-full bg-primary-light overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    summary.pct >= summary.requirement ? 'bg-primary' : 'bg-status-tampered'
                  }`}
                  style={{ width: `${Math.min(summary.pct, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-text-muted mt-2">
                Requirement: {summary.requirement}% minimum
              </p>

              {/* 20-day grid */}
              <div className="mt-5">
                <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">
                  Last 20 school days
                </p>
                <div className="grid grid-cols-10 gap-1.5">
                  {recentDays.map((d, i) => {
                    const style = STATUS_STYLE[d.status] || STATUS_STYLE.PRESENT;
                    return (
                      <div
                        key={i}
                        title={`${fmtDate(d.attendance_date)} · ${d.status}`}
                        className={`h-5 w-5 rounded ${style.dot} opacity-90 hover:opacity-100 transition-opacity`}
                      />
                    );
                  })}
                  {recentDays.length === 0 && (
                    <p className="col-span-10 text-xs text-text-muted">No records yet.</p>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
                    <span className="h-2.5 w-2.5 rounded bg-status-verified" /> Present
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
                    <span className="h-2.5 w-2.5 rounded bg-status-pending" /> Late
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
                    <span className="h-2.5 w-2.5 rounded bg-status-tampered" /> Absent
                  </span>
                </div>
              </div>
            </section>

            {/* Weekly timetable snapshot */}
            <section className="bg-surface border border-border rounded-2xl p-6 lg:col-span-3 overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-text-main">Weekly timetable snapshot</h2>
                  <p className="text-xs text-text-muted">Monday — Friday</p>
                </div>
              </div>

              <table className="w-full text-xs min-w-[520px]">
                <thead className="bg-background text-[10px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Time</th>
                    {['MON','TUE','WED','THU','FRI'].map((d) => (
                      <th key={d} className="text-left px-3 py-2 font-semibold">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Build slot rows from the union of all start times */}
                  {(() => {
                    const slots = new Set();
                    Object.values(weekByDay).forEach((arr) =>
                      arr.forEach((r) => slots.add(String(r.start_time).slice(0, 5)))
                    );
                    const ordered = Array.from(slots).sort();
                    if (ordered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-text-muted">
                            No timetable entries yet.
                          </td>
                        </tr>
                      );
                    }
                    return ordered.map((slot) => (
                      <tr key={slot} className="border-t border-border">
                        <td className="px-3 py-2 text-text-muted font-mono">{slot}</td>
                        {['MON','TUE','WED','THU','FRI'].map((d) => {
                          const entry = weekByDay[d].find(
                            (r) => String(r.start_time).slice(0, 5) === slot
                          );
                          return (
                            <td key={d} className="px-3 py-2">
                              {entry ? (
                                <div>
                                  <p className="text-text-main font-medium">{entry.subject}</p>
                                  <p className="text-[10px] text-text-muted">{entry.room || '—'}</p>
                                </div>
                              ) : (
                                <span className="text-text-muted/40">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </section>
          </div>

          {/* Row 2 — Attendance history table */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-text-main">Attendance history</h2>
              <p className="text-xs text-text-muted">Most recent entries</p>
            </header>

            {data.history.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">
                No attendance records yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-semibold">Date</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Day</th>
                    <th className="text-left px-5 py-2.5 font-semibold hidden md:table-cell">Subject</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Status</th>
                    <th className="text-left px-5 py-2.5 font-semibold hidden lg:table-cell">Marked by</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((h, i) => {
                    const style = STATUS_STYLE[h.status] || STATUS_STYLE.PRESENT;
                    const date = new Date(h.attendance_date);
                    return (
                      <tr
                        key={i}
                        className="border-t border-border hover:bg-primary-subtle/40 transition-colors"
                      >
                        <td className="px-5 py-3 text-text-main">
                          {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 text-text-muted">
                          {date.toLocaleDateString('en-GB', { weekday: 'long' })}
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden md:table-cell">
                          {h.subject || '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${style.chip}`}>
                            {h.status.charAt(0) + h.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden lg:table-cell">
                          {h.marked_by || '—'}
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
    </DashboardLayout>
  );
}