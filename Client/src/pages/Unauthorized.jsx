import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_HOME } from '../App.jsx';

export default function Unauthorized() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function backHome() {
    const dest = user ? (ROLE_HOME[user.role] || '/') : '/login';
    navigate(dest, { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-status-tampered/10 grid place-items-center mb-4">
          <span className="text-status-tampered text-2xl font-bold">!</span>
        </div>
        <h1 className="text-xl font-bold text-text-main">Access denied</h1>
        <p className="text-sm text-text-muted mt-2">
          Your role {user ? <span className="font-semibold text-text-main">({user.role})</span> : null} does not
          have permission to view that page.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={backHome}
            className="rounded-lg bg-primary text-text-inverse text-sm font-semibold px-4 py-2.5
                       hover:bg-primary-hover transition-colors"
          >
            Go to my dashboard
          </button>
          <button
            onClick={() => { logout(); navigate('/login', { replace: true }); }}
            className="rounded-lg border border-border text-text-main text-sm font-medium px-4 py-2.5
                       hover:bg-background transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}