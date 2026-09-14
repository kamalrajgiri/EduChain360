import DashboardLayout from '../../layouts/DashboardLayout.jsx';

export default function ComingSoon({ title, subtitle, part }) {
  return (
    <DashboardLayout pageTitle={title} pageSubtitle={subtitle}>
      <div className="bg-surface border border-border rounded-2xl p-12 max-w-lg text-center mx-auto">
        <div className="h-12 w-12 rounded-full bg-secondary-subtle text-secondary grid place-items-center mx-auto mb-3">
          <span className="text-xl">🚧</span>
        </div>
        <h3 className="text-sm font-bold text-text-main">Coming soon</h3>
        <p className="text-xs text-text-muted mt-1">
          This page will be built in <span className="font-semibold text-text-main">Part {part}</span> of the Student phase.
        </p>
      </div>
    </DashboardLayout>
  );
}