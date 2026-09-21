import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getCertificates } from '../../api/student.js';
import { SkeletonCard } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function StudentCertificates() {
  const { data: certs, loading, error, retry } = useFetch(() => getCertificates(), []);

  return (
    <DashboardLayout
      pageTitle="My Certificates"
      pageSubtitle="Academic credentials issued by your institution"
    >
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Couldn't load certificates" message={error} onRetry={retry} />
      )}

      {!loading && !error && (!certs || certs.length === 0) && (
        <EmptyState
          icon="🎓"
          title="No certificates issued yet"
          message="Once your institution issues a certificate, it will appear here with a unique verification code."
        />
      )}

      {!loading && !error && certs && certs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {certs.map((c) => (
            <Link
              key={c.id}
              to={`/student/certificates/${c.credential_uuid}`}
              className="bg-surface border border-border rounded-2xl p-5 hover:border-primary hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-secondary-subtle text-secondary grid place-items-center text-xs font-bold">
                  CE
                </div>
                {c.is_anchored ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-subtle text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-pending/10 text-status-pending">
                    Pending
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                {c.title}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Issued {fmtDate(c.issue_date)}
              </p>

              {/* Verify code — unique per certificate */}
              <div className="mt-3 bg-background border border-border rounded-lg px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">Verify code</p>
                <p className="text-xs font-mono font-semibold text-primary mt-0.5">
                  {c.verify_code || '—'}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-muted truncate">
                  {c.credential_uuid}
                </span>
                <span className="text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform">
                  View →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}