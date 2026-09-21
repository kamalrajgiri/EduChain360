import {
  AUTH_UNAUTHORIZED_EVENT,
  clearToken,
  getToken,
} from "./client.js";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : {
          "Content-Type": "application/json",
        }),

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),

    ...(options.headers || {}),
  };

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const contentType =
    response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();

      window.dispatchEvent(
        new Event(AUTH_UNAUTHORIZED_EVENT)
      );
    }

    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}


export const adminApi = {

  // ==========================================================
  // EXISTING ADMIN
  // ==========================================================

  getDashboard() {
    return request("/admin/dashboard");
  },

  getAdmissions() {
    return request("/admin/admissions");
  },

  createAdmission(payload) {
    return request("/admin/admissions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateAdmission(id, payload) {
    return request(`/admin/admissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteAdmission(id) {
    return request(`/admin/admissions/${id}`, {
      method: "DELETE",
    });
  },


  // ==========================================================
  // USERS
  // ==========================================================

  getUsers() {
    return request("/admin/users");
  },

  createUser(payload) {
    return request("/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateUser(id, payload) {
    return request(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteUser(id) {
    return request(`/admin/users/${id}`, {
      method: "DELETE",
    });
  },


  // ==========================================================
  // EXISTING ACADEMICS
  // ==========================================================

  getAcademics() {
    return request("/admin/academics");
  },


  // ==========================================================
  // ACADEMIC MANAGEMENT
  // ==========================================================

  getAcademicManagementSummary() {
    return request(
      "/admin/academic-management/summary"
    );
  },


  // ==========================================================
  // CLASSES
  // ==========================================================

  getClasses() {
    return request(
      "/admin/academic-management/classes"
    );
  },

  createClass(payload) {
    return request(
      "/admin/academic-management/classes",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  updateClass(id, payload) {
    return request(
      `/admin/academic-management/classes/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  deleteClass(id) {
    return request(
      `/admin/academic-management/classes/${id}`,
      {
        method: "DELETE",
      }
    );
  },


  // ==========================================================
  // SUBJECTS
  // ==========================================================

  getSubjects() {
    return request(
      "/admin/academic-management/subjects"
    );
  },

  createSubject(payload) {
    return request(
      "/admin/academic-management/subjects",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  updateSubject(id, payload) {
    return request(
      `/admin/academic-management/subjects/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  deleteSubject(id) {
    return request(
      `/admin/academic-management/subjects/${id}`,
      {
        method: "DELETE",
      }
    );
  },


  // ==========================================================
  // STUDENTS
  // ==========================================================

  getStudentsForEnrollment() {
    return request(
      "/admin/academic-management/students"
    );
  },


  // ==========================================================
  // ENROLLMENTS
  // ==========================================================

  getEnrollments() {
    return request(
      "/admin/academic-management/enrollments"
    );
  },

  createEnrollment(payload) {
    return request(
      "/admin/academic-management/enrollments",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  updateEnrollment(id, payload) {
    return request(
      `/admin/academic-management/enrollments/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  deleteEnrollment(id) {
    return request(
      `/admin/academic-management/enrollments/${id}`,
      {
        method: "DELETE",
      }
    );
  },


  // ==========================================================
  // TEACHERS
  // ==========================================================

  getTeachersForAssignment() {
    return request(
      "/admin/academic-management/teachers"
    );
  },


  // ==========================================================
  // TEACHER ASSIGNMENTS
  // ==========================================================

  getTeacherAssignments() {
    return request(
      "/admin/academic-management/teacher-assignments"
    );
  },

  createTeacherAssignment(payload) {
    return request(
      "/admin/academic-management/teacher-assignments",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  updateTeacherAssignment(id, payload) {
    return request(
      `/admin/academic-management/teacher-assignments/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  deleteTeacherAssignment(id) {
    return request(
      `/admin/academic-management/teacher-assignments/${id}`,
      {
        method: "DELETE",
      }
    );
  },


  // ==========================================================
  // OTHER EXISTING ADMIN
  // ==========================================================

  getFinance() {
    return request("/admin/finance");
  },

  getLibrary() {
    return request("/admin/library");
  },

  getHr() {
    return request("/admin/hr");
  },

  getAnalytics() {
    return request("/admin/analytics");
  },

  getBlockchain() {
    return request("/admin/blockchain");
  },

  getNotifications() {
    return request("/admin/notifications");
  },

  markNotificationRead(id) {
    return request(
      `/admin/notifications/${id}/read`,
      {
        method: "PATCH",
      }
    );
  },

  getSettings() {
    return request("/admin/settings");
  },

  updateSettings(payload) {
    return request("/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  getProfile() {
    return request("/admin/profile");
  },

  updateProfile(payload) {
    return request("/admin/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  changePassword(payload) {
    return request(
      "/admin/profile/password",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },
};