import { useEffect, useState } from "react";
import { CalendarDays, Save, Plus, Trash2 } from "lucide-react";

// Mock classes — replace with a fetch to your classes API once ready.
const CLASSES = [
  { id: "11-sci-a", name: "Grade 11 Science A", subject: "Physics" },
  { id: "11-sci-b", name: "Grade 11 Science B", subject: "Physics" },
  { id: "10-a", name: "Grade 10 A", subject: "Science" },
  { id: "10-b", name: "Grade 10 B", subject: "Science" },
];

// Field names follow ER diagram's STUDENT (student_id, roll_number) / USER (name).
// This is the default/seed roster — anything a teacher adds gets merged in and
// persisted separately so it survives reloads without touching this constant.
const DEFAULT_ROSTERS = {
  "11-sci-a": [
    { student_id: 1, roll_number: "01", name: "Anisha Joshi" },
    { student_id: 2, roll_number: "02", name: "Bikash Rawal" },
    { student_id: 3, roll_number: "03", name: "Rajan Thapa" },
    { student_id: 4, roll_number: "04", name: "Priya Chand" },
    { student_id: 5, roll_number: "05", name: "Manish Bohara" },
    { student_id: 6, roll_number: "06", name: "Sujata Bhandari" },
  ],
  "11-sci-b": [
    { student_id: 7, roll_number: "01", name: "Kritika Adhikari" },
    { student_id: 8, roll_number: "02", name: "Suman Karki" },
    { student_id: 9, roll_number: "03", name: "Nabin Shrestha" },
  ],
  "10-a": [
    { student_id: 10, roll_number: "01", name: "Aayush Basnet" },
    { student_id: 11, roll_number: "02", name: "Kabita Rana" },
  ],
  "10-b": [
    { student_id: 12, roll_number: "01", name: "Dipesh Oli" },
    { student_id: 13, roll_number: "02", name: "Reema Gurung" },
  ],
};

const STORAGE_KEY = "educhain360_attendance";
const ROSTERS_KEY = "educhain360_rosters";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function loadAllRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAllRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// TODO: once the backend is ready, this becomes a fetch to your STUDENT
// endpoint filtered by class, and addStudent becomes a POST to create one.
function loadRosters() {
  try {
    const saved = JSON.parse(localStorage.getItem(ROSTERS_KEY));
    return saved || DEFAULT_ROSTERS;
  } catch {
    return DEFAULT_ROSTERS;
  }
}

function saveRosters(rosters) {
  localStorage.setItem(ROSTERS_KEY, JSON.stringify(rosters));
}

export default function Attendance() {
  const [classId, setClassId] = useState(CLASSES[0].id);
  const [date, setDate] = useState(todayISO());
  const [status, setStatus] = useState({});
  const [saved, setSaved] = useState(false);
  const [rosters, setRosters] = useState(loadRosters);
  const [addingStudent, setAddingStudent] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRoll, setNewRoll] = useState("");

  const roster = rosters[classId] || [];
  const recordKey = `${classId}_${date}`;

  // Load whatever was saved for this class + date, or default everyone present.
  useEffect(() => {
    const allRecords = loadAllRecords();
    const existing = allRecords[recordKey];
    if (existing) {
      setStatus(existing);
    } else {
      setStatus(Object.fromEntries(roster.map((s) => [s.student_id, "present"])));
    }
    setSaved(false);
    setAddingStudent(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date]);

  function toggle(studentId) {
    setStatus((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  }

  // TODO: once the backend is ready, this becomes a POST to create a STUDENT
  // row (roll_number, name) scoped to this class/section.
  function handleAddStudent() {
    if (!newName.trim()) return;

    const nextRoll =
      newRoll.trim() || String(roster.length + 1).padStart(2, "0");
    const newStudent = {
      student_id: `local-${Date.now()}`,
      roll_number: nextRoll,
      name: newName.trim(),
    };

    const updatedRosters = {
      ...rosters,
      [classId]: [...roster, newStudent],
    };
    setRosters(updatedRosters);
    saveRosters(updatedRosters);

    // New student defaults to present for whichever date is currently open.
    setStatus((prev) => ({ ...prev, [newStudent.student_id]: "present" }));

    setNewName("");
    setNewRoll("");
    setAddingStudent(false);
  }

  function handleRemoveStudent(studentId) {
    const updatedRosters = {
      ...rosters,
      [classId]: roster.filter((s) => s.student_id !== studentId),
    };
    setRosters(updatedRosters);
    saveRosters(updatedRosters);
    setStatus((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  }

  // TODO: once the backend is ready, POST one ATTENDANCE row per student —
  // { student_id, att_date: date, status } — instead of writing to localStorage.
  function handleSave() {
    const allRecords = loadAllRecords();
    allRecords[recordKey] = status;
    saveAllRecords(allRecords);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const currentClass = CLASSES.find((c) => c.id === classId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy-900 dark:text-white mb-1">
        Attendance
      </h1>
      <p className="text-gray-500 dark:text-white/60 text-sm mb-5">
        Take attendance for any class, on any date.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="border border-gray-300 dark:border-white/10 dark:bg-navy-800 dark:text-white rounded-md px-3 py-2 text-sm bg-white"
        >
          {CLASSES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.subject}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 border border-gray-300 dark:border-white/10 rounded-md px-3 py-2 bg-white dark:bg-navy-800">
          <CalendarDays size={16} className="text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayISO()}
            className="text-sm bg-transparent focus:outline-none dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-navy-900 dark:text-white font-semibold">
            {currentClass?.name} · {currentClass?.subject}
          </p>
          <button
            onClick={() => setAddingStudent((v) => !v)}
            className="flex items-center gap-1 text-sm text-indigo-700 hover:underline"
          >
            <Plus size={14} /> Add student
          </button>
        </div>
        <p className="text-gray-500 dark:text-white/50 text-sm mb-4">
          {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        {addingStudent && (
          <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-white/5 rounded-md">
            <input
              type="text"
              placeholder="Roll no."
              value={newRoll}
              onChange={(e) => setNewRoll(e.target.value)}
              className="w-20 border border-gray-300 dark:border-white/10 dark:bg-navy-900 dark:text-white rounded-md px-2 py-1.5 text-sm bg-white"
            />
            <input
              type="text"
              placeholder="Student name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
              className="flex-1 min-w-[160px] border border-gray-300 dark:border-white/10 dark:bg-navy-900 dark:text-white rounded-md px-2 py-1.5 text-sm bg-white"
            />
            <button
              onClick={handleAddStudent}
              className="bg-navy-800 hover:bg-navy-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setAddingStudent(false)}
              className="text-sm text-gray-500 dark:text-white/60 px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        )}

        {roster.map((s) => (
          <div
            key={s.student_id}
            className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/10 last:border-0"
          >
            <div>
              <span className="text-gray-500 dark:text-white/50 text-sm mr-3">
                {s.roll_number}
              </span>
              <span className="text-navy-900 dark:text-white font-medium">
                {s.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggle(s.student_id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  status[s.student_id] === "present"
                    ? "bg-success/15 text-success"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {status[s.student_id] === "present" ? "Present" : "Absent"}
              </button>
              <button
                onClick={() => handleRemoveStudent(s.student_id)}
                className="text-gray-300 hover:text-danger transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          className="mt-5 flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <Save size={15} />
          Save attendance
        </button>

        {saved && (
          <p className="text-sm text-success mt-3">
            Saved attendance for {currentClass?.name} on {date}.
          </p>
        )}
      </div>
    </div>
  );
}