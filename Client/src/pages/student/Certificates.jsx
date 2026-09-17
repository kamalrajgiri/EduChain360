import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Spinner from '../../components/Spinner.jsx';
import { getCertificates } from '../../api/student.js';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function StudentCertificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCertificates();
        if (!cancelled) setCerts(res);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load certificates');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardLayout
      pageTitle="My Certificates"
      pageSubtitle="Blockchain-verified academic credentials"
    >
      {loading && (
        <div className="py-24 grid place-items-center">
          <Spinner size="lg" label="Loading certificates..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-4 py-3 text-sm text-status-tampered">
          {error}
        </div>
      )}

      {!loading && !error && certs.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-12 max-w-lg mx-auto text-center">
          <div className="h-12 w-12 rounded-full bg-primary-subtle text-primary grid place-items-center mx-auto mb-3">
            <span className="text-xl">🎓</span>
          </div>
          <h3 className="text-sm font-bold text-text-main">No certificates issued yet</h3>
          <p className="text-xs text-text-muted mt-1">
            Once your institution issues a certificate, it will appear here with a QR code for verification.
          </p>
        </div>
      )}

      {!loading && !error && certs.length > 0 && (
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

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
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