import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getMyClasses, getClassDetail, getAttendance, saveAttendance } from '../../api/teacher.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'P',  full: 'Present', color: 'bg-status-verified text-text-inverse',  ring: 'ring-status-verified' },
  { value: 'ABSENT',  label: 'A',  full: 'Absent',  color: 'bg-status-tampered text-text-inverse',  ring: 'ring-status-tampered' },
  { value: 'LATE',    label: 'L',  full: 'Late',    color: 'bg-status-pending text-text-inverse',   ring: 'ring-status-pending' },
  { value: 'LEAVE',   label: 'Lv', full: 'Leave',   color: 'bg-primary text-text-inverse',          ring: 'ring-primary' }
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initialsOf(name) {
  if (!name) return 'ST';
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function TeacherAttendance() {
  const [searchParams, setSearchParams] = useSearchParams();

  const classesFetch = useFetch(() => getMyClasses(), []);
  const classes = classesFetch.data || [];

  const [classId, setClassId] = useState(searchParams.get('class') || '');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(todayISO());

  const [statusMap, setStatusMap] = useState({});
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', msg: '' });

  // Auto-select first class when list arrives
  useEffect(() => {
    if (!classId && classes.length > 0) {
      setClassId(String(classes[0].id));
    }
  }, [classes, classId]);

  // Sync class to URL so links from ClassDetail preselect correctly
  useEffect(() => {
    if (classId) {
      const next = new URLSearchParams(searchParams);
      next.set('class', classId);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const detailFetch = useFetch(
    classId ? () => getClassDetail(classId) : null,
    [classId]
  );

  const subjects = detailFetch.data?.subjects || [];
  const roster = detailFetch.data?.roster || [];

  // Auto-select first subject
  useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(String(subjects[0].id));
    }
    if (subjects.length > 0 && subjectId && !subjects.find((s) => String(s.id) === subjectId)) {
      setSubjectId(String(subjects[0].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects]);

  // Load existing attendance when class+subject+date changes
  useEffect(() => {
    if (!classId || !subjectId || !date) return;
    let cancelled = false;
    setLoadingRoster(true);
    (async () => {
      try {
        const res = await getAttendance({
          class_id: Number(classId),
          subject_id: Number(subjectId),
          date
        });
        if (cancelled) return;
        const init = {};
        for (const s of res.roster) {
          init[s.student_id] = res.saved[s.student_id] || 'PRESENT';
        }
        setStatusMap(init);
      } catch {
        if (!cancelled) setStatusMap({});
      } finally {
        if (!cancelled) setLoadingRoster(false);
      }
    })();
    return () => { cancelled = true; };
  }, [classId, subjectId, date]);

  useEffect(() => {
    if (!toast.msg) return;
    const t = setTimeout(() => setToast({ type: '', msg: '' }), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  function setStatus(studentId, status) {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAll(status) {
    const next = {};
    for (const s of roster) next[s.student_id] = status;
    setStatusMap(next);
  }

  async function handleSave() {
    if (!classId || !subjectId || !date) return;
    setSaving(true);
    try {
      const entries = roster.map((s) => ({
        student_id: s.student_id,
        status: statusMap[s.student_id] || 'PRESENT'
      }));
      const res = await saveAttendance({
        class_id: Number(classId),
        subject_id: Number(subjectId),
        date,
        entries
      });
      setToast({ type: 'success', msg: res.message || 'Attendance saved' });
    } catch (e) {
      setToast({ type: 'error', msg: e.response?.data?.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  }

  const currentClass = classes.find((c) => String(c.id) === classId);
  const currentSubject = subjects.find((s) => String(s.id) === subjectId);

  const summary = useMemo(() => {
    const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
    for (const s of roster) {
      const st = statusMap[s.student_id] || 'PRESENT';
      counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  }, [roster, statusMap]);

  return (
    <DashboardLayout
      pageTitle="Attendance"
      pageSubtitle={currentClass ? `${currentClass.name} · ${date}` : 'Mark daily attendance'}
    >
      {/* Toast */}
      {toast.msg && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
          toast.type === 'success'
            ? 'border-status-verified/30 bg-status-verified/5 text-status-verified'
            : 'border-status-tampered/30 bg-status-tampered/5 text-status-tampered'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-5 space-y-3">

        {classesFetch.loading && (
          <p className="text-xs text-text-muted">Loading classes…</p>
        )}

        {!classesFetch.loading && classes.length === 0 && (
          <p className="text-xs text-text-muted">No classes assigned to you yet.</p>
        )}

        {classes.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
                  Class
                </label>
                <select
                  value={classId}
                  onChange={(e) => { setClassId(e.target.value); setSubjectId(''); }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs
                             text-text-main focus:outline-none focus:border-primary"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.student_count} students
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
                  Subject
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  disabled={subjects.length === 0}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs
                             text-text-main focus:outline-none focus:border-primary disabled:opacity-50"
                >
                  {subjects.length === 0 && <option>—</option>}
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  max={todayISO()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs
                             text-text-main focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Subject pills for quick switch */}
            {subjects.length > 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSubjectId(String(s.id))}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                      String(s.id) === subjectId
                        ? 'bg-primary text-text-inverse'
                        : 'bg-background border border-border text-text-main hover:border-primary'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {detailFetch.loading && <SkeletonTable rows={6} cols={4} />}
      {!detailFetch.loading && detailFetch.error && (
        <ErrorState title="Couldn't load class" message={detailFetch.error} onRetry={detailFetch.retry} />
      )}

      {!detailFetch.loading && !detailFetch.error && currentClass && roster.length === 0 && (
        <EmptyState
          icon="👥"
          title="No students enrolled"
          message="Once the admin enrolls students in this class, they'll appear here for attendance."
        />
      )}

      {!detailFetch.loading && !detailFetch.error && currentClass && roster.length > 0 && (
        <div className="space-y-4">

          {/* Summary strip */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-surface border border-border rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Present</p>
              <p className="text-lg font-bold text-status-verified mt-0.5">{summary.PRESENT || 0}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Absent</p>
              <p className="text-lg font-bold text-status-tampered mt-0.5">{summary.ABSENT || 0}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Late</p>
              <p className="text-lg font-bold text-status-pending mt-0.5">{summary.LATE || 0}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Leave</p>
              <p className="text-lg font-bold text-primary mt-0.5">{summary.LEAVE || 0}</p>
            </div>
          </div>

          {/* Roster */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-text-main">
                  {currentSubject ? currentSubject.name : 'Roster'}
                </h2>
                <p className="text-xs text-text-muted">
                  {roster.length} student{roster.length === 1 ? '' : 's'}
                  {currentSubject ? ` · ${currentSubject.code}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => markAll('PRESENT')}
                  className="rounded-lg border border-border text-text-main text-xs font-medium px-3 py-1.5
                             hover:bg-background transition-colors"
                >
                  Mark all present
                </button>
                <button
                  onClick={() => markAll('ABSENT')}
                  className="rounded-lg border border-border text-text-main text-xs font-medium px-3 py-1.5
                             hover:bg-background transition-colors"
                >
                  Mark all absent
                </button>
              </div>
            </header>

            {loadingRoster ? (
              <div className="p-8 text-center text-sm text-text-muted">Loading attendance…</div>
            ) : (
              <ul className="divide-y divide-border">
                {roster.map((s) => {
                  const current = statusMap[s.student_id] || 'PRESENT';
                  return (
                    <li
                      key={s.student_id}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-primary-subtle/30 transition-colors"
                    >
                      <span className="text-text-muted font-mono text-xs w-8 shrink-0">
                        {String(s.roll_number).padStart(2, '0')}
                      </span>
                      <div className="h-8 w-8 rounded-full bg-primary text-text-inverse grid place-items-center text-[10px] font-bold shrink-0">
                        {initialsOf(s.name)}
                      </div>
                      <p className="text-sm font-medium text-text-main flex-1 min-w-0 truncate">
                        {s.name}
                      </p>

                      {/* Segmented control */}
                      <div className="flex gap-1 shrink-0">
                        {STATUS_OPTIONS.map((opt) => {
                          const active = current === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setStatus(s.student_id, opt.value)}
                              title={opt.full}
                              className={`w-8 h-8 rounded-lg text-[11px] font-bold grid place-items-center transition-all ${
                                active
                                  ? `${opt.color} shadow-sm`
                                  : 'bg-background border border-border text-text-muted hover:border-text-muted'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="px-5 py-4 border-t border-border bg-background flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[11px] text-text-muted">
                P = Present · A = Absent · L = Late · Lv = Leave
              </p>
              <button
                onClick={handleSave}
                disabled={saving || loadingRoster}
                className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                           text-xs font-semibold px-5 py-2.5 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving…' : 'Save attendance'}
              </button>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}