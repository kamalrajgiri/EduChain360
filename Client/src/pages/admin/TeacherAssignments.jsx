import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import { adminApi } from "../../api/adminApi.js";


const initialForm = {
  teacher_id: "",
  class_id: "",
  subject_id: "",
  academic_year: "",
};


export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);

  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(initialForm);


  async function loadData() {
    try {
      setLoading(true);

      const [
        assignmentData,
        teacherData,
        classData,
        subjectData,
      ] = await Promise.all([
        adminApi.getTeacherAssignments(),
        adminApi.getTeachersForAssignment(),
        adminApi.getClasses(),
        adminApi.getSubjects(),
      ]);

      setAssignments(
        Array.isArray(assignmentData)
          ? assignmentData
          : []
      );

      setTeachers(
        Array.isArray(teacherData)
          ? teacherData
          : []
      );

      setClasses(
        Array.isArray(classData)
          ? classData
          : []
      );

      setSubjects(
        Array.isArray(subjectData)
          ? subjectData
          : []
      );
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadData();
  }, []);


  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }


  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);

      await adminApi.createTeacherAssignment({
        teacher_id: Number(form.teacher_id),
        class_id: Number(form.class_id),
        subject_id: Number(form.subject_id),
        academic_year:
          form.academic_year.trim(),
      });

      setForm(initialForm);

      await loadData();
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }


  async function deleteAssignment(id) {
    if (
      !window.confirm(
        "Remove this teacher assignment?"
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteTeacherAssignment(
        id
      );

      await loadData();
    } catch (error) {
      alert(error.message);
    }
  }


  return (
    <div>
      <PageHeader
        title="Teacher Assignments"
        subtitle="Assign teachers to classes and subjects."
      />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">

        {/* FORM */}

        <section className="dashboard-card p-5">
          <h2 className="text-sm font-bold text-text-main">
            Assign Teacher
          </h2>

          <p className="mt-1 text-[11px] text-text-muted">
            Example: Ram Thapa → Grade 11 Science A → Physics
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-4"
          >
            <Select
              label="Teacher"
              name="teacher_id"
              value={form.teacher_id}
              onChange={handleChange}
              required
            >
              <option value="">
                Select teacher
              </option>

              {teachers.map((teacher) => (
                <option
                  key={teacher.id}
                  value={teacher.id}
                >
                  {teacher.first_name}{" "}
                  {teacher.last_name}
                </option>
              ))}
            </Select>


            <Select
              label="Class"
              name="class_id"
              value={form.class_id}
              onChange={handleChange}
              required
            >
              <option value="">
                Select class
              </option>

              {classes
                .filter(
                  (item) =>
                    item.status === "Active"
                )
                .map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.class_name}
                  </option>
                ))}
            </Select>


            <Select
              label="Subject"
              name="subject_id"
              value={form.subject_id}
              onChange={handleChange}
              required
            >
              <option value="">
                Select subject
              </option>

              {subjects
                .filter(
                  (item) =>
                    item.status === "Active"
                )
                .map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.subject_code} —{" "}
                    {subject.subject_name}
                  </option>
                ))}
            </Select>


            <label>
              <span className="mb-1.5 block text-[11px] font-bold text-text-main">
                Academic Year
              </span>

              <input
                name="academic_year"
                value={form.academic_year}
                onChange={handleChange}
                placeholder="2026/27"
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-main outline-none focus:border-primary"
              />
            </label>


            <button
              type="submit"
              disabled={saving}
              className="primary-button w-full"
            >
              <Plus size={14} />

              {saving
                ? "Assigning..."
                : "Assign Teacher"}
            </button>
          </form>
        </section>


        {/* TABLE */}

        <section className="dashboard-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-bold text-text-main">
              Current Teacher Assignments
            </h2>

            <p className="mt-1 text-[11px] text-text-muted">
              {assignments.length} assignment(s)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Academic Year</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">
                      Loading assignments...
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="empty-table"
                    >
                      No teacher assignments yet.
                    </td>
                  </tr>
                ) : (
                  assignments.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {item.teacher_name}
                        </strong>
                      </td>

                      <td>
                        {item.class_name}
                      </td>

                      <td>
                        <strong>
                          {item.subject_code}
                        </strong>

                        <span>
                          {item.subject_name}
                        </span>
                      </td>

                      <td>
                        {item.academic_year}
                      </td>

                      <td>
                        <button
                          className="table-action"
                          onClick={() =>
                            deleteAssignment(
                              item.id
                            )
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}


function Select({
  label,
  name,
  value,
  onChange,
  required,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-text-main">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-main outline-none focus:border-primary"
      >
        {children}
      </select>
    </label>
  );
}