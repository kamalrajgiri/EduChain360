import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { NAV } from '../constants/nav.js';

export default function DashboardLayout({ children, pageTitle, pageSubtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = NAV[user?.role] || [];
  const initials = user?.full_name?.split(' ').map(s => s[0]).slice(0, 2).join('') || 'U';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 bg-primary-dark text-text-inverse flex-col shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-secondary grid place-items-center text-sm font-bold">
              EC
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">EduChain360</p>
              <p className="text-[11px] text-primary-light">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold tracking-widest text-primary-light/60">
            MAIN MENU
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split('/').length === 2}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-text-inverse font-medium'
                    : 'text-primary-light hover:bg-white/5 hover:text-text-inverse'
                }`
              }
            >
              <span className="grid place-items-center h-6 w-6 rounded bg-white/10 text-[10px] font-bold tracking-wider">
                {item.code}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="m-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm py-2 transition-colors"
        >
          Sign out
        </button>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between gap-4 px-6 shrink-0">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-text-main truncate">{pageTitle}</h1>
            {pageSubtitle && (
              <p className="text-xs text-text-muted truncate">{pageSubtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Search */}
            <div className="hidden lg:block">
              <input
                type="text"
                placeholder="Search records, students, staff..."
                className="w-64 rounded-full border border-border bg-background px-4 py-2 text-xs
                           text-text-main placeholder:text-text-muted/60
                           focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>

            {/* Bell */}
            <button className="h-9 w-9 rounded-full border border-border bg-surface grid place-items-center text-text-muted hover:text-text-main transition-colors">
              <span className="text-sm">🔔</span>
            </button>

            {/* User */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary text-text-inverse grid place-items-center text-xs font-bold">
                {initials}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-text-main leading-tight">{user?.full_name}</p>
                <p className="text-[11px] text-text-muted">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}