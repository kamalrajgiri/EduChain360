import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Plus,
  Search,
  Trash2,
  UserRoundPlus,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import StatusBadge from "../../components/admin/StatusBadge.jsx";
import { adminApi } from "../../api/adminApi.js";

const emptyForm = {
  name: "",
  email: "",
  role: "Student",
  status: "Active",
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const response = await adminApi.getUsers();

      setUsers(
        Array.isArray(response)
          ? response
          : response?.data || response?.users || []
      );

      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const text = [
        user.name,
        user.email,
        user.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        text.includes(query.toLowerCase()) &&
        (role === "All" || user.role === role)
      );
    });
  }, [users, query, role]);

  const createUser = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      if (editingUser) {
        await adminApi.updateUser(editingUser.id, form);
      } else {
        await adminApi.createUser(form);
      }

      setModalOpen(false);
      setForm(emptyForm);
      setEditingUser(null);

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || user.full_name || "",
      email: user.email || "",
      role: user.role || "Student",
      status: user.status || "Active",
    });
    setModalOpen(true);
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) {
      return;
    }

    try {
      await adminApi.deleteUser(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage students, teachers, administrators and university staff."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="primary-button"
          >
            <Plus size={15} />
            Add User
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
              placeholder="Search users..."
            />
          </div>

          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value)
            }
            className="filter-select"
          >
            <option>All</option>
            <option>Student</option>
            <option>Teacher</option>
            <option>Parent</option>
            <option>Accountant</option>
            <option>Librarian</option>
            <option>HR</option>
            <option>Lab Assistant</option>
            <option>Admin</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="empty-table"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="table-user">
                        <div className="table-avatar">
                          {(user.name || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {user.name}
                          </strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>{user.role}</td>

                    <td>
                      {user.department || "—"}
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          user.status || "Active"
                        }
                      />
                    </td>

                    <td>
                      {user.created_at ||
                        user.joined ||
                        "—"}
                    </td>

                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="table-action"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteUser(user.id)
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

      {modalOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={createUser}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-bold text-text-main">
                {editingUser ? "Edit User" : "Create User"}
              </h2>

              <p className="mt-1 text-[10px] text-text-muted">
                Add a new university system user.
              </p>
            </div>

            <div className="p-5">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="Full name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  placeholder="user@university.edu"
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Role</label>

                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        role: e.target.value,
                      })
                    }
                  >
                    <option>Student</option>
                    <option>Teacher</option>
                    <option>Parent</option>
                    <option>Accountant</option>
                    <option>Librarian</option>
                    <option>HR</option>
                    <option>Lab Assistant</option>
                    <option>Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
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
                <UserRoundPlus size={14} />
                {saving
                  ? editingUser
                    ? "Saving..."
                    : "Creating..."
                  : editingUser
                    ? "Save User"
                    : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}