import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Spinner from '../../components/Spinner.jsx';
import { getNotices } from '../../api/student.js';

function timeAgo(iso) {
  if (!iso) return '—';
  const then = new Date(iso);
  const now = new Date();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60)    return 'just now';
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const AUDIENCE_CHIP = {
  ALL:      'bg-primary-subtle text-primary',
  STUDENTS: 'bg-secondary-subtle text-secondary'
};

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getNotices();
        if (!cancelled) setNotices(res);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load notices');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardLayout
      pageTitle="Notices"
      pageSubtitle="Announcements from your institution"
    >
      {loading && (
        <div className="py-24 grid place-items-center">
          <Spinner size="lg" label="Loading notices..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-4 py-3 text-sm text-status-tampered">
          {error}
        </div>
      )}

      {!loading && !error && notices.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-12 max-w-lg mx-auto text-center">
          <div className="h-12 w-12 rounded-full bg-primary-subtle text-primary grid place-items-center mx-auto mb-3">
            <span className="text-xl">📭</span>
          </div>
          <h3 className="text-sm font-bold text-text-main">No notices yet</h3>
          <p className="text-xs text-text-muted mt-1">
            When the institution publishes announcements, they'll show up here.
          </p>
        </div>
      )}

      {!loading && !error && notices.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">
            {notices.length} {notices.length === 1 ? 'notice' : 'notices'}
          </p>

          {notices.map((n) => (
            <Link
              key={n.id}
              to={`/student/notices/${n.id}`}
              className="block bg-surface border border-border rounded-2xl p-5
                         hover:border-primary hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${AUDIENCE_CHIP[n.audience] || ''}`}>
                      {n.audience}
                    </span>
                    <span className="text-[11px] text-text-muted">{timeAgo(n.published_at)}</span>
                  </div>

                  <h3 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                    {n.title}
                  </h3>

                  {/* Truncated preview — 2 lines */}
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">
                    {n.message}
                  </p>
                </div>

                <span className="text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform shrink-0 self-center">
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}