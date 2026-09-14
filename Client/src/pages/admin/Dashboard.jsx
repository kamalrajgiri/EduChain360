import DashboardLayout from '../../layouts/DashboardLayout.jsx';

export default function AdminDashboard() {
  return (
    <DashboardLayout pageTitle="Admin Dashboard" pageSubtitle="Institution-wide overview">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-xl">
        <p className="text-sm text-text-muted">Admin dashboard — built in a later phase.</p>
      </div>
    </DashboardLayout>
  );
}