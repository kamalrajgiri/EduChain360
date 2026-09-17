import DashboardLayout from '../layouts/DashboardLayout.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePlaceholder() {
  const { user } = useAuth();
  return (
    <DashboardLayout
      pageTitle="My Profile"
      pageSubtitle="Personal details, security & preferences"
    >
      <EmptyState
        icon="👤"
        title={`${user?.role} profile page is coming soon`}
        message="A dedicated profile page for your role is being built. In the meantime, use the settings menu to manage your account."
        actionLabel="Back to dashboard"
        actionTo="/"
      />
    </DashboardLayout>
  );
}