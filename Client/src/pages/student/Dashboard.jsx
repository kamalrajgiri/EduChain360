import DashboardLayout from '../../layouts/DashboardLayout.jsx';

export default function StudentDashboard() {
  return (
    <DashboardLayout pageTitle="Student Dashboard" pageSubtitle="Attendance, results, fees">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-xl">
        <p className="text-sm text-text-muted">Student dashboard — built in a later phase.</p>
      </div>
    </DashboardLayout>
  );
}