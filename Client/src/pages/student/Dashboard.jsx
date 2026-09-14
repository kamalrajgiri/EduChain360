import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getDashboard } from '../../api/student.js';

const DAY_LABEL = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday'
};

/* ---------- small components ---------- */

function Kpi({ label, value, hint, tone = 'primary', icon }) {
  const toneMap = {
    primary:   'bg-primary-subtle text-primary',
    secondary: 'bg-secondary-subtle text-secondary',
    warning:   'bg-status-pending/10 text-status-pending',
    success:   'bg-status-verified/10 text-status-verified',
    danger:    'bg-status-tampered/10 text-status-tampered'
  };
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`h-9 w-9 rounded-lg grid place-items-center ${toneMap[tone]}`}>
          <span className="text-xs font-bold">{icon || '●'}</span>
        </div>
      </div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-2xl font-bold text-text-main mt-1">{value}</p>
      {hint && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

function GradeBadge({ grade }) {
  const tone =
    grade === 'A+' || grade === 'A' ? 'bg-status-verified/10 text-status-verified' :
    grade === 'B+' || grade === 'B' ? 'bg-primary-subtle text-primary' :
    grade === 'C'                    ? 'bg-status-pending/10 text-status-pending' :
                                       'bg-status-tampered/10 text-status-tampered';
  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${tone}`}>
      {grade}
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                     bg-secondary-subtle text-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
      Verified
    </span>
  );
}

/* ---------- main page ---------- */

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getDashboard();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const firstName = user?.full_name?.split(' ')[0] || 'Student';
  const enrollment = data?.enrollment;

  return (
    <DashboardLayout
      pageTitle={`Welcome back, ${firstName}`}
      pageSubtitle={
        enrollment
          ? `${enrollment.class_name} · Roll No. ${enrollment.roll_number}`
          : 'Student dashboard'
      }
    >
      {loading && (
        <div className="py-24 grid place-items-center">
          <Spinner size="lg" label="Loading your dashboard..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-4 py-3 text-sm text-status-tampered">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">

          {/* ── Row 1 · KPI cards ─────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Kpi
              label="Attendance this month"
              value={`${data.attendance.pct}%`}
              hint={
                data.attendance.pct >= data.attendance.requirement
                  ? `Above ${data.attendance.requirement}% requirement`
                  : `Below ${data.attendance.requirement}% requirement`
              }
              tone={data.attendance.pct >= data.attendance.requirement ? 'success' : 'danger'}
              icon="AT"
            />
            <Kpi
              label="Last exam — aggregate"
              value={data.lastExam ? `${data.lastExam.aggregate}%` : '—'}
              hint={data.lastExam ? `Grade: ${data.lastExam.grade}` : 'No results yet'}
              tone="primary"
              icon="RE"
            />
            <Kpi
              label="Fee due this term"
              value={`NPR ${data.fees.due.toLocaleString()}`}
              hint={
                data.fees.nextDueDate
                  ? `Due ${new Date(data.fees.nextDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'All cleared'
              }
              tone={data.fees.due > 0 ? 'warning' : 'success'}
              icon="FE"
            />
            <Kpi
              label="Certificates issued"
              value={data.certificates.count}
              hint="All blockchain-verified"
              tone="secondary"
              icon="CE"
            />
          </div>

          {/* ── Row 2 · Today's timetable ─────────────────── */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-main">Today's timetable</h2>
                <p className="text-xs text-text-muted">
                  {enrollment?.class_name || '—'} · {DAY_LABEL[data.day] || ''}
                </p>
              </div>
              <Link
                to="/student/attendance"
                className="text-xs font-medium text-primary hover:text-primary-active"
              >
                Full timetable →
              </Link>
            </header>

            {data.todayTimetable.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">
                No sessions scheduled for today.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-semibold w-12">Period</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Time</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Subject</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Teacher</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {data.todayTimetable.map((s, idx) => (
                    <tr
                      key={s.id}
                      className="border-t border-border hover:bg-primary-subtle/40 transition-colors"
                    >
                      <td className="px-5 py-3 text-text-muted font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-3 font-medium text-text-main">
                        {String(s.start_time).slice(0, 5)} – {String(s.end_time).slice(0, 5)}
                      </td>
                      <td className="px-5 py-3 text-text-main">{s.subject}</td>
                      <td className="px-5 py-3 text-text-muted">{s.teacher || '—'}</td>
                      <td className="px-5 py-3 text-text-muted">{s.room || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* ── Row 3 · Notices + certificates ────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent notices */}
            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-main">Recent notices</h2>
                <Link to="/student" className="text-xs font-medium text-primary hover:text-primary-active">
                  View all →
                </Link>
              </header>
              <ul className="divide-y divide-border">
                {data.recentNotices.map((n) => (
                  <li
                    key={n.id}
                    className="px-5 py-3 hover:bg-primary-subtle/40 transition-colors"
                  >
                    <p className="text-sm font-medium text-text-main">{n.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {n.audience} · {new Date(n.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </li>
                ))}
                {data.recentNotices.length === 0 && (
                  <li className="px-5 py-8 text-center text-sm text-text-muted">
                    No notices yet.
                  </li>
                )}
              </ul>
            </section>

            {/* My certificates */}
            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-main">My certificates</h2>
                <Link
                  to="/student/certificates"
                  className="text-xs font-medium text-primary hover:text-primary-active"
                >
                  View all →
                </Link>
              </header>
              <ul className="divide-y divide-border">
                {data.certificates.recent.map((c) => (
                  <li
                    key={c.credential_uuid}
                    className="px-5 py-3 flex items-center justify-between hover:bg-primary-subtle/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-main truncate">{c.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Issued {new Date(c.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {c.is_anchored ? <VerifiedBadge /> : (
                      <span className="text-[10px] text-text-muted">Pending</span>
                    )}
                  </li>
                ))}
                {data.certificates.recent.length === 0 && (
                  <li className="px-5 py-8 text-center text-sm text-text-muted">
                    No certificates issued yet.
                  </li>
                )}
              </ul>
            </section>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}