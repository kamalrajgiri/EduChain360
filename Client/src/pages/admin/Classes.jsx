import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  BookOpen,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import { adminApi } from "../../api/adminApi.js";


const initialForm = {
  class_name: "",
  grade: "",
  section: "",
  academic_year: "",
  capacity: 40,
};


export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(initialForm);


  async function loadClasses() {
    try {
      setLoading(true);

      const data = await adminApi.getClasses();

      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadClasses();
  }, []);


  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }


  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);

      if (editingId) {
        await adminApi.updateClass(
          editingId,
          form
        );
      } else {
        await adminApi.createClass(form);
      }

      resetForm();
      await loadClasses();
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }


  function editClass(item) {
    setEditingId(item.id);

    setForm({
      class_name: item.class_name || "",
      grade: item.grade || "",
      section: item.section || "",
      academic_year: item.academic_year || "",
      capacity: item.capacity || 40,
    });
  }


  async function deleteClass(id) {
    if (
      !window.confirm(
        "Delete this class? Related enrollments and subject assignments will also be removed."
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteClass(id);
      await loadClasses();
    } catch (error) {
      alert(error.message);
    }
  }


  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle="Create and manage academic classes, sections and capacity."
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">

        {/* FORM */}

        <section className="dashboard-card p-5">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-text-main">
              {editingId
                ? "Edit Class"
                : "Create Class"}
            </h2>

            <p className="mt-1 text-[11px] text-text-muted">
              Example: Grade 11 Science A
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <Field
              label="Class Name"
              name="class_name"
              value={form.class_name}
              onChange={handleChange}
              placeholder="Grade 11 Science A"
              required
            />

            <Field
              label="Grade"
              name="grade"
              value={form.grade}
              onChange={handleChange}
              placeholder="Grade 11"
              required
            />

            <Field
              label="Section"
              name="section"
              value={form.section}
              onChange={handleChange}
              placeholder="A"
              required
            />

            <Field
              label="Academic Year"
              name="academic_year"
              value={form.academic_year}
              onChange={handleChange}
              placeholder="2026/27"
              required
            />

            <Field
              label="Capacity"
              name="capacity"
              type="number"
              value={form.capacity}
              onChange={handleChange}
              min="1"
              required
            />

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="primary-button flex-1"
              >
                <Plus size={14} />

                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Class"
                  : "Create Class"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="secondary-button"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>


        {/* TABLE */}

        <section className="dashboard-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-bold text-text-main">
              Academic Classes
            </h2>

            <p className="mt-1 text-[11px] text-text-muted">
              {classes.length} class(es)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Academic Year</th>
                  <th>Students</th>
                  <th>Subjects</th>
                  <th>Capacity</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6">
                      Loading classes...
                    </td>
                  </tr>
                ) : classes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="empty-table"
                    >
                      No classes created yet.
                    </td>
                  </tr>
                ) : (
                  classes.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {item.class_name}
                        </strong>

                        <span>
                          {item.grade} - Section{" "}
                          {item.section}
                        </span>
                      </td>

                      <td>
                        {item.academic_year}
                      </td>

                      <td>
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} />

                          {item.enrolled_students || 0}
                        </span>
                      </td>

                      <td>
                        <span className="inline-flex items-center gap-1">
                          <BookOpen size={12} />

                          {item.subject_count || 0}
                        </span>
                      </td>

                      <td>
                        {item.capacity}
                      </td>

                      <td>
                        <div className="flex gap-1">
                          <button
                            className="table-action"
                            onClick={() =>
                              editClass(item)
                            }
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>

                          <button
                            className="table-action"
                            onClick={() =>
                              deleteClass(item.id)
                            }
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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


function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  min,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-text-main">
        {label}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-main outline-none focus:border-primary"
      />
    </label>
  );
}