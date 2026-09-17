import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Spinner from '../../components/Spinner.jsx';
import { getNotice } from '../../api/student.js';

function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

const AUDIENCE_LABEL = {
  ALL:      'All users',
  STUDENTS: 'All students'
};

export default function StudentNoticeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getNotice(id);
        if (!cancelled) setNotice(res);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load notice');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <DashboardLayout
      pageTitle="Notice"
      pageSubtitle={notice ? notice.title : 'Loading…'}
    >
      <div className="mb-4">
        <button
          onClick={() => navigate('/student/notices')}
          className="text-xs text-primary hover:text-primary-active font-medium"
        >
          ← Back to Notices
        </button>
      </div>

      {loading && (
        <div className="py-24 grid place-items-center">
          <Spinner size="lg" label="Loading notice..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-4 py-3 text-sm text-status-tampered">
          {error}
        </div>
      )}

      {!loading && !error && notice && (
        <article className="bg-surface border border-border rounded-2xl overflow-hidden max-w-3xl mx-auto">

          {/* Header */}
          <header className="px-6 py-5 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-subtle text-primary">
                {AUDIENCE_LABEL[notice.audience] || notice.audience}
              </span>
            </div>
            <h1 className="text-lg font-bold text-text-main leading-snug">
              {notice.title}
            </h1>
            <p className="text-xs text-text-muted mt-2">
              {notice.published_by_name ? `${notice.published_by_name} · ` : ''}
              {fmtDateTime(notice.published_at)}
            </p>
          </header>

          {/* Body */}
          <div className="px-6 py-6">
            <p className="text-sm text-text-main whitespace-pre-line leading-relaxed">
              {notice.message}
            </p>
          </div>

          {/* Footer note */}
          <footer className="px-6 py-4 border-t border-border bg-background">
            <p className="text-[11px] text-text-muted">
              This notice was published to your institutional feed. Reach out to your class teacher
              or the administration office for any clarification.
            </p>
          </footer>
        </article>
      )}
    </DashboardLayout>
  );
}