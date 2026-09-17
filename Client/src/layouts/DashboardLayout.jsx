import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { NAV } from '../constants/nav.js';
import NotificationBell from '../components/NotificationBell.jsx';
import UserMenu from '../components/UserMenu.jsx';
import Avatar from '../components/Avatar.jsx';
import SearchBox from '../components/SearchBox.jsx';

function SidebarContent({ user, navItems, onLogout, onNavClick }) {
  return (
    <>
      {/* Brand */}
      <div className="p-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-secondary grid place-items-center text-sm font-bold shrink-0">
            EC
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">EduChain360</p>
            <p className="text-[11px] text-primary-light truncate">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Identity block */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <Avatar user={user} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text-inverse truncate">{user?.full_name}</p>
            <p className="text-[10px] text-primary-light truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto overscroll-contain">
        <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold tracking-widest text-primary-light/60">
          MAIN MENU
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path.split('/').length === 2}
            onClick={onNavClick}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-lg px-3 py-2.5 md:py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-text-inverse font-medium'
                  : 'text-primary-light hover:bg-white/5 hover:text-text-inverse'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-secondary" />
                )}
                <span className={`grid place-items-center h-6 w-6 rounded text-[10px] font-bold tracking-wider transition-colors ${
                  isActive ? 'bg-secondary text-text-inverse' : 'bg-white/10 text-primary-light'
                }`}>
                  {item.code}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-white/10 space-y-1.5 shrink-0">
        <NavLink
          to="/help"
          onClick={onNavClick}
          className={({ isActive }) =>
            `w-full flex items-center gap-3 rounded-lg px-3 py-2.5 md:py-2 text-xs transition-colors ${
              isActive
                ? 'bg-white/10 text-text-inverse font-medium'
                : 'text-primary-light hover:bg-white/5 hover:text-text-inverse'
            }`
          }
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Help & support
        </NavLink>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 md:py-2 text-xs text-primary-light
                     hover:bg-white/5 hover:text-text-inverse transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>

        <p className="text-center text-[10px] text-primary-light/50 pt-1">
          EduChain360 v1.0
        </p>
      </div>
    </>
  );
}

export default function DashboardLayout({ children, pageTitle, pageSubtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV[user?.role] || [];
  const drawerRef = useRef(null);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    function onChange(e) { if (e.matches) setMobileOpen(false); }
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e) {
      if (e.key === 'Escape') setMobileOpen(false);
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const t = setTimeout(() => {
      drawerRef.current?.querySelector('a')?.focus();
    }, 120);
    return () => clearTimeout(t);
  }, [mobileOpen]);

  const touchStartX = useRef(null);
  const touchCurrentX = useRef(null);

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  }
  function onTouchMove(e) {
    touchCurrentX.current = e.touches[0].clientX;
  }
  function onTouchEnd() {
    if (touchStartX.current === null) return;
    const delta = touchCurrentX.current - touchStartX.current;
    if (delta < -60) setMobileOpen(false);
    touchStartX.current = null;
    touchCurrentX.current = null;
  }

  return (
    <div className="min-h-screen bg-background flex print:bg-white print:block">

      <aside className="hidden md:flex w-56 lg:w-60 bg-primary-dark text-text-inverse
                        flex-col shrink-0 print:hidden">
        <SidebarContent
          user={user}
          navItems={navItems}
          onLogout={handleLogout}
        />
      </aside>

      <div
        className={`md:hidden fixed inset-0 z-50 ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <aside
          ref={drawerRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className={`absolute top-0 left-0 h-full w-[280px] max-w-[85vw] bg-primary-dark text-text-inverse
                      flex flex-col shadow-2xl transform transition-transform duration-200 ease-out ${
                        mobileOpen ? 'translate-x-0' : '-translate-x-full'
                      }`}
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20
                       grid place-items-center text-text-inverse transition-colors z-10"
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <SidebarContent
            user={user}
            navItems={navItems}
            onLogout={handleLogout}
            onNavClick={() => setMobileOpen(false)}
          />
        </aside>
      </div>

      <main className="flex-1 flex flex-col min-w-0 print:block">

        <header className="h-14 sm:h-16 bg-surface border-b border-border
                           flex items-center justify-between gap-2 sm:gap-3
                           px-3 sm:px-4 md:px-6 shrink-0 sticky top-0 z-30 print:hidden">

          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden h-10 w-10 rounded-lg border border-border bg-surface
                         grid place-items-center text-text-main hover:bg-background active:scale-95
                         transition-all shrink-0"
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6"  x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-text-main truncate">{pageTitle}</h1>
              {pageSubtitle && (
                <p className="hidden sm:block text-[11px] sm:text-xs text-text-muted truncate">
                  {pageSubtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            <SearchBox role={user?.role} />
            <NotificationBell role={user?.role} />
            <UserMenu />
          </div>
        </header>

        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:overflow-visible">
          {children}
        </div>
      </main>
    </div>
  );
}