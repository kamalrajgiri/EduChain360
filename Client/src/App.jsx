import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Spinner from './components/Spinner.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// ─── Shared pages (all authenticated roles) ────────────────
import ProfilePlaceholder  from './pages/ProfilePlaceholder.jsx';
import SettingsPlaceholder from './pages/SettingsPlaceholder.jsx';
import HelpPlaceholder     from './pages/HelpPlaceholder.jsx';

// ─── Public ────────────────────────────────────────────────
import Login from './pages/Login.jsx';
import Unauthorized from './pages/Unauthorized.jsx';

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

// ─── Student ───────────────────────────────────────────────
import StudentDashboard       from './pages/student/Dashboard.jsx';
import StudentAttendance      from './pages/student/Attendance.jsx';
import StudentResults         from './pages/student/Results.jsx';
import StudentFees            from './pages/student/Fees.jsx';
import StudentReceipt         from './pages/student/Receipt.jsx';
import StudentCertificates    from './pages/student/Certificates.jsx';
import StudentCertificateView from './pages/student/CertificateView.jsx';
import StudentLibrary         from './pages/student/Library.jsx';
import StudentProfile         from './pages/student/Profile.jsx';
import StudentNotices         from './pages/student/Notices.jsx';
import StudentNoticeView      from './pages/student/NoticeView.jsx';

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

const ALL_ROLES = [
  'Admin', 'Teacher', 'Student', 'Parent',
  'Accountant', 'Librarian', 'HR', 'Lab Assistant'
];

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
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/verify" element={<PublicVerifyStub />} />
          <Route path="/" element={<RootRedirect />} />

          {/* ─── Shared pages (all authenticated roles) ─── */}
          <Route path="/profile"
            element={<ProtectedRoute allowedRoles={ALL_ROLES}><ProfilePlaceholder /></ProtectedRoute>} />
          <Route path="/settings"
            element={<ProtectedRoute allowedRoles={ALL_ROLES}><SettingsPlaceholder /></ProtectedRoute>} />
          <Route path="/help"
            element={<ProtectedRoute allowedRoles={ALL_ROLES}><HelpPlaceholder /></ProtectedRoute>} />

          {/* ─── Admin — nested layout ─────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index             element={<AdminDashboard />} />
            <Route path="admissions" element={<AdminAdmissions />} />
            <Route path="users"      element={<AdminUsers />} />
            <Route path="academics"  element={<AdminAcademics />} />
            <Route path="finance"    element={<AdminFinance />} />
            <Route path="library"    element={<AdminLibrary />} />
            <Route path="hr"         element={<AdminHr />} />
            <Route path="analytics"  element={<AdminAnalytics />} />
            <Route path="blockchain" element={<AdminBlockchain />} />
            <Route path="settings"   element={<AdminSettings />} />
          </Route>

          {/* ─── Teacher ───────────────────────────────── */}
          <Route path="/teacher"
            element={<ProtectedRoute allowedRoles={['Teacher']}><TeacherDashboard /></ProtectedRoute>} />

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
          <Route path="/accountant"
            element={<ProtectedRoute allowedRoles={['Accountant']}><AccountantDashboard /></ProtectedRoute>} />

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