import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Spinner from './components/Spinner.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { FEATURES } from './config/features.js';

// ─── Shared pages (all roles) ──────────────────────────────
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
import TeacherDashboard      from './pages/teacher/Dashboard.jsx';
import TeacherMyClasses      from './pages/teacher/MyClasses.jsx';
import TeacherClassDetail    from './pages/teacher/ClassDetail.jsx';
import TeacherAttendance   from './pages/teacher/Attendance.jsx';
import TeacherExamsMarks   from './pages/teacher/ExamsMarks.jsx';
import TeacherTimetable    from './pages/teacher/Timetable.jsx';
import TeacherNotices      from './pages/teacher/Notices.jsx';
import TeacherNoticeView   from './pages/teacher/NoticeView.jsx';
import TeacherProfile      from './pages/teacher/Profile.jsx';


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

// ─── Accountant ───────────────────────────────────────────
import AccountantDashboard    from './pages/accountant/Dashboard.jsx';
import AccountantTransactions from './pages/accountant/Transactions.jsx';
import AccountantFeeStructure from './pages/accountant/FeeStructure.jsx';
import AccountantReports      from './pages/accountant/Reports.jsx';
import AccountantReceipt      from './pages/accountant/Receipt.jsx';
import AccountantInvoices from './pages/accountant/Invoices.jsx';
import AccountantPayroll   from './pages/accountant/Payroll.jsx';
import AccountantPayrollRun from './pages/accountant/PayrollRun.jsx';
import AccountantSalarySlip from './pages/accountant/SalarySlip.jsx';
import AccountantStudentDetail from './pages/accountant/StudentDetail.jsx';
import AccountantStatement from './pages/accountant/Statement.jsx';
import AccountantDaybook from './pages/accountant/Daybook.jsx';
import AccountantProfile from './pages/accountant/Profile.jsx';
import AccountantNotices    from './pages/accountant/Notices.jsx';
import AccountantNoticeView from './pages/accountant/NoticeView.jsx';
// ─── Other roles ───────────────────────────────────────────
import ParentDashboard       from './pages/parent/Dashboard.jsx';
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

/**
 * Helper — if a feature is off, render a redirect to home.
 * Keeps the JSX tidy so we don't repeat the ternary everywhere.
 */
function gate(flag, element, disabled = <Navigate to="/" replace />) {
  return FEATURES[flag] === false ? disabled : element;
}

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

          {/* ─── Shared pages ─────────────────────────── */}
          <Route path="/profile"
            element={gate('sharedProfile',
              <ProtectedRoute allowedRoles={ALL_ROLES}><ProfilePlaceholder /></ProtectedRoute>
            )} />
          <Route path="/settings"
            element={gate('sharedSettings',
              <ProtectedRoute allowedRoles={ALL_ROLES}><SettingsPlaceholder /></ProtectedRoute>
            )} />
          <Route path="/help"
            element={gate('sharedHelp',
              <ProtectedRoute allowedRoles={ALL_ROLES}><HelpPlaceholder /></ProtectedRoute>
            )} />

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
{/* ─── Teacher ───────────────────────────────────── */}
<Route path="/teacher"
  element={gate('teacherDashboard',
    <ProtectedRoute allowedRoles={['Teacher']}><TeacherDashboard /></ProtectedRoute>
  )} />
<Route path="/teacher/profile"
  element={gate('teacherProfile',
    <ProtectedRoute allowedRoles={['Teacher']}><TeacherProfile /></ProtectedRoute>
  )} />
<Route path="/teacher/classes"
  element={gate('teacherClasses',
    <ProtectedRoute allowedRoles={['Teacher']}><TeacherMyClasses /></ProtectedRoute>
  )} />
<Route path="/teacher/classes/:classId"
  element={gate('teacherClasses',
    <ProtectedRoute allowedRoles={['Teacher']}><TeacherClassDetail /></ProtectedRoute>
  )} />
<Route path="/teacher/attendance"
  element={gate('teacherAttendance',
    <ProtectedRoute allowedRoles={['Teacher']}><TeacherAttendance /></ProtectedRoute>
  )} />
<Route path="/teacher/exams"
  element={gate('teacherExams',
    <ProtectedRoute allowedRoles={['Teacher']}><TeacherExamsMarks /></ProtectedRoute>
  )} />
<Route path="/teacher/timetable"
  element={gate('teacherTimetable',
    <ProtectedRoute allowedRoles={['Teacher']}><TeacherTimetable /></ProtectedRoute>
  )} />
<Route path="/teacher/notices"
  element={gate('teacherNotices',
    <ProtectedRoute allowedRoles={['Teacher']}><TeacherNotices /></ProtectedRoute>
  )} />
<Route path="/teacher/notices/:id"
  element={gate('teacherNotices',
    <ProtectedRoute allowedRoles={['Teacher']}><TeacherNoticeView /></ProtectedRoute>
  )} />

          {/* ─── Student ───────────────────────────────── */}
          <Route path="/student"
            element={gate('studentDashboard',
              <ProtectedRoute allowedRoles={['Student']}><StudentDashboard /></ProtectedRoute>
            )} />
          <Route path="/student/profile"
            element={gate('studentProfile',
              <ProtectedRoute allowedRoles={['Student']}><StudentProfile /></ProtectedRoute>
            )} />
          <Route path="/student/attendance"
            element={gate('studentAttendance',
              <ProtectedRoute allowedRoles={['Student']}><StudentAttendance /></ProtectedRoute>
            )} />
          <Route path="/student/results"
            element={gate('studentResults',
              <ProtectedRoute allowedRoles={['Student']}><StudentResults /></ProtectedRoute>
            )} />
          <Route path="/student/fees"
            element={gate('studentFees',
              <ProtectedRoute allowedRoles={['Student']}><StudentFees /></ProtectedRoute>
            )} />
          <Route path="/student/fees/receipts/:id"
            element={gate('studentReceipt',
              <ProtectedRoute allowedRoles={['Student']}><StudentReceipt /></ProtectedRoute>
            )} />
          <Route path="/student/certificates"
            element={gate('studentCertificates',
              <ProtectedRoute allowedRoles={['Student']}><StudentCertificates /></ProtectedRoute>
            )} />
          <Route path="/student/certificates/:uuid"
            element={gate('studentCertificateView',
              <ProtectedRoute allowedRoles={['Student']}><StudentCertificateView /></ProtectedRoute>
            )} />
          <Route path="/student/library"
            element={gate('studentLibrary',
              <ProtectedRoute allowedRoles={['Student']}><StudentLibrary /></ProtectedRoute>
            )} />
          <Route path="/student/notices"
            element={gate('studentNotices',
              <ProtectedRoute allowedRoles={['Student']}><StudentNotices /></ProtectedRoute>
            )} />
          <Route path="/student/notices/:id"
            element={gate('studentNoticeView',
              <ProtectedRoute allowedRoles={['Student']}><StudentNoticeView /></ProtectedRoute>
            )} />

          {/* ─── Parent ────────────────────────────────── */}
          <Route path="/parent"
            element={gate('parentDashboard',
              <ProtectedRoute allowedRoles={['Parent']}><ParentDashboard /></ProtectedRoute>
            )} />

          {/* ─── Accountant ────────────────────────────── */}
{/* ─── Accountant ────────────────────────────── */}
<Route path="/accountant"
  element={gate('accountantDashboard',
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantDashboard /></ProtectedRoute>
  )} />
  <Route path="/accountant/profile"
  element={gate('accountantProfile',
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantProfile /></ProtectedRoute>
  )} />
  <Route path="/accountant/notices"
  element={gate('accountantNotices',
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantNotices /></ProtectedRoute>
  )} />
<Route path="/accountant/notices/:id"
  element={gate('accountantNotices',
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantNoticeView /></ProtectedRoute>
  )} />
<Route path="/accountant/transactions"
  element={gate('accountantTransactions',
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantTransactions /></ProtectedRoute>
  )} />
  <Route path="/accountant/invoices"
  element={gate('accountantInvoices',
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantInvoices /></ProtectedRoute>
  )} />
<Route path="/accountant/fee-structure"
  element={gate('accountantFeeStructure',
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantFeeStructure /></ProtectedRoute>
  )} />
<Route path="/accountant/reports"
  element={gate('accountantReports',
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantReports /></ProtectedRoute>
  )} />
  <Route path="/accountant/receipts/:id"
  element={
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantReceipt /></ProtectedRoute>
  } />
  <Route path="/accountant/students/:id"
  element={
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantStudentDetail /></ProtectedRoute>
  } />

<Route path="/accountant/students/:id/statement"
  element={
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantStatement /></ProtectedRoute>
  } />
  <Route path="/accountant/payroll"
  element={gate('accountantPayroll',
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantPayroll /></ProtectedRoute>
  )} />
<Route path="/accountant/payroll/runs/:id"
  element={
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantPayrollRun /></ProtectedRoute>
  } />
<Route path="/accountant/payroll/slip/:runId/:userId"
  element={
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantSalarySlip /></ProtectedRoute>
  } />
  <Route path="/accountant/daybook"
  element={gate('accountantDaybook',
    <ProtectedRoute allowedRoles={['Accountant']}><AccountantDaybook /></ProtectedRoute>
  )} />
          {/* ─── Librarian ─────────────────────────────── */}
          <Route path="/librarian"
            element={gate('librarianDashboard',
              <ProtectedRoute allowedRoles={['Librarian']}><LibrarianDashboard /></ProtectedRoute>
            )} />

          {/* ─── HR ────────────────────────────────────── */}
          <Route path="/hr"
            element={gate('hrDashboard',
              <ProtectedRoute allowedRoles={['HR']}><HRDashboard /></ProtectedRoute>
            )} />

          {/* ─── Lab ───────────────────────────────────── */}
          <Route path="/lab"
            element={gate('labDashboard',
              <ProtectedRoute allowedRoles={['Lab Assistant']}><LabAssistantDashboard /></ProtectedRoute>
            )} />

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