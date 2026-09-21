import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Eye,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import { adminApi } from "../../api/adminApi.js";

const emptyForm = {
  application_no: "",
  applicant_name: "",
  email: "",
  program: "",
  applied_date: "",
  status: "Pending",
};

export default function Admissions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingAdmission, setEditingAdmission] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);

      const response = await adminApi.getAdmissions();

      setItems(
        Array.isArray(response)
          ? response
          : response?.data || response?.admissions || []
      );

      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const searchText = [
        item.applicant_name,
        item.name,
        item.application_no,
        item.email,
        item.program,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchText.includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, query, statusFilter]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      if (editingAdmission) {
        await adminApi.updateAdmission(
          editingAdmission.id,
          form
        );
      } else {
        await adminApi.createAdmission(form);
      }

      setModalOpen(false);
      setForm(emptyForm);
      setEditingAdmission(null);

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this admission record?")) {
      return;
    }

    try {
      await adminApi.deleteAdmission(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (item, status) => {
    try {
      await adminApi.updateAdmission(item.id, { status });
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, status }
            : currentItem
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const openCreateModal = () => {
    setEditingAdmission(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingAdmission(item);
    setForm({
      application_no: item.application_no || "",
      applicant_name:
        item.applicant_name ||
        [item.first_name, item.last_name]
          .filter(Boolean)
          .join(" "),
      email: item.email || "",
      program: item.program || "",
      applied_date: item.applied_date
        ? item.applied_date.slice(0, 10)
        : "",
      status: item.status || "Pending",
    });
    setModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Admissions"
        subtitle="Review, manage and track student admission applications."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="primary-button"
          >
            <Plus size={15} />
            New Admission
          </button>
        }
      />

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-danger">
          {error}
        </div>
      )}

      <div className="dashboard-card">
        <div className="toolbar">
          <div className="table-search">
            <Search size={15} />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search applications..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="filter-select"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Under Review</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Application</th>
                <th>Program</th>
                <th>Applied</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="empty-table"
                  >
                    Loading admissions...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="empty-table"
                  >
                    No admission records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-user">
                        <div className="table-avatar">
                          {(item.applicant_name ||
                            item.name ||
                            "A")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {item.applicant_name ||
                              item.name}
                          </strong>

                          <span>{item.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {item.application_no}
                      </strong>
                    </td>

                    <td>{item.program}</td>

                    <td>{item.applied_date}</td>

                    <td>
                      <select
                        value={item.status || "Pending"}
                        onChange={(event) =>
                          handleStatusChange(
                            item,
                            event.target.value
                          )
                        }
                        className="filter-select"
                        aria-label={`Status for ${item.applicant_name || item.name}`}
                      >
                        <option>Pending</option>
                        <option>Under Review</option>
                        <option>Approved</option>
                        <option>Rejected</option>
                      </select>
                    </td>

                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="table-action"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          className="table-action"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(item.id)
                          }
                          className="table-action hover:!border-red-200 hover:!bg-red-50 hover:!text-danger"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-text-main">
                  {editingAdmission
                    ? "Edit Admission"
                    : "New Admission"}
                </h2>

                <p className="mt-1 text-[10px] text-text-muted">
                  Create a new student application.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-text-muted hover:bg-background"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5"
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Application Number</label>
                  <input
                    required
                    value={form.application_no}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        application_no:
                          event.target.value,
                      })
                    }
                    placeholder="ADM-2026-001"
                  />
                </div>

                <div className="form-group">
                  <label>Applicant Name</label>
                  <input
                    required
                    value={form.applicant_name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        applicant_name:
                          event.target.value,
                      })
                    }
                    placeholder="Full name"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                    placeholder="student@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Program</label>
                  <select
                    required
                    value={form.program}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        program: event.target.value,
                      })
                    }
                  >
                    <option value="">
                      Select program
                    </option>
                    <option value="Computer Engineering">
                      Computer Engineering
                    </option>
                    <option value="BCA">
                      BCA
                    </option>
                    <option value="BBA">
                      BBA
                    </option>
                    <option value="BSc CSIT">
                      BSc CSIT
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Applied Date</label>
                  <input
                    type="date"
                    value={form.applied_date}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        applied_date:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value,
                      })
                    }
                  >
                    <option>Pending</option>
                    <option>Under Review</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="secondary-button"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="primary-button"
                >
                  <UserPlus size={14} />
                  {saving
                    ? "Saving..."
                    : editingAdmission
                      ? "Save Admission"
                      : "Create Admission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}