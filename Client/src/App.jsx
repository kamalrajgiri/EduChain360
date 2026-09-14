import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Spinner from './components/Spinner.jsx';

// ─── Public ────────────────────────────────────────────────
import Login from './pages/Login.jsx';
import Unauthorized from './pages/Unauthorized.jsx';

// ─── Admin (nested layout — collaborator's structure) ──────
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

// ─── Student ───────────────────────────────────────────────
import StudentDashboard  from './pages/student/Dashboard.jsx';
import StudentAttendance from './pages/student/Attendance.jsx';
import StudentComingSoon from './pages/student/ComingSoon.jsx';

// ─── Other roles ───────────────────────────────────────────
import ParentDashboard       from './pages/parent/Dashboard.jsx';
import AccountantDashboard   from './pages/accountant/Dashboard.jsx';
import LibrarianDashboard    from './pages/librarian/Dashboard.jsx';
import HRDashboard           from './pages/hr/Dashboard.jsx';
import LabAssistantDashboard from './pages/lab/Dashboard.jsx';

export const ROLE_HOME = {
  Admin: '/admin',
  Teacher: '/teacher',
  Student: '/student',
  Parent: '/parent',
  Accountant: '/accountant',
  Librarian: '/librarian',
  HR: '/hr',
  'Lab Assistant': '/lab'
};

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Spinner size="lg" label="Verifying your credentials..." />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/unauthorized'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/verify" element={<PublicVerifyStub />} />
          <Route path="/" element={<RootRedirect />} />

          {/* ─── Admin — nested layout ─────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index                element={<AdminDashboard />} />
            <Route path="admissions"    element={<AdminAdmissions />} />
            <Route path="users"         element={<AdminUsers />} />
            <Route path="academics"     element={<AdminAcademics />} />
            <Route path="finance"       element={<AdminFinance />} />
            <Route path="library"       element={<AdminLibrary />} />
            <Route path="hr"            element={<AdminHr />} />
            <Route path="analytics"     element={<AdminAnalytics />} />
            <Route path="blockchain"    element={<AdminBlockchain />} />
            <Route path="settings"      element={<AdminSettings />} />
          </Route>

          {/* ─── Teacher ───────────────────────────────────── */}
          <Route path="/teacher"
            element={<ProtectedRoute allowedRoles={['Teacher']}><TeacherDashboard /></ProtectedRoute>} />

          {/* ─── Student ───────────────────────────────────── */}
          <Route path="/student"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/attendance"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentAttendance /></ProtectedRoute>} />
          <Route path="/student/results"
            element={<ProtectedRoute allowedRoles={['Student']}>
              <StudentComingSoon title="Results" subtitle="Examination results & report card" part="D" />
            </ProtectedRoute>} />
          <Route path="/student/fees"
            element={<ProtectedRoute allowedRoles={['Student']}>
              <StudentComingSoon title="Fees" subtitle="Fee structure, payments & receipts" part="E" />
            </ProtectedRoute>} />
          <Route path="/student/certificates"
            element={<ProtectedRoute allowedRoles={['Student']}>
              <StudentComingSoon title="My Certificates" subtitle="Blockchain-verified credentials" part="F" />
            </ProtectedRoute>} />
          <Route path="/student/library"
            element={<ProtectedRoute allowedRoles={['Student']}>
              <StudentComingSoon title="Library" subtitle="Your borrowed books" part="F" />
            </ProtectedRoute>} />
          <Route path="/student/profile"
            element={<ProtectedRoute allowedRoles={['Student']}>
              <StudentComingSoon title="My Profile" subtitle="Personal details & security" part="F" />
            </ProtectedRoute>} />

          {/* ─── Parent ────────────────────────────────────── */}
          <Route path="/parent"
            element={<ProtectedRoute allowedRoles={['Parent']}><ParentDashboard /></ProtectedRoute>} />

          {/* ─── Accountant ────────────────────────────────── */}
          <Route path="/accountant"
            element={<ProtectedRoute allowedRoles={['Accountant']}><AccountantDashboard /></ProtectedRoute>} />

          {/* ─── Librarian ─────────────────────────────────── */}
          <Route path="/librarian"
            element={<ProtectedRoute allowedRoles={['Librarian']}><LibrarianDashboard /></ProtectedRoute>} />

          {/* ─── HR ────────────────────────────────────────── */}
          <Route path="/hr"
            element={<ProtectedRoute allowedRoles={['HR']}><HRDashboard /></ProtectedRoute>} />

          {/* ─── Lab ───────────────────────────────────────── */}
          <Route path="/lab"
            element={<ProtectedRoute allowedRoles={['Lab Assistant']}><LabAssistantDashboard /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function PublicVerifyStub() {
  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="max-w-md text-center bg-surface border border-border rounded-2xl p-8">
        <h1 className="text-lg font-bold text-text-main">Public certificate verification</h1>
        <p className="text-sm text-text-muted mt-2">
          Coming in a later phase. Scan a QR, confirm authenticity against the ledger.
        </p>
        <a href="/login" className="inline-block mt-5 text-sm text-primary font-semibold">
          ← Back to sign in
        </a>
      </div>
    </div>
  );
}