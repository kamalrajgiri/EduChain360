import DashboardLayout from '../../layouts/DashboardLayout.jsx';

export default function ParentDashboard() {
  return (
    <DashboardLayout pageTitle="Parent Dashboard" pageSubtitle="Your child's records">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-xl">
        <p className="text-sm text-text-muted">Parent dashboard — built in a later phase.</p>
      </div>
    </DashboardLayout>
  );
}