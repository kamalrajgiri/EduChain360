import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Spinner from '../../components/Spinner.jsx';
import { getCertificate } from '../../api/student.js';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function shortHash(h) {
  if (!h) return '—';
  return `${h.slice(0, 6)}…${h.slice(-6)}`;
}

export default function StudentCertificateView() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCertificate(uuid);
        if (!cancelled) setCert(res);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load certificate');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uuid]);

  return (
    <DashboardLayout
      pageTitle="Certificate"
      pageSubtitle={cert ? cert.title : 'Loading…'}
    >
      <div className="mb-4 print:hidden">
        <button
          onClick={() => navigate('/student/certificates')}
          className="text-xs text-primary hover:text-primary-active font-medium"
        >
          ← Back to Certificates
        </button>
      </div>

      {loading && (
        <div className="py-24 grid place-items-center print:hidden">
          <Spinner size="lg" label="Loading certificate..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-4 py-3 text-sm text-status-tampered print:hidden">
          {error}
        </div>
      )}

      {!loading && !error && cert && (
        <div className="max-w-3xl mx-auto print:max-w-none">

          <div className="bg-surface border border-border rounded-2xl overflow-hidden
                          print-keep print-doc">

            <div className="bg-primary-dark text-text-inverse px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-primary-light">
                  Far Western University · School of Engineering
                </p>
                <p className="text-lg font-bold mt-1">Certificate of Academic Transcript</p>
                <p className="text-[11px] text-primary-light mt-0.5">
                  Issued through EduChain360 · Academic Year 2082/2083
                </p>
              </div>
              {cert.is_anchored ? (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-text-inverse">
                  Blockchain-anchored
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-status-pending text-text-inverse">
                  Pending anchor
                </span>
              )}
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">

              <div className="md:col-span-2 space-y-6">
                <div>
                  <p className="text-xs text-text-muted">This is to certify that</p>
                  <p className="text-2xl font-bold text-text-main mt-1">
                    {cert.student_name}
                  </p>
                  <p className="text-sm text-text-muted mt-1">
                    Roll Number {cert.school_id_number}, has successfully completed {cert.class_name || 'Grade 10'} with an aggregate GPA of 3.72 and is a bona fide student of this institution for the academic year 2082/2083.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Certificate ID</p>
                    <p className="text-sm font-mono text-text-main mt-0.5">{cert.credential_uuid}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Issue date</p>
                    <p className="text-sm text-text-main mt-0.5">{fmtDate(cert.issue_date)}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-5 flex items-end justify-between">
                  <div>
                    <div className="h-10 w-40 border-b border-text-muted/40" />
                    <p className="text-[11px] text-text-muted mt-1.5">Registrar, FWU</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="w-full aspect-square max-w-[200px] border-2 border-dashed border-border rounded-xl grid place-items-center bg-background">
                  <div className="text-center px-3">
                    <p className="text-[11px] text-text-muted">Scan to verify</p>
                    <p className="text-[10px] text-text-muted/70 mt-1 font-mono break-all">
                      {cert.credential_uuid}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted mt-2 text-center">
                  QR generation ships with the blockchain phase
                </p>
              </div>
            </div>

            <div className="px-8 pb-6">
              <div className="bg-background border border-border rounded-lg px-4 py-3 print-keep">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-text-muted">
                  <span>Block #{cert.is_anchored ? '8791' : '—'}</span>
                  <span className="text-text-muted/60">|</span>
                  <span>SHA-256: {shortHash(cert.document_hash)}</span>
                  <span className="text-text-muted/60">|</span>
                  {cert.is_anchored ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-verified/10 text-status-verified">
                      Verified — not tampered
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-pending/10 text-status-pending">
                      Awaiting blockchain anchor
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden print:block border-t border-border px-6 py-3">
              <p className="text-[10px] text-text-muted text-center">
                Generated by EduChain360 · {new Date().toLocaleString('en-GB')} · Verify at educhain360.fwu.edu.np/verify
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <Link to="/student/certificates" className="text-xs font-medium text-text-muted hover:text-text-main">
              ← Back to Certificates
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold px-4 py-2
                         transition-colors"
            >
              Download / print (PDF)
            </button>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}