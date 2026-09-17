import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowLeft, FileSpreadsheet, Save } from "lucide-react";

const STORAGE_KEY = "educhain360_marksheets";

function loadMarksheets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveMarksheets(sheets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
}

function emptyMarksheet() {
  return {
    id: crypto.randomUUID(),
    className: "",
    examName: "",
    subjects: [{ id: crypto.randomUUID(), name: "Subject 1", fullMarks: 100 }],
    students: [
      { student_id: crypto.randomUUID(), roll_number: "01", name: "", marks: {} },
    ],
    createdAt: new Date().toISOString(),
  };
}

function gradeFor(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  return "F";
}

export default function ExamsMarks() {
  const [view, setView] = useState("list"); // "list" | "editor"
  const [sheets, setSheets] = useState([]);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    setSheets(loadMarksheets());
  }, []);

  function openNew() {
    setDraft(emptyMarksheet());
    setView("editor");
  }

  function openExisting(sheet) {
    setDraft(sheet);
    setView("editor");
  }

  function deleteSheet(id) {
    const updated = sheets.filter((s) => s.id !== id);
    setSheets(updated);
    saveMarksheets(updated);
  }

  // TODO: this writes to localStorage as a mock DB. Once the backend is ready,
  // POST one RESULT row per (student, subject) — { student_id, marks } — and
  // let the backend hash + anchor each row, filling in result_id/block_ref.
  function handleSaveDraft(finalDraft) {
    const existingIndex = sheets.findIndex((s) => s.id === finalDraft.id);
    const updated =
      existingIndex >= 0
        ? sheets.map((s, i) => (i === existingIndex ? finalDraft : s))
        : [...sheets, finalDraft];
    setSheets(updated);
    saveMarksheets(updated);
    setView("list");
  }

  if (view === "editor") {
    return (
      <MarksheetEditor
        draft={draft}
        onCancel={() => setView("list")}
        onSave={handleSaveDraft}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900 dark:text-white">
            Exams & Marks
          </h1>
          <p className="text-gray-500 dark:text-white/60 text-sm">
            Create and manage marksheets for your classes.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <Plus size={16} />
          Create marksheet
        </button>
      </div>

      {sheets.length === 0 ? (
        <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm p-10 mt-6 text-center">
          <FileSpreadsheet size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 dark:text-white/50 text-sm">
            No marksheets yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {sheets.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-navy-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-navy-900 dark:text-white font-semibold">
                    {s.examName || "Untitled exam"}
                  </p>
                  <p className="text-gray-500 dark:text-white/50 text-sm">
                    {s.className || "No class set"}
                  </p>
                </div>
                <button
                  onClick={() => deleteSheet(s.id)}
                  className="text-gray-300 hover:text-danger transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-indigo-700 dark:text-indigo-100 text-sm font-medium mt-3">
                {s.subjects.length} subject{s.subjects.length !== 1 && "s"} ·{" "}
                {s.students.length} student{s.students.length !== 1 && "s"}
              </p>
              <button
                onClick={() => openExisting(s)}
                className="mt-4 text-sm font-medium text-indigo-700 hover:underline"
              >
                Open marksheet →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MarksheetEditor({ draft, onCancel, onSave }) {
  const [sheet, setSheet] = useState(draft);

  function updateField(field, value) {
    setSheet((prev) => ({ ...prev, [field]: value }));
  }

  function addSubject() {
    setSheet((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        {
          id: crypto.randomUUID(),
          name: `Subject ${prev.subjects.length + 1}`,
          fullMarks: 100,
        },
      ],
    }));
  }

  function updateSubject(id, field, value) {
    setSheet((prev) => ({
      ...prev,
      subjects: prev.subjects.map((sub) =>
        sub.id === id
          ? { ...sub, [field]: field === "fullMarks" ? Number(value) || 0 : value }
          : sub
      ),
    }));
  }

  function removeSubject(id) {
    setSheet((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((sub) => sub.id !== id),
    }));
  }

  function addStudent() {
    setSheet((prev) => ({
      ...prev,
      students: [
        ...prev.students,
        {
          student_id: crypto.randomUUID(),
          roll_number: String(prev.students.length + 1).padStart(2, "0"),
          name: "",
          marks: {},
        },
      ],
    }));
  }

  function updateStudent(studentId, field, value) {
    setSheet((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.student_id === studentId ? { ...s, [field]: value } : s
      ),
    }));
  }

  function updateMark(studentId, subjectId, value) {
    const subject = sheet.subjects.find((sub) => sub.id === subjectId);
    const max = subject?.fullMarks ?? 100;
    const marks = Math.max(0, Math.min(max, Number(value) || 0));
    setSheet((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.student_id === studentId
          ? { ...s, marks: { ...s.marks, [subjectId]: marks } }
          : s
      ),
    }));
  }

  function removeStudent(studentId) {
    setSheet((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.student_id !== studentId),
    }));
  }

  const fullMarksTotal = sheet.subjects.reduce(
    (sum, sub) => sum + (Number(sub.fullMarks) || 0),
    0
  );

  function obtainedFor(student) {
    return sheet.subjects.reduce(
      (sum, sub) => sum + (Number(student.marks[sub.id]) || 0),
      0
    );
  }

  // Column sums for the Excel-style footer row.
  const columnSums = sheet.subjects.map((sub) =>
    sheet.students.reduce((sum, s) => sum + (Number(s.marks[sub.id]) || 0), 0)
  );
  const grandTotalObtained = sheet.students.reduce(
    (sum, s) => sum + obtainedFor(s),
    0
  );

  return (
    <div>
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/60 hover:text-navy-900 dark:hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft size={15} />
        Back to marksheets
      </button>

      {/* Header inputs */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Class (e.g. Grade 11 Science A)"
          value={sheet.className}
          onChange={(e) => updateField("className", e.target.value)}
          className="border border-gray-300 dark:border-white/10 dark:bg-navy-800 dark:text-white rounded-md px-3 py-2 text-sm bg-white flex-1 min-w-[220px]"
        />
        <input
          type="text"
          placeholder="Exam name (e.g. Mid-term 2083)"
          value={sheet.examName}
          onChange={(e) => updateField("examName", e.target.value)}
          className="border border-gray-300 dark:border-white/10 dark:bg-navy-800 dark:text-white rounded-md px-3 py-2 text-sm bg-white flex-1 min-w-[220px]"
        />
        <button
          onClick={() => onSave(sheet)}
          className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <Save size={15} />
          Save marksheet
        </button>
      </div>

      {/* Subjects manager */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-navy-900 dark:text-white font-semibold">Subjects</h2>
          <button
            onClick={addSubject}
            className="flex items-center gap-1 text-sm text-indigo-700 hover:underline"
          >
            <Plus size={14} /> Add subject
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {sheet.subjects.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center gap-2 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2"
            >
              <input
                type="text"
                value={sub.name}
                onChange={(e) => updateSubject(sub.id, "name", e.target.value)}
                className="text-sm font-medium text-navy-900 dark:text-white bg-transparent focus:outline-none w-28"
              />
              <span className="text-gray-300">/</span>
              <input
                type="number"
                value={sub.fullMarks}
                onChange={(e) => updateSubject(sub.id, "fullMarks", e.target.value)}
                className="text-sm text-gray-500 dark:text-white/60 bg-transparent focus:outline-none w-14"
              />
              <button
                onClick={() => removeSubject(sub.id)}
                className="text-gray-300 hover:text-danger transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Marks table — Excel-like: editable cells, computed totals */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm p-5 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-navy-900 dark:text-white font-semibold">
            Enter marks
          </h2>
          <button
            onClick={addStudent}
            className="flex items-center gap-1 text-sm text-indigo-700 hover:underline"
          >
            <Plus size={14} /> Add student
          </button>
        </div>

        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-gray-500 dark:text-white/50 border-b border-gray-200 dark:border-white/10">
              <th className="py-2 pr-3 font-medium">Roll</th>
              <th className="py-2 pr-3 font-medium">Student Name</th>
              {sheet.subjects.map((sub) => (
                <th key={sub.id} className="py-2 pr-3 font-medium text-right">
                  {sub.name || "—"} <span className="text-gray-400">/{sub.fullMarks}</span>
                </th>
              ))}
              <th className="py-2 pr-3 font-medium text-right">Total</th>
              <th className="py-2 pr-3 font-medium text-right">%</th>
              <th className="py-2 pr-3 font-medium text-right">Grade</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sheet.students.map((s) => {
              const obtained = obtainedFor(s);
              const pct = fullMarksTotal ? (obtained / fullMarksTotal) * 100 : 0;
              return (
                <tr key={s.student_id} className="border-b border-gray-100 dark:border-white/10">
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={s.roll_number}
                      onChange={(e) =>
                        updateStudent(s.student_id, "roll_number", e.target.value)
                      }
                      className="w-12 bg-transparent focus:outline-none text-gray-700 dark:text-white/80"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      placeholder="Student name"
                      value={s.name}
                      onChange={(e) =>
                        updateStudent(s.student_id, "name", e.target.value)
                      }
                      className="bg-transparent focus:outline-none text-navy-900 dark:text-white font-medium w-full"
                    />
                  </td>
                  {sheet.subjects.map((sub) => (
                    <td key={sub.id} className="py-2 pr-3 text-right">
                      <input
                        type="number"
                        min={0}
                        max={sub.fullMarks}
                        value={s.marks[sub.id] ?? ""}
                        onChange={(e) =>
                          updateMark(s.student_id, sub.id, e.target.value)
                        }
                        className="w-16 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-navy-600/30 dark:bg-navy-900 dark:text-white"
                      />
                    </td>
                  ))}
                  <td className="py-2 pr-3 text-right font-semibold text-navy-900 dark:text-white">
                    {obtained}/{fullMarksTotal}
                  </td>
                  <td className="py-2 pr-3 text-right text-gray-600 dark:text-white/70">
                    {pct.toFixed(1)}%
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold text-indigo-700 dark:text-indigo-100">
                    {gradeFor(pct)}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => removeStudent(s.student_id)}
                      className="text-gray-300 hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Excel-style totals footer row */}
          <tfoot>
            <tr className="border-t-2 border-gray-300 dark:border-white/20 font-semibold text-navy-900 dark:text-white">
              <td className="py-2 pr-3" colSpan={2}>
                Column totals
              </td>
              {columnSums.map((sum, i) => (
                <td key={sheet.subjects[i].id} className="py-2 pr-3 text-right">
                  {sum}
                </td>
              ))}
              <td className="py-2 pr-3 text-right">{grandTotalObtained}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-5 bg-anchored/10 border border-anchored/30 text-sm text-indigo-800 dark:text-indigo-100 rounded-md px-4 py-3">
         
        </div>
      </div>
    </div>
  );
}