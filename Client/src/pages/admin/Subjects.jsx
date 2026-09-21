import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import { adminApi } from "../../api/adminApi.js";


const initialForm = {
  subject_code: "",
  subject_name: "",
  description: "",
};


export default function Subjects() {
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(initialForm);


  async function loadSubjects() {
    try {
      setLoading(true);

      const data = await adminApi.getSubjects();

      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadSubjects();
  }, []);


  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
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
        await adminApi.updateSubject(
          editingId,
          form
        );
      } else {
        await adminApi.createSubject(form);
      }

      resetForm();

      await loadSubjects();
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }


  function editSubject(subject) {
    setEditingId(subject.id);

    setForm({
      subject_code:
        subject.subject_code || "",
      subject_name:
        subject.subject_name || "",
      description:
        subject.description || "",
    });
  }


  async function deleteSubject(id) {
    if (
      !window.confirm(
        "Delete this subject?"
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteSubject(id);

      await loadSubjects();
    } catch (error) {
      alert(error.message);
    }
  }


  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle="Create and manage university subjects."
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">

        {/* FORM */}

        <section className="dashboard-card p-5">
          <h2 className="text-sm font-bold text-text-main">
            {editingId
              ? "Edit Subject"
              : "Create Subject"}
          </h2>

          <p className="mt-1 text-[11px] text-text-muted">
            Example: PHY101 — Physics
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-4"
          >
            <Field
              label="Subject Code"
              name="subject_code"
              value={form.subject_code}
              onChange={handleChange}
              placeholder="PHY101"
              required
            />

            <Field
              label="Subject Name"
              name="subject_name"
              value={form.subject_name}
              onChange={handleChange}
              placeholder="Physics"
              required
            />

            <label>
              <span className="mb-1.5 block text-[11px] font-bold text-text-main">
                Description
              </span>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                placeholder="Subject description"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-main outline-none focus:border-primary"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="primary-button flex-1"
              >
                <Plus size={14} />

                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Subject"
                  : "Create Subject"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
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
              Subjects
            </h2>

            <p className="mt-1 text-[11px] text-text-muted">
              {subjects.length} subject(s)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>Description</th>
                  <th>Classes</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">
                      Loading subjects...
                    </td>
                  </tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="empty-table"
                    >
                      No subjects created yet.
                    </td>
                  </tr>
                ) : (
                  subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td>
                        <strong>
                          {subject.subject_code}
                        </strong>
                      </td>

                      <td>
                        {subject.subject_name}
                      </td>

                      <td>
                        {subject.description || "—"}
                      </td>

                      <td>
                        {subject.class_count || 0}
                      </td>

                      <td>
                        <div className="flex gap-1">
                          <button
                            className="table-action"
                            onClick={() =>
                              editSubject(subject)
                            }
                          >
                            <Pencil size={13} />
                          </button>

                          <button
                            className="table-action"
                            onClick={() =>
                              deleteSubject(
                                subject.id
                              )
                            }
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
  value,
  onChange,
  placeholder,
  required,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-text-main">
        {label}
      </span>

      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-main outline-none focus:border-primary"
      />
    </label>
  );
}