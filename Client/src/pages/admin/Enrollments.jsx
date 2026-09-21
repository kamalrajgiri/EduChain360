import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import { adminApi } from "../../api/adminApi.js";


const initialForm = {
  student_id: "",
  class_id: "",
  roll_number: "",
};


export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(initialForm);


  async function loadData() {
    try {
      setLoading(true);

      const [
        enrollmentData,
        studentData,
        classData,
      ] = await Promise.all([
        adminApi.getEnrollments(),
        adminApi.getStudentsForEnrollment(),
        adminApi.getClasses(),
      ]);

      setEnrollments(
        Array.isArray(enrollmentData)
          ? enrollmentData
          : []
      );

      setStudents(
        Array.isArray(studentData)
          ? studentData
          : []
      );

      setClasses(
        Array.isArray(classData)
          ? classData
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

      await adminApi.createEnrollment({
        student_id: Number(form.student_id),
        class_id: Number(form.class_id),
        roll_number: Number(form.roll_number),
      });

      setForm(initialForm);

      await loadData();
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }


  async function removeEnrollment(id) {
    if (
      !window.confirm(
        "Remove this student from the class?"
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteEnrollment(id);

      await loadData();
    } catch (error) {
      alert(error.message);
    }
  }


  return (
    <div>
      <PageHeader
        title="Student Enrollment"
        subtitle="Enroll students into classes and assign roll numbers."
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">

        {/* FORM */}

        <section className="dashboard-card p-5">
          <h2 className="text-sm font-bold text-text-main">
            Enroll Student
          </h2>

          <p className="mt-1 text-[11px] text-text-muted">
            Assign a student to a class.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-4"
          >
            <Select
              label="Student"
              name="student_id"
              value={form.student_id}
              onChange={handleChange}
              required
            >
              <option value="">
                Select student
              </option>

              {students.map((student) => (
                <option
                  key={student.id}
                  value={student.id}
                >
                  {student.first_name}{" "}
                  {student.last_name}
                  {student.school_id_number
                    ? ` — ${student.school_id_number}`
                    : ""}
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
                    {item.class_name} —{" "}
                    {item.academic_year}
                  </option>
                ))}
            </Select>


            <label>
              <span className="mb-1.5 block text-[11px] font-bold text-text-main">
                Roll Number
              </span>

              <input
                type="number"
                min="1"
                name="roll_number"
                value={form.roll_number}
                onChange={handleChange}
                placeholder="17"
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
                ? "Enrolling..."
                : "Enroll Student"}
            </button>
          </form>
        </section>


        {/* TABLE */}

        <section className="dashboard-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-bold text-text-main">
              Current Enrollments
            </h2>

            <p className="mt-1 text-[11px] text-text-muted">
              {enrollments.length} enrollment(s)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Class</th>
                  <th>Academic Year</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6">
                      Loading enrollments...
                    </td>
                  </tr>
                ) : enrollments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="empty-table"
                    >
                      No students enrolled yet.
                    </td>
                  </tr>
                ) : (
                  enrollments.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {item.roll_number}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {item.first_name}{" "}
                          {item.last_name}
                        </strong>

                        <span>
                          {item.email}
                        </span>
                      </td>

                      <td>
                        {item.school_id_number ||
                          "—"}
                      </td>

                      <td>
                        {item.class_name}
                      </td>

                      <td>
                        {item.academic_year}
                      </td>

                      <td>
                        <button
                          className="table-action"
                          onClick={() =>
                            removeEnrollment(
                              item.id
                            )
                          }
                          title="Remove"
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