import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getAttendance, getAttendanceCalendar } from '../../api/student.js';
import { SkeletonDashboard } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';

/* ─── Local-date helpers (avoid UTC pitfalls) ──────────── */

function currentMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(monthISO, delta) {
  const [y, m] = monthISO.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/* ─── Status palette ───────────────────────────────────── */

const STATUS_STYLE = {
  PRESENT:  { dot: 'bg-status-verified',  chip: 'bg-status-verified/10 text-status-verified',   label: 'Present' },
  LATE:     { dot: 'bg-status-pending',   chip: 'bg-status-pending/10 text-status-pending',    label: 'Late' },
  ABSENT:   { dot: 'bg-status-tampered',  chip: 'bg-status-tampered/10 text-status-tampered',  label: 'Absent' },
  LEAVE:    { dot: 'bg-primary',          chip: 'bg-primary-subtle text-primary',              label: 'Leave' },
  HOLIDAY:  { dot: 'bg-border',           chip: 'bg-background text-text-muted',               label: 'Holiday' },
  NO_DATA:  { dot: 'bg-border',           chip: 'bg-background text-text-muted',               label: 'No record' }
};

function fmtDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── Month calendar ─────────────────────────────────── */

function MonthCalendar({ days, month, onPrev, onNext, onToday, loading }) {
  const weeks = useMemo(() => {
    if (!days || days.length === 0) return [];
    const first = new Date(days[0].date);
    const startWeekday = first.getDay();
    const padded = Array(startWeekday).fill(null).concat(days);
    while (padded.length % 7 !== 0) padded.push(null);
    const out = [];
    for (let i = 0; i < padded.length; i += 7) {
      out.push(padded.slice(i, i + 7));
    }
    return out;
  }, [days]);

  const monthLabel = month
    ? new Date(Number(month.split('-')[0]), Number(month.split('-')[1]) - 1, 1)
        .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : '—';

  const isCurrentMonth = month === currentMonthISO();

  return (
    <section className="bg-surface border border-border rounded-2xl p-5">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-text-main">Attendance calendar</h2>
          <p className="text-xs text-text-muted mt-0.5">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={loading}
            className="h-8 w-8 rounded-lg border border-border hover:bg-background
                       disabled:opacity-50 transition-colors grid place-items-center"
            aria-label="Previous month"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={onToday}
              disabled={loading}
              className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium
                         text-text-main hover:bg-background disabled:opacity-50 transition-colors"
            >
              This month
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={loading}
            className="h-8 w-8 rounded-lg border border-border hover:bg-background
                       disabled:opacity-50 transition-colors grid place-items-center"
            aria-label="Next month"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-text-muted uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="aspect-square" />;
              const style = STATUS_STYLE[day.status] || STATUS_STYLE.NO_DATA;
              const isWeekend = day.dow === 0 || day.dow === 6;
              const cellClasses = day.hasData
                ? `${style.dot} text-text-inverse`
                : isWeekend
                  ? 'bg-background text-text-muted/50'
                  : 'bg-background text-text-muted/60 border border-border/60';
              return (
                <div
                  key={di}
                  title={`${fmtDate(day.date)}${day.hasData ? ` · ${style.label}` : ''}`}
                  className={`aspect-square rounded-md grid place-items-center text-[11px] font-medium
                             relative transition-colors ${cellClasses}`}
                >
                  {day.day}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-x-4 gap-y-2">
        {['PRESENT','LATE','ABSENT','LEAVE'].map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
            <span className={`h-2.5 w-2.5 rounded ${STATUS_STYLE[k].dot}`} />
            {STATUS_STYLE[k].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
          <span className="h-2.5 w-2.5 rounded bg-background border border-border/60" />
          No record
        </span>
      </div>
    </section>
  );
}

/* ─── Subject-wise totals ────────────────────────────── */

function SubjectTotals({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <section className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-sm font-bold text-text-main mb-3">Subject-wise attendance</h2>
        <p className="text-xs text-text-muted text-center py-6">No subject-level records yet.</p>
      </section>
    );
  }

  return (
    <section className="bg-surface border border-border rounded-2xl overflow-hidden">
      <header className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-bold text-text-main">Subject-wise attendance</h2>
        <p className="text-xs text-text-muted">Academic year totals</p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
            <tr>
              <th className="text-left  px-5 py-2.5 font-semibold">Subject</th>
              <th className="text-right px-5 py-2.5 font-semibold">Total</th>
              <th className="text-right px-5 py-2.5 font-semibold">Present</th>
              <th className="text-right px-5 py-2.5 font-semibold hidden md:table-cell">Late</th>
              <th className="text-right px-5 py-2.5 font-semibold hidden md:table-cell">Absent</th>
              <th className="text-right px-5 py-2.5 font-semibold hidden lg:table-cell">Leave</th>
              <th className="text-right px-5 py-2.5 font-semibold">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const total = Number(r.total);
              const present = Number(r.present);
              const pct = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
              const pctColor = pct >= 90 ? 'text-status-verified'
                             : pct >= 75 ? 'text-status-pending'
                             : 'text-status-tampered';
              return (
                <tr key={r.subject_id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-text-main font-medium">{r.subject}</p>
                    <p className="text-[10px] text-text-muted font-mono">{r.code}</p>
                  </td>
                  <td className="px-5 py-3 text-right text-text-main tabular-nums">{total}</td>
                  <td className="px-5 py-3 text-right text-status-verified font-medium tabular-nums">{present}</td>
                  <td className="px-5 py-3 text-right text-status-pending tabular-nums hidden md:table-cell">
                    {Number(r.late) || 0}
                  </td>
                  <td className="px-5 py-3 text-right text-status-tampered tabular-nums hidden md:table-cell">
                    {Number(r.absent) || 0}
                  </td>
                  <td className="px-5 py-3 text-right text-primary tabular-nums hidden lg:table-cell">
                    {Number(r.leave_count) || 0}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-bold tabular-nums ${pctColor}`}>{pct}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─── Main page ──────────────────────────────────────── */

export default function StudentAttendance() {
  const [month, setMonth] = useState(currentMonthISO());

  const summaryFetch = useFetch(() => getAttendance(), []);
  const calendarFetch = useFetch(() => getAttendanceCalendar(month), [month]);

  const data = summaryFetch.data;
  const calendar = calendarFetch.data;

  const enrollment = data?.enrollment;
  const summary = data?.summary;

  const weekByDay = (() => {
    const out = { MON: [], TUE: [], WED: [], THU: [], FRI: [] };
    for (const r of (data?.weekTimetable || [])) {
      if (out[r.day_of_week]) out[r.day_of_week].push(r);
    }
    return out;
  })();

  const goPrevMonth = () => setMonth((m) => addMonths(m, -1));
  const goNextMonth = () => setMonth((m) => addMonths(m, 1));
  const goThisMonth = () => setMonth(currentMonthISO());

  return (
    <DashboardLayout
      pageTitle="Attendance & timetable"
      pageSubtitle={enrollment ? `${enrollment.class_name} · ${enrollment.academic_year}` : 'Your records'}
    >
      {summaryFetch.loading && (
        <div className="py-24 grid place-items-center">
          <SkeletonDashboard />
        </div>
      )}

      {!summaryFetch.loading && summaryFetch.error && (
        <ErrorState
          title="Couldn't load attendance"
          message={summaryFetch.error}
          onRetry={summaryFetch.retry}
        />
      )}

      {!summaryFetch.loading && !summaryFetch.error && data && (
        <div className="space-y-6">

          {/* Row 1 — Summary + weekly timetable */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            <section className="bg-surface border border-border rounded-2xl p-6 lg:col-span-2">
              <h2 className="text-sm font-bold text-text-main">Monthly attendance</h2>
              <p className="text-xs text-text-muted">
                {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </p>

              <div className="mt-5">
                <p className={`text-4xl font-bold ${
                  summary.pct >= summary.requirement ? 'text-status-verified' : 'text-status-tampered'
                }`}>
                  {summary.pct}%
                </p>
              </div>
              <p className="text-xs text-text-muted mt-1">
                {summary.present} of {summary.total} school days present
              </p>

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

              <div className="mt-5 grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="h-2 w-full rounded bg-status-verified" />
                  <p className="text-[10px] text-text-muted mt-1.5">Present</p>
                  <p className="text-xs font-bold text-text-main">{summary.present}</p>
                </div>
                <div className="text-center">
                  <div className="h-2 w-full rounded bg-status-pending" />
                  <p className="text-[10px] text-text-muted mt-1.5">Late</p>
                  <p className="text-xs font-bold text-text-main">{summary.late}</p>
                </div>
                <div className="text-center">
                  <div className="h-2 w-full rounded bg-status-tampered" />
                  <p className="text-[10px] text-text-muted mt-1.5">Absent</p>
                  <p className="text-xs font-bold text-text-main">{summary.absent}</p>
                </div>
                <div className="text-center">
                  <div className="h-2 w-full rounded bg-primary" />
                  <p className="text-[10px] text-text-muted mt-1.5">Leave</p>
                  <p className="text-xs font-bold text-text-main">{summary.leave_count || 0}</p>
                </div>
              </div>
            </section>

            <section className="bg-surface border border-border rounded-2xl p-6 lg:col-span-3 overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-text-main">Weekly timetable</h2>
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

          {/* Row 2 — Calendar + Subject totals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {calendarFetch.loading && (
              <div className="bg-surface border border-border rounded-2xl p-10 grid place-items-center">
                <p className="text-xs text-text-muted">Loading calendar…</p>
              </div>
            )}
            {!calendarFetch.loading && calendarFetch.error && (
              <div className="bg-surface border border-border rounded-2xl p-10">
                <p className="text-xs text-status-tampered text-center">{calendarFetch.error}</p>
              </div>
            )}
            {!calendarFetch.loading && !calendarFetch.error && calendar && (
              <MonthCalendar
                days={calendar.days}
                month={calendar.month}
                onPrev={goPrevMonth}
                onNext={goNextMonth}
                onToday={goThisMonth}
                loading={calendarFetch.loading}
              />
            )}

            <SubjectTotals rows={calendar?.subjectTotals || []} />
          </div>

          {/* Row 3 — History */}
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
                    const style = STATUS_STYLE[h.status] || STATUS_STYLE.NO_DATA;
                    const date = new Date(h.attendance_date);
                    return (
                      <tr key={i} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
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
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${style.chip}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                            {style.label}
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