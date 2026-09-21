import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import { FEATURES } from '../config/features.js';

/**
 * Role-specific profile routes. Any role missing here falls back to `/profile`
 * which renders a shared placeholder page.
 */
const PROFILE_LINK_BY_ROLE = {
  Student:    '/student/profile',
  Accountant: '/accountant/profile',
  Teacher:    '/teacher/profile'
};
const PROFILE_FALLBACK = '/profile';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const wrapRef = useRef(null);
  const panelRef = useRef(null);

  const profileHref = PROFILE_LINK_BY_ROLE[user?.role] || PROFILE_FALLBACK;

  // Which profile route to use, considering feature flags:
  //   • if the role has a specific profile page AND that page is enabled → use it
  //   • if it doesn't, fall back to the shared /profile (if enabled)
  const hasRoleProfile = !!PROFILE_LINK_BY_ROLE[user?.role];
  const roleProfileEnabled =
    hasRoleProfile &&
    (user?.role === 'Student' ? FEATURES.studentProfile !== false : true);
  const sharedProfileEnabled = !hasRoleProfile && FEATURES.sharedProfile !== false;
  const showProfileItem = roleProfileEnabled || sharedProfileEnabled;

  // Click outside + Esc
  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (wrapRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function handleSignOut() {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 sm:gap-2.5 rounded-full transition-colors
                    ${open ? 'bg-background' : 'hover:bg-background'} py-1 pr-1 sm:pr-2`}
        aria-expanded={open}
        aria-label="User menu"
      >
        <Avatar user={user} size="md" />
        <div className="hidden md:block text-right">
          <p className="text-xs font-semibold text-text-main leading-tight truncate max-w-[110px]">
            {user?.full_name}
          </p>
          <p className="text-[11px] text-text-muted">{user?.role}</p>
        </div>
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-30 sm:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            ref={panelRef}
            className="
              fixed left-2 right-2 top-[60px] z-40
              sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[280px]
              bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden
              animate-dropdown
            "
          >
            {/* Identity */}
            <div className="px-4 py-3.5 border-b border-border bg-primary-subtle/30">
              <div className="flex items-center gap-3">
                <Avatar user={user} size="lg" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-main truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                                 bg-primary text-text-inverse">
                  {user?.role}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                                 bg-status-verified/10 text-status-verified">
                  <span className="h-1 w-1 rounded-full bg-status-verified" />
                  Active
                </span>
              </div>
            </div>

            {/* Menu items — each gated by feature flag */}
            <ul className="py-1.5">

              {showProfileItem && (
                <li>
                  <Link
                    to={profileHref}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 sm:py-2 text-xs text-text-main
                               hover:bg-primary-subtle/40 active:bg-primary-subtle/60 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21a8 8 0 0 1 16 0" />
                    </svg>
                    My profile
                  </Link>
                </li>
              )}

              {FEATURES.sharedSettings !== false && (
                <li>
                  <Link
                    to="/settings"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 sm:py-2 text-xs text-text-main
                               hover:bg-primary-subtle/40 active:bg-primary-subtle/60 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                    </svg>
                    Settings
                  </Link>
                </li>
              )}

              {FEATURES.sharedHelp !== false && (
                <li>
                  <Link
                    to="/help"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 sm:py-2 text-xs text-text-main
                               hover:bg-primary-subtle/40 active:bg-primary-subtle/60 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Help & support
                  </Link>
                </li>
              )}

            </ul>

            {/* Sign out */}
            <div className="border-t border-border py-1.5">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 sm:py-2 text-xs font-medium text-status-tampered
                           hover:bg-status-tampered/5 active:bg-status-tampered/10 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}