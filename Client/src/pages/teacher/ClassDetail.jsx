import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getClassDetail, getStudentAttendance } from '../../api/teacher.js';
import { SkeletonCard, SkeletonTable } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import ExportButton from '../../components/ExportButton.jsx';
import { todayStamp } from '../../utils/csv.js';

function initialsOf(name) {
  if (!name) return 'ST';
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

/* ─── Student attendance summary modal ───────────────────── */

function StudentAttendanceModal({ student, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getStudentAttendance(student.student_id);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [student.student_id]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">{student.name}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Roll {student.roll_number} · {student.school_id_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="py-8 text-center text-xs text-text-muted">Loading…</div>
        )}

        {!loading && error && (
          <div className="py-8 text-center text-xs text-status-tampered">{error}</div>
        )}

        {!loading && !error && data && (
          <section className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background text-[10px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="text-left  px-4 py-2 font-semibold">Subject</th>
                  <th className="text-right px-4 py-2 font-semibold">Total</th>
                  <th className="text-right px-4 py-2 font-semibold">Present</th>
                  <th className="text-right px-4 py-2 font-semibold">Late</th>
                  <th className="text-right px-4 py-2 font-semibold">Absent</th>
                  <th className="text-right px-4 py-2 font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {data.subjectTotals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-xs text-text-muted">
                      No attendance records yet.
                    </td>
                  </tr>
                )}
                {data.subjectTotals.map((r) => {
                  const pct = Number(r.total) > 0
                    ? Math.round((Number(r.present) / Number(r.total)) * 100)
                    : 0;
                  const tone = pct >= 90 ? 'text-status-verified'
                             : pct >= 75 ? 'text-status-pending'
                             : 'text-status-tampered';
                  return (
                    <tr key={r.subject_id} className="border-t border-border">
                      <td className="px-4 py-2 text-text-main">{r.subject}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{r.total}</td>
                      <td className="px-4 py-2 text-right text-status-verified tabular-nums">{r.present}</td>
                      <td className="px-4 py-2 text-right text-status-pending tabular-nums">{r.late}</td>
                      <td className="px-4 py-2 text-right text-status-tampered tabular-nums">{r.absent}</td>
                      <td className={`px-4 py-2 text-right font-semibold tabular-nums ${tone}`}>
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2
                       hover:bg-background transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function TeacherClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, retry } = useFetch(() => getClassDetail(classId), [classId]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const cls = data?.class;
  const subjects = data?.subjects || [];
  const roster = data?.roster || [];

  return (
    <DashboardLayout
      pageTitle={cls ? cls.name : 'Class'}
      pageSubtitle={cls ? `${cls.academic_year} · ${roster.length} students` : 'Loading…'}
    >
      <div className="mb-4">
        <button
          onClick={() => navigate('/teacher/classes')}
          className="text-xs text-primary hover:text-primary-active font-medium"
        >
          ← Back to My Classes
        </button>
      </div>

      {loading && (
        <div className="space-y-6">
          <SkeletonCard lines={3} />
          <SkeletonTable rows={5} cols={4} />
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Couldn't load class" message={error} onRetry={retry} />
      )}

      {!loading && !error && data && (
        <div className="space-y-6">

          {/* Subjects I teach */}
          <section className="bg-surface border border-border rounded-2xl p-5">
            <header className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-text-main">Subjects I teach</h2>
                <p className="text-xs text-text-muted">
                  {subjects.length} subject{subjects.length === 1 ? '' : 's'} in this class
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/teacher/attendance?class=${classId}`}
                  className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold px-3.5 py-2 transition-colors"
                >
                  Mark attendance
                </Link>
                <Link
                  to={`/teacher/exams?class=${classId}`}
                  className="rounded-lg bg-secondary hover:bg-secondary-hover text-text-inverse text-xs font-semibold px-3.5 py-2 transition-colors"
                >
                  Enter marks
                </Link>
              </div>
            </header>

            {subjects.length === 0 ? (
              <p className="text-xs text-text-muted py-3">No subjects assigned to you in this class.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-subtle text-primary text-xs font-medium"
                  >
                    {s.name}
                    <span className="text-[10px] font-mono opacity-70">{s.code}</span>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Roster */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-text-main">Class roster</h2>
                <p className="text-xs text-text-muted">
                  {roster.length} student{roster.length === 1 ? '' : 's'} · click a row for attendance summary
                </p>
              </div>
              <ExportButton
                label="Export roster"
                filename={`roster-${classId}-${todayStamp()}.csv`}
                rows={roster}
                columns={[
                  { key: 'roll_number',      label: 'Roll' },
                  { key: 'name',             label: 'Name' },
                  { key: 'school_id_number', label: 'Student ID' }
                ]}
              />
            </header>

            {roster.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">
                No students enrolled in this class yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="text-left  px-5 py-2.5 font-semibold w-20">Roll</th>
                      <th className="text-left  px-5 py-2.5 font-semibold">Student</th>
                      <th className="text-left  px-5 py-2.5 font-semibold hidden md:table-cell">Student ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((s) => (
                      <tr
                        key={s.student_id}
                        onClick={() => setSelectedStudent(s)}
                        className="border-t border-border hover:bg-primary-subtle/40 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3 text-text-muted font-mono text-xs">
                          {String(s.roll_number).padStart(2, '0')}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary text-text-inverse grid place-items-center text-[10px] font-bold shrink-0">
                              {initialsOf(s.name)}
                            </div>
                            <span className="font-medium text-text-main">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-text-muted hidden md:table-cell font-mono text-xs">
                          {s.school_id_number}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      )}

      {selectedStudent && (
        <StudentAttendanceModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </DashboardLayout>
  );
}