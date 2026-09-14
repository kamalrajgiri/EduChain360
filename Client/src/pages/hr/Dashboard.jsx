import DashboardLayout from '../../layouts/DashboardLayout.jsx';

export default function HRDashboard() {
  return (
    <DashboardLayout pageTitle="HR Dashboard" pageSubtitle="Staff and payroll">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-xl">
        <p className="text-sm text-text-muted">HR dashboard — built in a later phase.</p>
      </div>
    </DashboardLayout>
  );
}