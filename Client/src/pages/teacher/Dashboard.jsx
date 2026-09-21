import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getDashboard, getActivity } from '../../api/teacher.js';
import { SkeletonDashboard } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';

const DAY_LABEL = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday'
};

function Kpi({ label, value, hint, tone = 'primary', icon }) {
  const toneMap = {
    primary:   'bg-primary-subtle text-primary',
    secondary: 'bg-secondary-subtle text-secondary',
    warning:   'bg-status-pending/10 text-status-pending',
    success:   'bg-status-verified/10 text-status-verified'
  };
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className={`h-9 w-9 rounded-lg grid place-items-center mb-3 ${toneMap[tone]}`}>
        <span className="text-xs font-bold">{icon}</span>
      </div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-2xl font-bold text-text-main mt-1">{value}</p>
      {hint && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data, loading, error, retry } = useFetch(() => getDashboard(), []);

  const firstName = user?.full_name?.split(' ')[0] || 'Teacher';

  return (
    <DashboardLayout
      pageTitle={`Good morning, ${firstName}`}
      pageSubtitle={data ? `Your classes · ${DAY_LABEL[data.day] || ''}` : 'Your dashboard'}
    >
      {loading && <SkeletonDashboard />}

      {!loading && error && (
        <ErrorState
          title="Couldn't load dashboard"
          message={error}
          onRetry={retry}
        />
      )}

      {!loading && !error && data && (
        <div className="space-y-6">

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Kpi
              label="Assigned classes"
              value={data.kpis.assignedClasses}
              hint="This academic year"
              tone="primary"
              icon="CL"
            />
            <Kpi
              label="Total students"
              value={data.kpis.totalStudents}
              hint="Across all classes"
              tone="primary"
              icon="ST"
            />
            <Kpi
              label="Today's sessions"
              value={data.kpis.todaySessions}
              hint={DAY_LABEL[data.day] || ''}
              tone="secondary"
              icon="TT"
            />
            <Kpi
              label="Pending attendance"
              value={data.kpis.pendingAttendance}
              hint={data.kpis.pendingAttendance > 0 ? 'Mark today\'s attendance' : 'All marked'}
              tone={data.kpis.pendingAttendance > 0 ? 'warning' : 'success'}
              icon="AT"
            />
          </div>

          {/* Today's schedule */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-main">Today's schedule</h2>
                <p className="text-xs text-text-muted">{DAY_LABEL[data.day] || '—'}</p>
              </div>
              <Link
                to="/teacher/timetable"
                className="text-xs font-medium text-primary hover:text-primary-active"
              >
                Full timetable →
              </Link>
            </header>

            {data.todaySchedule.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">
                No sessions scheduled for today.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-semibold">Time</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Class</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Subject</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {data.todaySchedule.map((s) => (
                    <tr key={s.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-text-main">
                        {String(s.start_time).slice(0, 5)} – {String(s.end_time).slice(0, 5)}
                      </td>
                      <td className="px-5 py-3 text-text-main">{s.class_name}</td>
                      <td className="px-5 py-3 text-text-muted">{s.subject}</td>
                      <td className="px-5 py-3 text-text-muted">{s.room || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Activity + Classes + Notices */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Recent activity (new) */}
            <section className="bg-surface border border-border rounded-2xl overflow-hidden lg:col-span-1">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">Recent activity</h2>
                <p className="text-xs text-text-muted">Your latest actions</p>
              </header>
              <ActivityFeed />
            </section>

            {/* Classes */}
            <section className="bg-surface border border-border rounded-2xl overflow-hidden lg:col-span-1">
              <header className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-main">My classes</h2>
                <Link to="/teacher/classes" className="text-xs font-medium text-primary hover:text-primary-active">
                  View all →
                </Link>
              </header>
              <ul className="divide-y divide-border">
                {data.classes.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/teacher/classes/${c.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-primary-subtle/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-main truncate">{c.name}</p>
                        <p className="text-xs text-text-muted">{c.academic_year}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-primary-subtle text-primary font-medium shrink-0">
                        {c.student_count} students
                      </span>
                    </Link>
                  </li>
                ))}
                {data.classes.length === 0 && (
                  <li className="px-5 py-8 text-center text-sm text-text-muted">
                    No classes assigned yet.
                  </li>
                )}
              </ul>
            </section>

            {/* Notices */}
            <section className="bg-surface border border-border rounded-2xl overflow-hidden lg:col-span-1">
              <header className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-main">Recent notices</h2>
                <Link to="/teacher/notices" className="text-xs font-medium text-primary hover:text-primary-active">
                  View all →
                </Link>
              </header>
              <ul className="divide-y divide-border">
                {data.recentNotices.slice(0, 5).map((n) => (
                  <li key={n.id}>
                    <Link
                      to={`/teacher/notices/${n.id}`}
                      className="block px-5 py-3 hover:bg-primary-subtle/40 transition-colors"
                    >
                      <p className="text-sm font-medium text-text-main line-clamp-2">{n.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {n.audience} · {new Date(n.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </Link>
                  </li>
                ))}
                {data.recentNotices.length === 0 && (
                  <li className="px-5 py-8 text-center text-sm text-text-muted">
                    No notices yet.
                  </li>
                )}
              </ul>
            </section>
          </div>

          {/* Quick actions */}
          <section className="bg-surface border border-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-text-main mb-3">Quick actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/teacher/attendance"
                className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold px-4 py-2.5 transition-colors"
              >
                Mark attendance
              </Link>
              <Link
                to="/teacher/exams"
                className="rounded-lg bg-secondary hover:bg-secondary-hover text-text-inverse text-xs font-semibold px-4 py-2.5 transition-colors"
              >
                Enter exam marks
              </Link>
              <Link
                to="/teacher/classes"
                className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2.5 hover:bg-background transition-colors"
              >
                View class rosters
              </Link>
            </div>
          </section>

        </div>
      )}
    </DashboardLayout>
  );
}
/* ─── Activity feed ─────────────────────────────────────── */

function ActivityFeed() {
  const { data, loading } = useFetch(() => getActivity(), []);

  if (loading) {
    return (
      <ul className="divide-y divide-border">
        {[0,1,2].map((i) => (
          <li key={i} className="px-5 py-3">
            <div className="h-3 bg-border rounded animate-pulse w-3/4 mb-2" />
            <div className="h-2 bg-border rounded animate-pulse w-1/2" />
          </li>
        ))}
      </ul>
    );
  }

  const events = data || [];

  if (events.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-xs text-text-muted">No activity yet.</p>
        <p className="text-[11px] text-text-muted mt-1">
          Mark attendance or save marks to see it here.
        </p>
      </div>
    );
  }

  const ICON_MAP = {
    attendance: { icon: '✓', bg: 'bg-status-verified/10 text-status-verified' },
    marks:      { icon: '📝', bg: 'bg-secondary-subtle text-secondary' }
  };

  function timeAgo(iso) {
    if (!iso) return '—';
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60)    return 'just now';
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  return (
    <ul className="divide-y divide-border max-h-[300px] overflow-y-auto">
      {events.map((e, i) => {
        const cfg = ICON_MAP[e.type] || ICON_MAP.marks;
        return (
          <li key={i} className="px-5 py-3">
            <div className="flex items-start gap-3">
              <span className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 text-xs font-bold ${cfg.bg}`}>
                {cfg.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-main truncate">{e.title}</p>
                <p className="text-[10px] text-text-muted mt-0.5 truncate">{e.subtitle}</p>
              </div>
              <span className="text-[10px] text-text-muted shrink-0">
                {timeAgo(e.when)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}