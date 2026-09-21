import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getAllExams } from '../../api/student.js';
import { SkeletonCard, SkeletonTable } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

function GradeBadge({ grade }) {
  const tone =
    grade === 'A+' || grade === 'A' ? 'bg-status-verified/10 text-status-verified' :
    grade === 'B+' || grade === 'B' ? 'bg-primary-subtle text-primary' :
    grade === 'C' || grade === 'D'  ? 'bg-status-pending/10 text-status-pending' :
    grade === 'F'                    ? 'bg-status-tampered/10 text-status-tampered' :
                                       'bg-background text-text-muted';
  return (
    <span className={`inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 rounded-full text-[11px] font-semibold ${tone}`}>
      {grade || '—'}
    </span>
  );
}

function remarkFor(pct) {
  if (pct >= 90) return 'Outstanding';
  if (pct >= 80) return 'Excellent';
  if (pct >= 70) return 'Very good';
  if (pct >= 60) return 'Good';
  if (pct >= 50) return 'Satisfactory';
  if (pct >= 40) return 'Needs work';
  return 'Failed';
}

/* ─── Report card ────────────────────────────────────── */

function ReportCard({ exam, student, enrollment }) {
  const totalFull = exam.subjects.reduce((s, r) => s + r.full_marks, 0);
  const totalObt  = exam.subjects.reduce((s, r) => s + r.marks_obtained, 0);
  const status    = exam.aggregate >= 40 ? 'PASS' : 'FAIL';

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden print-keep print-doc">

      <div className="bg-primary-dark text-text-inverse px-6 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-secondary grid place-items-center text-sm font-bold shrink-0">
              EC
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary-light">
                Far Western University · School of Engineering
              </p>
              <p className="text-base font-bold mt-0.5">Academic Report Card</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-text-inverse">
              {exam.exam_type}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Student</p>
          <p className="text-sm font-semibold text-text-main mt-0.5">{student?.full_name || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Roll No.</p>
          <p className="text-sm font-semibold text-text-main mt-0.5">
            {enrollment?.roll_number ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Exam</p>
          <p className="text-sm font-semibold text-text-main mt-0.5">{exam.exam_name}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Date</p>
          <p className="text-sm font-semibold text-text-main mt-0.5">
            {new Date(exam.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="px-6 py-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-text-main/20">
              <th className="text-left py-2 font-semibold text-text-main text-xs uppercase tracking-wider">Subject</th>
              <th className="text-right py-2 font-semibold text-text-main text-xs uppercase tracking-wider w-20">Full</th>
              <th className="text-right py-2 font-semibold text-text-main text-xs uppercase tracking-wider w-20">Obtained</th>
              <th className="text-center py-2 font-semibold text-text-main text-xs uppercase tracking-wider w-20">Grade</th>
              <th className="text-right py-2 font-semibold text-text-main text-xs uppercase tracking-wider w-32 hidden sm:table-cell">Remark</th>
            </tr>
          </thead>
          <tbody>
            {exam.subjects.map((s, i) => {
              const pct = (s.marks_obtained / s.full_marks) * 100;
              return (
                <tr key={i} className="border-b border-border/70">
                  <td className="py-2.5 text-text-main font-medium">{s.subject}</td>
                  <td className="py-2.5 text-right text-text-muted tabular-nums">{s.full_marks}</td>
                  <td className="py-2.5 text-right text-text-main font-semibold tabular-nums">{s.marks_obtained}</td>
                  <td className="py-2.5 text-center"><GradeBadge grade={s.grade} /></td>
                  <td className="py-2.5 text-right text-text-muted text-xs hidden sm:table-cell">
                    {remarkFor(pct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-text-main/30">
              <td className="py-3 text-sm font-bold text-text-main">Total</td>
              <td className="py-3 text-right font-bold text-text-main tabular-nums">{totalFull}</td>
              <td className="py-3 text-right font-bold text-text-main tabular-nums">{totalObt}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-6 pb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-background border border-border rounded-xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Percentage</p>
            <p className="text-lg font-bold text-primary mt-0.5">{exam.aggregate}%</p>
          </div>
          <div className="bg-background border border-border rounded-xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Grade</p>
            <div className="mt-1"><GradeBadge grade={exam.grade} /></div>
          </div>
          <div className={`rounded-xl px-4 py-3 border ${
            status === 'PASS'
              ? 'bg-status-verified/10 border-status-verified/20'
              : 'bg-status-tampered/10 border-status-tampered/20'
          }`}>
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Result</p>
            <p className={`text-lg font-bold mt-0.5 ${
              status === 'PASS' ? 'text-status-verified' : 'text-status-tampered'
            }`}>{status}</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="bg-background border border-border rounded-lg px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-text-muted">
            <span>SHA-256: ——</span>
            <span className="text-text-muted/60">|</span>
            <span>Block #—</span>
            <span className="text-text-muted/60">|</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                             bg-status-pending/10 text-status-pending">
              Awaiting blockchain anchor
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 border-t border-border grid grid-cols-2 gap-8">
        <div>
          <div className="h-10 border-b border-text-muted/40" />
          <p className="text-[11px] text-text-muted mt-1.5">Class Teacher</p>
        </div>
        <div>
          <div className="h-10 border-b border-text-muted/40" />
          <p className="text-[11px] text-text-muted mt-1.5">Registrar</p>
        </div>
      </div>

      <div className="hidden print:block border-t border-border px-6 py-3">
        <p className="text-[10px] text-text-muted text-center">
          Generated by EduChain360 · {new Date().toLocaleString('en-GB')}
        </p>
      </div>
    </div>
  );
}

/* ─── Insights strip ─────────────────────────────────────── */

function Insights({ exam }) {
  if (!exam.subjects || exam.subjects.length < 2) return null;

  const sorted = [...exam.subjects].sort(
    (a, b) => (b.marks_obtained / b.full_marks) - (a.marks_obtained / a.full_marks)
  );
  const best = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const bestPct = Math.round((best.marks_obtained / best.full_marks) * 100);
  const weakestPct = Math.round((weakest.marks_obtained / weakest.full_marks) * 100);
  const spread = bestPct - weakestPct;

  return (
    <section className="bg-surface border border-border rounded-2xl p-5 print:hidden">
      <h2 className="text-sm font-bold text-text-main mb-3">Insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-background border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Strongest</p>
          <p className="text-sm font-bold text-status-verified mt-0.5">{best.subject}</p>
          <p className="text-[11px] text-text-muted mt-0.5">{bestPct}% · Grade {best.grade}</p>
        </div>
        <div className="bg-background border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Needs focus</p>
          <p className="text-sm font-bold text-status-pending mt-0.5">{weakest.subject}</p>
          <p className="text-[11px] text-text-muted mt-0.5">{weakestPct}% · Grade {weakest.grade}</p>
        </div>
        <div className="bg-background border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Score spread</p>
          <p className="text-sm font-bold text-text-main mt-0.5">{spread} pts</p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {spread <= 15 ? 'Well balanced' : spread <= 30 ? 'Moderate variance' : 'Wide variance'}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Main page ──────────────────────────────────────── */

export default function StudentResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, retry } = useFetch(() => getAllExams(), []);
  const [activeIdx, setActiveIdx] = useState(0);

  const exams = data?.exams || [];
  const activeExam = exams[activeIdx];

  return (
    <DashboardLayout pageTitle="Results" pageSubtitle="Examination results & report card">
      {loading && (
        <div className="space-y-6">
          <SkeletonTable rows={5} cols={4} />
          <SkeletonCard lines={3} />
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Couldn't load your results" message={error} onRetry={retry} />
      )}

      {!loading && !error && exams.length === 0 && (
        <EmptyState
          icon="📋"
          title="No results published yet"
          message="Your exam results will appear here once teachers submit them."
        />
      )}

      {!loading && !error && activeExam && (
        <div className="space-y-5">

          {/* Exam switcher */}
          <div className="flex flex-wrap gap-2 print:hidden">
            {exams.map((ex, idx) => (
              <button
                key={`${ex.exam_name}-${idx}`}
                onClick={() => setActiveIdx(idx)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  idx === activeIdx
                    ? 'bg-primary text-text-inverse'
                    : 'bg-surface border border-border text-text-main hover:border-primary'
                }`}
              >
                {ex.exam_name}
              </button>
            ))}
          </div>

          <ReportCard
            exam={activeExam}
            student={user}
            enrollment={null}
          />

          {/* Insights */}
          <Insights exam={activeExam} />

          <div className="flex items-center justify-between print:hidden">
            <button
              onClick={() => navigate('/student')}
              className="text-xs font-medium text-text-muted hover:text-text-main"
            >
              ← Back to dashboard
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                         text-xs font-semibold px-4 py-2 transition-colors"
            >
              Download / print report card
            </button>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}