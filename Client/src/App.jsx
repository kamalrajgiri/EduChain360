import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Spinner from './components/Spinner.jsx';

import Login from './pages/Login.jsx';
import Unauthorized from './pages/Unauthorized.jsx';

import AdminDashboard        from './pages/admin/Dashboard.jsx';
import TeacherDashboard      from './pages/teacher/Dashboard.jsx';
import StudentDashboard      from './pages/student/Dashboard.jsx';
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

          {/* Admin */}
          <Route path="/admin"
            element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />

          {/* Teacher */}
          <Route path="/teacher"
            element={<ProtectedRoute allowedRoles={['Teacher']}><TeacherDashboard /></ProtectedRoute>} />

          {/* Student */}
          <Route path="/student"
            element={<ProtectedRoute allowedRoles={['Student']}><StudentDashboard /></ProtectedRoute>} />

          {/* Parent */}
          <Route path="/parent"
            element={<ProtectedRoute allowedRoles={['Parent']}><ParentDashboard /></ProtectedRoute>} />

          {/* Accountant */}
          <Route path="/accountant"
            element={<ProtectedRoute allowedRoles={['Accountant']}><AccountantDashboard /></ProtectedRoute>} />

          {/* Librarian */}
          <Route path="/librarian"
            element={<ProtectedRoute allowedRoles={['Librarian']}><LibrarianDashboard /></ProtectedRoute>} />

          {/* HR */}
          <Route path="/hr"
            element={<ProtectedRoute allowedRoles={['HR']}><HRDashboard /></ProtectedRoute>} />

          {/* Lab */}
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