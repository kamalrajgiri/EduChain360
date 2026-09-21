import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import {
  getMyClasses,
  getClassDetail,
  getExams,
  getExamDetailByName,
  saveExams
} from '../../api/teacher.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

function gradeFromPct(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ─── Editor ─────────────────────────────────────────────── */

function MarksheetEditor({ classId, editExamName, onCancel, onSaved }) {
  const isEditMode = !!editExamName;

  const [examName, setExamName] = useState(editExamName || '');
  const [examDate, setExamDate] = useState(todayISO());
  const [fullMarks, setFullMarks] = useState({});
  const [marks, setMarks] = useState({});
  const [prefilled, setPrefilled] = useState(!isEditMode);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const detailFetch = useFetch(() => getClassDetail(classId), [classId]);
  const classSubjects = detailFetch.data?.subjects || [];
  const roster = detailFetch.data?.roster || [];

  // In edit mode, load existing exam
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getExamDetailByName(editExamName, Number(classId));
        if (cancelled) return;

        setExamDate(String(res.exam_date).slice(0, 10));

        const fm = {};
        for (const s of res.subjects) fm[s.subject_id] = s.full_marks;
        setFullMarks(fm);

        // Marks come as `${studentId}:${subjectId}` → value
        const mk = {};
        for (const [k, v] of Object.entries(res.marks || {})) {
          mk[k] = v;
        }
        setMarks(mk);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.message || 'Failed to load exam');
      } finally {
        if (!cancelled) setPrefilled(true);
      }
    })();
    return () => { cancelled = true; };
  }, [editExamName, classId, isEditMode]);

  // Default full marks to 100 per subject (new mode only)
  useEffect(() => {
    if (isEditMode) return;
    if (classSubjects.length === 0) return;
    setFullMarks((prev) => {
      const next = { ...prev };
      for (const s of classSubjects) {
        if (next[s.id] == null) next[s.id] = 100;
      }
      return next;
    });
  }, [classSubjects, isEditMode]);

  function setMark(studentId, subjectId, value) {
    const max = Number(fullMarks[subjectId]) || 100;
    const num = value === '' ? '' : Math.max(0, Math.min(max, Number(value) || 0));
    setMarks((prev) => ({ ...prev, [`${studentId}:${subjectId}`]: num }));
  }

  async function handleSave() {
    setErr('');
    if (!examName.trim()) return setErr('Exam name is required');
    if (!examDate) return setErr('Exam date is required');

    setSaving(true);
    try {
      const subjectsPayload = classSubjects.map((sub) => ({
        subject_id: sub.id,
        full_marks: Number(fullMarks[sub.id]) || 100,
        marks: roster.map((st) => ({
          student_id: st.student_id,
          marks_obtained: marks[`${st.student_id}:${sub.id}`] ?? ''
        }))
      }));

      const res = await saveExams({
        class_id: Number(classId),
        exam_name: examName.trim(),
        exam_date: examDate,
        subjects: subjectsPayload
      });

      onSaved(res);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save');
      setSaving(false);
    }
  }

  const totalFullMarks = useMemo(
    () => classSubjects.reduce((sum, s) => sum + (Number(fullMarks[s.id]) || 0), 0),
    [classSubjects, fullMarks]
  );

  function totalFor(studentId) {
    let total = 0;
    for (const s of classSubjects) {
      const v = Number(marks[`${studentId}:${s.id}`]);
      if (!Number.isNaN(v)) total += v;
    }
    return total;
  }

  function pctFor(studentId) {
    if (totalFullMarks === 0) return 0;
    return (totalFor(studentId) / totalFullMarks) * 100;
  }

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={onCancel}
          className="text-xs font-medium text-primary hover:text-primary-active"
        >
          ← Back to marksheets
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !prefilled}
          className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                     text-xs font-semibold px-5 py-2.5 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : (isEditMode ? 'Update marksheet' : 'Save marksheet')}
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-4 py-3 text-sm text-status-tampered">
          {err}
        </div>
      )}

      {/* Exam meta */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
<h2 className="text-sm font-bold text-text-main">
  {isEditMode ? 'Editing saved exam' : 'New exam'}
  {detailFetch.data?.class?.name && (
    <span className="ml-2 text-[11px] font-normal text-text-muted">
      · {detailFetch.data.class.name}
    </span>
  )}
</h2>
          {isEditMode && (
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
              Reopening · {examName}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
              Exam name
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              disabled={isEditMode}
              placeholder="e.g. Mid-term 2083"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
                         text-text-main focus:outline-none focus:border-primary disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
              Exam date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
                         text-text-main focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      {/* Full marks per subject */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="text-sm font-bold text-text-main mb-3">Full marks per subject</h2>
        <div className="flex flex-wrap gap-2">
          {classSubjects.map((s) => (
            <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border">
              <span className="text-xs font-medium text-text-main">{s.name}</span>
              <span className="text-text-muted">/</span>
              <input
                type="number"
                min={1}
                value={fullMarks[s.id] ?? ''}
                onChange={(e) => setFullMarks({ ...fullMarks, [s.id]: e.target.value })}
                className="w-14 bg-transparent text-xs text-text-main focus:outline-none tabular-nums"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Marks grid */}
      <section className="bg-surface border border-border rounded-2xl overflow-hidden">
        <header className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-text-main">Enter marks</h2>
          <p className="text-xs text-text-muted">
            {roster.length} student{roster.length === 1 ? '' : 's'} × {classSubjects.length} subject{classSubjects.length === 1 ? '' : 's'}
            {isEditMode && !prefilled && ' · loading saved marks…'}
          </p>
        </header>

        {detailFetch.loading && <div className="p-8"><SkeletonTable rows={5} cols={5} /></div>}
        {!detailFetch.loading && roster.length === 0 && (
          <div className="p-8 text-center text-sm text-text-muted">No students in this class.</div>
        )}

        {!detailFetch.loading && roster.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-background text-[10px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold sticky left-0 bg-background z-10 w-14">Roll</th>
                  <th className="text-left px-4 py-2.5 font-semibold sticky left-14 bg-background z-10 min-w-[160px]">
                    Student
                  </th>
                  {classSubjects.map((s) => (
                    <th key={s.id} className="text-right px-3 py-2.5 font-semibold">
                      {s.name}
                      <span className="block text-[9px] text-text-muted/70 font-normal">
                        /{fullMarks[s.id] || 100}
                      </span>
                    </th>
                  ))}
                  <th className="text-right px-4 py-2.5 font-semibold">Total</th>
                  <th className="text-right px-4 py-2.5 font-semibold">%</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Grade</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((st) => {
                  const total = totalFor(st.student_id);
                  const pct = pctFor(st.student_id);
                  const filled = classSubjects.some(
                    (s) => marks[`${st.student_id}:${s.id}`] !== '' && marks[`${st.student_id}:${s.id}`] != null
                  );
                  const grade = filled ? gradeFromPct(pct) : '—';
                  return (
                    <tr key={st.student_id} className="border-t border-border hover:bg-primary-subtle/30 transition-colors">
                      <td className="px-4 py-2 sticky left-0 bg-surface z-10 text-text-muted font-mono text-xs">
                        {String(st.roll_number).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-2 sticky left-14 bg-surface z-10 text-text-main font-medium">
                        {st.name}
                      </td>
                      {classSubjects.map((s) => (
                        <td key={s.id} className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            max={fullMarks[s.id] || 100}
                            value={marks[`${st.student_id}:${s.id}`] ?? ''}
                            onChange={(e) => setMark(st.student_id, s.id, e.target.value)}
                            className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-xs
                                       text-text-main text-right tabular-nums
                                       focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2 text-right text-text-main font-semibold tabular-nums">
                        {total}/{totalFullMarks}
                      </td>
                      <td className="px-4 py-2 text-right text-text-muted tabular-nums">
                        {filled ? `${pct.toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-primary">{grade}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-4 border-t border-border bg-background flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] text-text-muted">
            Marks are auto-graded. Saving updates the exam and each student's report.
          </p>
          <button
            onClick={handleSave}
            disabled={saving || detailFetch.loading || roster.length === 0 || !prefilled}
            className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse
                       text-xs font-semibold px-5 py-2.5 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : (isEditMode ? 'Update marksheet' : 'Save marksheet')}
          </button>
        </div>
      </section>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */

export default function TeacherExamsMarks() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('list');
  const [editorClassId, setEditorClassId] = useState(null);
  const [editExamName, setEditExamName] = useState(null);   // NEW
  const [toast, setToast] = useState({ type: '', msg: '' });

  const classesFetch = useFetch(() => getMyClasses(), []);
  const examsFetch = useFetch(() => getExams(), []);

  const classes = classesFetch.data || [];
  const exams = examsFetch.data?.exams || [];

  // Auto-open editor if ?class= is in URL
  useEffect(() => {
    const cid = searchParams.get('class');
    if (cid && mode === 'list') {
      setEditorClassId(Number(cid));
      setMode('editor');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast.msg) return;
    const t = setTimeout(() => setToast({ type: '', msg: '' }), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  function openNew(classId) {
    setEditorClassId(classId);
    setEditExamName(null);
    setMode('editor');
  }

  function openExisting(exam) {
    setEditorClassId(exam.class_id);
    setEditExamName(exam.exam_name);
    setMode('editor');
  }

  return (
    <DashboardLayout pageTitle="Exams & Marks" pageSubtitle="Create marksheets and record exam results">
      {toast.msg && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
          toast.type === 'success'
            ? 'border-status-verified/30 bg-status-verified/5 text-status-verified'
            : 'border-status-tampered/30 bg-status-tampered/5 text-status-tampered'
        }`}>
          {toast.msg}
        </div>
      )}

      {mode === 'editor' && editorClassId ? (
        <MarksheetEditor
          classId={editorClassId}
          editExamName={editExamName}
          onCancel={() => {
            setMode('list');
            setEditorClassId(null);
            setEditExamName(null);
            examsFetch.retry();
          }}
          onSaved={(res) => {
            setToast({ type: 'success', msg: res.message || 'Marksheet saved' });
            setMode('list');
            setEditorClassId(null);
            setEditExamName(null);
            examsFetch.retry();
          }}
        />
      ) : (
        <div className="space-y-6">

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-text-muted">
              {exams.length} marksheet{exams.length === 1 ? '' : 's'} recorded
            </p>
            <select
              onChange={(e) => e.target.value && openNew(Number(e.target.value))}
              value=""
              className="rounded-lg border border-border bg-surface text-text-main
                         text-xs font-medium px-3 py-2.5 focus:outline-none focus:border-primary"
            >
              <option value="">+ New marksheet for…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {examsFetch.loading && <SkeletonTable rows={4} cols={4} />}
          {!examsFetch.loading && examsFetch.error && (
            <ErrorState title="Couldn't load exams" message={examsFetch.error} onRetry={examsFetch.retry} />
          )}

          {!examsFetch.loading && !examsFetch.error && exams.length === 0 && (
            <EmptyState
              icon="📝"
              title="No marksheets yet"
              message="Pick a class from the dropdown above to start a new exam marksheet."
            />
          )}

          {!examsFetch.loading && !examsFetch.error && exams.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exams.map((ex, idx) => (
                <div
                  key={`${ex.exam_name}-${ex.class_id}-${idx}`}
                  className="bg-surface border border-border rounded-2xl p-5 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-text-main truncate">{ex.exam_name}</h3>
                      <p className="text-xs text-text-muted truncate">{ex.class_name}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold shrink-0">
                      {new Date(ex.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {ex.subjects.map((s) => (
                      <span
                        key={s.exam_id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium
                                   bg-primary-subtle text-primary"
                      >
                        {s.subject} · {s.marks_count}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-text-muted">
                      {ex.total_subjects} subject{ex.total_subjects === 1 ? '' : 's'} · {ex.marks_recorded} mark{ex.marks_recorded === 1 ? '' : 's'}
                    </span>
                    <button
                      onClick={() => openExisting(ex)}
                      className="font-medium text-primary hover:text-primary-active"
                    >
                      Open & edit →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </DashboardLayout>
  );
}