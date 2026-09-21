import React from "react";

import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Spinner from "./components/Spinner.jsx";

import ErrorBoundary from "./components/ErrorBoundary.jsx";

import ProfilePlaceholder from "./pages/ProfilePlaceholder.jsx";

import SettingsPlaceholder from "./pages/SettingsPlaceholder.jsx";

import HelpPlaceholder from "./pages/HelpPlaceholder.jsx";

import Login from "./pages/Login.jsx";

import Unauthorized from "./pages/Unauthorized.jsx";

/* =========================================================
   ADMIN COMPONENTS
========================================================= */

import AdminLayout from "./components/admin/AdminLayout.jsx";

/* =========================================================
   ADMIN PAGES
========================================================= */

import AdminDashboard from "./pages/admin/Dashboard.jsx";

import AdminAdmissions from "./pages/admin/Admissions.jsx";

import AdminUsers from "./pages/admin/Users.jsx";

import AdminAcademics from "./pages/admin/Academics.jsx";

import AdminClasses from "./pages/admin/Classes.jsx";

import AdminSubjects from "./pages/admin/Subjects.jsx";

import AdminEnrollments from "./pages/admin/Enrollments.jsx";

import AdminTeacherAssignments from "./pages/admin/TeacherAssignments.jsx";

import AdminFinance from "./pages/admin/Finance.jsx";

import AdminLibrary from "./pages/admin/Library.jsx";

import AdminHr from "./pages/admin/Hr.jsx";

import AdminAnalytics from "./pages/admin/Analytics.jsx";

import AdminBlockchain from "./pages/admin/Blockchain.jsx";

import AdminNotifications from "./pages/admin/Notifications.jsx";

import AdminSettings from "./pages/admin/Settings.jsx";

import AdminProfile from "./pages/admin/Profile.jsx";

/* =========================================================
   OTHER ROLE PAGES

   Keep these routes because other team members are working
   on these modules.
========================================================= */

import TeacherDashboard from "./pages/teacher/Dashboard.jsx";

import StudentDashboard from "./pages/student/Dashboard.jsx";

import StudentAttendance from "./pages/student/Attendance.jsx";

import StudentResults from "./pages/student/Results.jsx";

import StudentFees from "./pages/student/Fees.jsx";

import StudentReceipt from "./pages/student/Receipt.jsx";

import StudentCertificates from "./pages/student/Certificates.jsx";

import StudentCertificateView from "./pages/student/CertificateView.jsx";

import StudentLibrary from "./pages/student/Library.jsx";

import StudentProfile from "./pages/student/Profile.jsx";

import StudentNotices from "./pages/student/Notices.jsx";

import StudentNoticeView from "./pages/student/NoticeView.jsx";

import ParentDashboard from "./pages/parent/Dashboard.jsx";

import AccountantDashboard from "./pages/accountant/Dashboard.jsx";

import LibrarianDashboard from "./pages/librarian/Dashboard.jsx";

import HRDashboard from "./pages/hr/Dashboard.jsx";

import LabAssistantDashboard from "./pages/lab/Dashboard.jsx";

/* =========================================================
   ROLE HOME
========================================================= */

export const ROLE_HOME = {
  Admin: "/admin",
  Teacher: "/teacher",
  Student: "/student",
  Parent: "/parent",
  Accountant: "/accountant",
  Librarian: "/librarian",
  HR: "/hr",
  "Lab Assistant": "/lab",
};

const ALL_ROLES = [
  "Admin",
  "Teacher",
  "Student",
  "Parent",
  "Accountant",
  "Librarian",
  "HR",
  "Lab Assistant",
];

/* =========================================================
   ROOT REDIRECT
========================================================= */

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Spinner
          size="lg"
          label="Verifying your credentials..."
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={ROLE_HOME[user.role] || "/unauthorized"}
      replace
    />
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>

          {/* =================================================
              AUTHENTICATION
          ================================================= */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/unauthorized"
            element={<Unauthorized />}
          />

          <Route
            path="/verify"
            element={<PublicVerifyStub />}
          />

          <Route
            path="/"
            element={<RootRedirect />}
          />

          {/* =================================================
              GLOBAL ROLE-SAFE PAGES
          ================================================= */}

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <ProfilePlaceholder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <SettingsPlaceholder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/help"
            element={
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <HelpPlaceholder />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              ADMIN PORTAL
          ================================================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >

            {/* =================================================
                ADMIN DASHBOARD
            ================================================= */}

            <Route
              index
              element={<AdminDashboard />}
            />

            {/* =================================================
                ADMISSIONS
            ================================================= */}

            <Route
              path="admissions"
              element={<AdminAdmissions />}
            />

            {/* =================================================
                USERS

                Existing user management remains unchanged.
                Admin can create:
                - Teachers
                - Students
                - Accountant
                - HR
                - Other supported roles
            ================================================= */}

            <Route
              path="users"
              element={<AdminUsers />}
            />

            {/* =================================================
                ACADEMICS OVERVIEW
            ================================================= */}

            <Route
              path="academics"
              element={<AdminAcademics />}
            />

            {/* =================================================
                ACADEMIC MANAGEMENT

                New modules:
                1. Classes
                2. Subjects
                3. Student Enrollments
                4. Teacher Assignments
            ================================================= */}

            <Route
              path="classes"
              element={<AdminClasses />}
            />

            <Route
              path="subjects"
              element={<AdminSubjects />}
            />

            <Route
              path="enrollments"
              element={<AdminEnrollments />}
            />

            <Route
              path="teacher-assignments"
              element={<AdminTeacherAssignments />}
            />

            {/* =================================================
                FINANCE
            ================================================= */}

            <Route
              path="finance"
              element={<AdminFinance />}
            />

            {/* =================================================
                LIBRARY
            ================================================= */}

            <Route
              path="library"
              element={<AdminLibrary />}
            />

            {/* =================================================
                HR
            ================================================= */}

            <Route
              path="hr"
              element={<AdminHr />}
            />

            {/* =================================================
                ANALYTICS
            ================================================= */}

            <Route
              path="analytics"
              element={<AdminAnalytics />}
            />

            {/* =================================================
                BLOCKCHAIN
            ================================================= */}

            <Route
              path="blockchain"
              element={<AdminBlockchain />}
            />

            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

            <Route
              path="notifications"
              element={<AdminNotifications />}
            />

            {/* =================================================
                SETTINGS
            ================================================= */}

            <Route
              path="settings"
              element={<AdminSettings />}
            />

            {/* =================================================
                ADMIN PROFILE
            ================================================= */}

            <Route
              path="profile"
              element={<AdminProfile />}
            />

          </Route>

          {/* =================================================
              TEACHER
          ================================================= */}

          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={["Teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              STUDENT
          ================================================= */}

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentAttendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/results"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentResults />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/fees"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentFees />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/fees/receipts/:id"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentReceipt />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/certificates"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentCertificates />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/certificates/:uuid"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentCertificateView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/library"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentLibrary />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/notices"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentNotices />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/notices/:id"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentNoticeView />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              PARENT
          ================================================= */}

          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={["Parent"]}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              ACCOUNTANT
          ================================================= */}

          <Route
            path="/accountant"
            element={
              <ProtectedRoute allowedRoles={["Accountant"]}>
                <AccountantDashboard />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              LIBRARIAN
          ================================================= */}

          <Route
            path="/librarian"
            element={
              <ProtectedRoute allowedRoles={["Librarian"]}>
                <LibrarianDashboard />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              HR
          ================================================= */}

          <Route
            path="/hr"
            element={
              <ProtectedRoute allowedRoles={["HR"]}>
                <HRDashboard />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              LAB ASSISTANT

              Kept because another team member is working
              on the Lab Assistant module.
          ================================================= */}

          <Route
            path="/lab"
            element={
              <ProtectedRoute allowedRoles={["Lab Assistant"]}>
                <LabAssistantDashboard />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              FALLBACK
          ================================================= */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

/* =========================================================
   PUBLIC CERTIFICATE VERIFICATION
========================================================= */

function PublicVerifyStub() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">

        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-subtle text-sm font-bold text-primary">
          EC
        </div>

        <h1 className="mt-5 text-lg font-bold text-text-main">
          Public certificate verification
        </h1>

        <p className="mt-2 text-sm leading-6 text-text-muted">
          Coming in a later phase. Scan a QR code and
          confirm authenticity against the EduChain360
          ledger.
        </p>

        <a
          href="/login"
          className="mt-5 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Back to sign in
        </a>

      </div>
    </div>
  );
}