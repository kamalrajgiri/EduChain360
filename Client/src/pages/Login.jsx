import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_HOME } from '../App.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(identifier.trim(), password);
      const dest = location.state?.from?.pathname || ROLE_HOME[user.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — brand panel */}
      <aside className="hidden lg:flex w-1/2 bg-primary-dark text-text-inverse flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center font-bold">EC</div>
            <div>
              <p className="font-semibold leading-tight">EduChain360</p>
              <p className="text-xs text-primary-light">School ERP</p>
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-snug mb-4">
            One Platform.<br />Every Record.<br />Verified Forever.
          </h1>
          <p className="text-sm text-primary-light leading-relaxed">
            Secure role-based access for administrators, teachers, students, parents,
            accountants, librarians, HR and lab staff — with every certificate and
            receipt independently verifiable on a tamper-evident ledger.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium">JWT + role-based access</span>
            <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium">SHA-256 verified records</span>
          </div>
        </div>

        <p className="text-xs text-primary-light/70">
          © {new Date().getFullYear()} EduChain360 · Far Western University
        </p>
      </aside>

      {/* Right — form */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-main">Welcome back</h2>
            <p className="text-sm text-text-muted mt-1">
              Sign in with your school ID or email to continue
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-4 py-3 text-sm text-status-tampered">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">
                School ID / Roll number or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="kamal.giri@fwu.edu.np"
                autoComplete="username"
                required
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                           text-text-main placeholder:text-text-muted/60
                           focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                           text-text-main placeholder:text-text-muted/60
                           focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <p className="text-xs text-text-muted mt-1.5">
                Forgot password? Reset via registered email
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-active
                         disabled:opacity-60 disabled:cursor-not-allowed
                         text-text-inverse text-sm font-semibold py-2.5 transition-colors"
            >
              {submitting ? 'Signing in…' : 'Sign in securely'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/verify"
              className="text-xs text-primary hover:text-primary-active font-medium underline underline-offset-2"
            >
              Continue as guest — Verify a certificate
            </Link>
          </div>

          <div className="mt-6 rounded-lg bg-primary-subtle border border-primary-light px-4 py-3">
            <p className="text-xs text-text-main leading-relaxed">
              <span className="font-semibold">There is no role selector</span> here by design.
              Your role is read from your signed credential claims on the server and you are
              routed to the correct dashboard automatically — it can never be chosen client-side.
            </p>
          </div>

          <p className="text-center text-xs text-text-muted mt-4">
            New admission applicants can apply online without an account —{' '}
            <a href="#" className="text-primary font-medium">Apply now</a>.
          </p>
        </div>
      </main>
    </div>
  );
}