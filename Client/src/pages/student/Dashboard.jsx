import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getDashboard } from '../../api/student.js';
import { SkeletonDashboard } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const DAY_LABEL = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday'
};

/* ---------- small components ---------- */

function Kpi({ label, value, hint, tone = 'primary', icon }) {
  const toneMap = {
    primary: 'bg-primary-subtle text-primary',
    secondary: 'bg-secondary-subtle text-secondary',
    warning: 'bg-status-pending/10 text-status-pending',
    success: 'bg-status-verified/10 text-status-verified',
    danger: 'bg-status-tampered/10 text-status-tampered'
  };
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className={`h-9 w-9 rounded-lg grid place-items-center mb-3 ${toneMap[tone]}`}>
        <span className="text-xs font-bold">{icon || '●'}</span>
      </div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-2xl font-bold text-text-main mt-1">{value}</p>
      {hint && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
    </div>
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
  const { data, loading, error, retry } = useFetch(() => getDashboard(), []);

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
      {/* ─── Loading skeleton ────────────────────────── */}
      {loading && <SkeletonDashboard />}

      {/* ─── Error ───────────────────────────────────── */}
      {!loading && error && (
        <ErrorState
          title="Couldn't load your dashboard"
          message={error}
          onRetry={retry}
        />
      )}

      {/* ─── Empty (no enrollment yet) ───────────────── */}
      {!loading && !error && data && !enrollment && (
        <EmptyState
          icon="🎓"
          title="You're not enrolled in a class yet"
          message="Once your admission is finalized and you're assigned to a class, your dashboard will populate with attendance, results, fees, and certificates."
        />
      )}

      {/* ─── Loaded ──────────────────────────────────── */}
      {!loading && !error && data && enrollment && (
        <div className="space-y-6">

          {/* KPIs */}
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
              value={`NPR ${data.fees.due.toLocaleString('en-IN')}`}
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
              hint={
                data.certificates.count > 0
                  ? "Ready for blockchain anchoring"
                  : "None issued yet"
              }
              tone="secondary"
              icon="CE"
            />
          </div>

          {/* Today's timetable */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-main">Today's timetable</h2>
                <p className="text-xs text-text-muted">
                  {enrollment.class_name} · {DAY_LABEL[data.day] || ''}
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

          {/* Notices + certificates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent notices */}
            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-main">Recent notices</h2>
                <Link
                  to="/student/notices"
                  className="text-xs font-medium text-primary hover:text-primary-active"
                >
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
                    {c.is_anchored ? (
                      <VerifiedBadge />
                    ) : (
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