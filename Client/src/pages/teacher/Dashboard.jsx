import DashboardLayout from '../../layouts/DashboardLayout.jsx';

export default function TeacherDashboard() {
  return (
    <DashboardLayout pageTitle="Teacher Dashboard" pageSubtitle="Your classes, attendance, and marks">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-xl">
        <p className="text-sm text-text-muted">Teacher dashboard — built in a later phase.</p>
      </div>
    </DashboardLayout>
  );
}