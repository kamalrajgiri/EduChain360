import React from "react";

import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Spinner from "./components/Spinner.jsx";

import ErrorBoundary from "./components/ErrorBoundary.jsx";
import AdminClasses from "./pages/admin/Classes.jsx";
import AdminSubjects from "./pages/admin/Subjects.jsx";
import AdminEnrollments from "./pages/admin/Enrollments.jsx";
import AdminTeacherAssignments from "./pages/admin/TeacherAssignments.jsx";
import AdminNotifications from "./pages/admin/Notifications.jsx";
import AdminProfile from "./pages/admin/Profile.jsx";
import TeacherMyClasses from "./pages/teacher/MyClasses.jsx";
import TeacherClassDetail from "./pages/teacher/ClassDetail.jsx";
import TeacherAttendance from "./pages/teacher/Attendance.jsx";
import TeacherExamsMarks from "./pages/teacher/ExamsMarks.jsx";
import TeacherTimetable from "./pages/teacher/Timetable.jsx";
import TeacherNotices from "./pages/teacher/Notices.jsx";
import TeacherNoticeView from "./pages/teacher/NoticeView.jsx";
import TeacherProfile from "./pages/teacher/Profile.jsx";
import AccountantTransactions from "./pages/accountant/Transactions.jsx";
import AccountantFeeStructure from "./pages/accountant/FeeStructure.jsx";
import AccountantReports from "./pages/accountant/Reports.jsx";
import AccountantReceipt from "./pages/accountant/Receipt.jsx";
import AccountantInvoices from "./pages/accountant/Invoices.jsx";
import AccountantPayroll from "./pages/accountant/Payroll.jsx";
import AccountantPayrollRun from "./pages/accountant/PayrollRun.jsx";
import AccountantSalarySlip from "./pages/accountant/SalarySlip.jsx";
import AccountantStudentDetail from "./pages/accountant/StudentDetail.jsx";
import AccountantStatement from "./pages/accountant/Statement.jsx";
import AccountantDaybook from "./pages/accountant/Daybook.jsx";
import AccountantProfile from "./pages/accountant/Profile.jsx";
import AccountantNotices from "./pages/accountant/Notices.jsx";
import AccountantNoticeView from "./pages/accountant/NoticeView.jsx";
import { FEATURES } from './config/features.js';

// ─── Shared pages (all authenticated roles) ────────────────
import ProfilePlaceholder  from './pages/ProfilePlaceholder.jsx';
import SettingsPlaceholder from './pages/SettingsPlaceholder.jsx';
import HelpPlaceholder     from './pages/HelpPlaceholder.jsx';

import Login from "./pages/Login.jsx";

import Unauthorized from "./pages/Unauthorized.jsx";

// ─── Admin (nested layout) ─────────────────────────────────
import AdminLayout     from './components/admin/AdminLayout';
import AdminDashboard  from './pages/admin/Dashboard';
import AdminAdmissions from './pages/admin/Admissions';
import AdminUsers      from './pages/admin/Users';
import AdminAcademics  from './pages/admin/Academics';
import AdminFinance    from './pages/admin/Finance';
import AdminLibrary    from './pages/admin/Library';
import AdminHr         from './pages/admin/Hr';
import AdminAnalytics  from './pages/admin/Analytics';
import AdminBlockchain from './pages/admin/Blockchain';
import AdminSettings   from './pages/admin/Settings';

// ─── Teacher ───────────────────────────────────────────────
import TeacherDashboard from './pages/teacher/Dashboard.jsx';

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

// ─── Other roles ───────────────────────────────────────────
import ParentDashboard       from './pages/parent/Dashboard.jsx';
import AccountantDashboard   from './pages/accountant/Dashboard.jsx';
import LibrarianDashboard    from './pages/librarian/Dashboard.jsx';
import HRDashboard           from './pages/hr/Dashboard.jsx';
import LabAssistantDashboard from './pages/lab/Dashboard.jsx';

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

          {/* ─── Shared pages (all authenticated roles) ─── */}
          <Route path="/profile"
            element={<ProtectedRoute allowedRoles={ALL_ROLES}><ProfilePlaceholder /></ProtectedRoute>} />
          <Route path="/settings"
            element={<ProtectedRoute allowedRoles={ALL_ROLES}><SettingsPlaceholder /></ProtectedRoute>} />
          <Route path="/help"
            element={<ProtectedRoute allowedRoles={ALL_ROLES}><HelpPlaceholder /></ProtectedRoute>} />

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

          {/* ─── Teacher ───────────────────────────────── */}
          <Route
            path="/teacher"
            element={<ProtectedRoute allowedRoles={["Teacher"]}><TeacherDashboard /></ProtectedRoute>}
          />
          <Route path="/teacher/classes" element={<ProtectedRoute allowedRoles={["Teacher"]}><TeacherMyClasses /></ProtectedRoute>} />
          <Route path="/teacher/classes/:id" element={<ProtectedRoute allowedRoles={["Teacher"]}><TeacherClassDetail /></ProtectedRoute>} />
          <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={["Teacher"]}><TeacherAttendance /></ProtectedRoute>} />
          <Route path="/teacher/exams" element={<ProtectedRoute allowedRoles={["Teacher"]}><TeacherExamsMarks /></ProtectedRoute>} />
          <Route path="/teacher/timetable" element={<ProtectedRoute allowedRoles={["Teacher"]}><TeacherTimetable /></ProtectedRoute>} />
          <Route path="/teacher/notices" element={<ProtectedRoute allowedRoles={["Teacher"]}><TeacherNotices /></ProtectedRoute>} />
          <Route path="/teacher/notices/:id" element={<ProtectedRoute allowedRoles={["Teacher"]}><TeacherNoticeView /></ProtectedRoute>} />
          <Route path="/teacher/profile" element={<ProtectedRoute allowedRoles={["Teacher"]}><TeacherProfile /></ProtectedRoute>} />

          {/* ─── Student ───────────────────────────────── */}
          <Route path="/student"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/attendance"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentAttendance /></ProtectedRoute>} />
          <Route path="/student/results"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentResults /></ProtectedRoute>} />
          <Route path="/student/fees"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentFees /></ProtectedRoute>} />
          <Route path="/student/fees/receipts/:id"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentReceipt /></ProtectedRoute>} />
          <Route path="/student/certificates"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentCertificates /></ProtectedRoute>} />
          <Route path="/student/certificates/:uuid"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentCertificateView /></ProtectedRoute>} />
          <Route path="/student/library"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentLibrary /></ProtectedRoute>} />
          <Route path="/student/profile"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentProfile /></ProtectedRoute>} />
          <Route path="/student/notices"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentNotices /></ProtectedRoute>} />
          <Route path="/student/notices/:id"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentNoticeView /></ProtectedRoute>} />

          {/* ─── Parent ────────────────────────────────── */}
          <Route path="/parent"
            element={<ProtectedRoute allowedRoles={['Parent']}><ParentDashboard /></ProtectedRoute>} />

          {/* ─── Accountant ────────────────────────────── */}
          <Route path="/accountant" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantDashboard /></ProtectedRoute>} />
          <Route path="/accountant/transactions" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantTransactions /></ProtectedRoute>} />
          <Route path="/accountant/fee-structure" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantFeeStructure /></ProtectedRoute>} />
          <Route path="/accountant/reports" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantReports /></ProtectedRoute>} />
          <Route path="/accountant/receipts/:id" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantReceipt /></ProtectedRoute>} />
          <Route path="/accountant/invoices" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantInvoices /></ProtectedRoute>} />
          <Route path="/accountant/payroll" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantPayroll /></ProtectedRoute>} />
          <Route path="/accountant/payroll/run" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantPayrollRun /></ProtectedRoute>} />
          <Route path="/accountant/payroll/:id" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantSalarySlip /></ProtectedRoute>} />
          <Route path="/accountant/students/:id" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantStudentDetail /></ProtectedRoute>} />
          <Route path="/accountant/statements/:id" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantStatement /></ProtectedRoute>} />
          <Route path="/accountant/daybook" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantDaybook /></ProtectedRoute>} />
          <Route path="/accountant/profile" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantProfile /></ProtectedRoute>} />
          <Route path="/accountant/notices" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantNotices /></ProtectedRoute>} />
          <Route path="/accountant/notices/:id" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantNoticeView /></ProtectedRoute>} />

          {/* ─── Librarian ─────────────────────────────── */}
          <Route path="/librarian"
            element={<ProtectedRoute allowedRoles={['Librarian']}><LibrarianDashboard /></ProtectedRoute>} />

          {/* ─── HR ────────────────────────────────────── */}
          <Route path="/hr"
            element={<ProtectedRoute allowedRoles={['HR']}><HRDashboard /></ProtectedRoute>} />

          {/* ─── Lab ───────────────────────────────────── */}
          <Route path="/lab"
            element={<ProtectedRoute allowedRoles={['Lab Assistant']}><LabAssistantDashboard /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
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