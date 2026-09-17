import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useEffect, useState } from 'react';
import { Users, ClipboardCheck, BellRing, School } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getGreeting } from '../../utils/greeting.js';

const STATS = [
  { label: 'My Classes', value: '4', icon: School },
  { label: 'Total Students', value: '142', icon: Users },
  { label: 'Pending Attendance', value: '1', icon: ClipboardCheck },
  { label: 'Notices This Week', value: '3', icon: BellRing }
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const firstName = user?.full_name?.split(' ')[0] || 'Teacher';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <DashboardLayout
      pageTitle={`${getGreeting(now)}, ${firstName}`}
      pageSubtitle="Your classes, attendance, and notices for today"
    >
      <div className="space-y-6">
        <section className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-xs text-text-muted">Today</p>
          <p className="text-sm text-text-main mt-1">
            {now.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-surface border border-border rounded-2xl p-5">
                <div className="h-9 w-9 rounded-lg bg-secondary-subtle text-secondary grid place-items-center mb-3">
                  <Icon size={18} />
                </div>
                <p className="text-xs text-text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-text-main mt-1">{stat.value}</p>
              </div>
            );
          })}
        </section>

        <section className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-text-main">Today&apos;s schedule</h2>
          <p className="text-sm text-text-muted mt-2">No upcoming sessions right now.</p>
        </section>
      </div>
    </DashboardLayout>
  );
}