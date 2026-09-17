import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getNotifications } from '../api/notifications.js';

const READ_KEY = 'educhain360_read_notices';

const NOTICES_BASE_BY_ROLE = {
  Student: '/student/notices'
};
const ALL_LINK_BY_ROLE = {
  Student: '/student/notices'
};

function timeAgo(iso) {
  if (!iso) return '—';
  const then = new Date(iso);
  const s = Math.floor((Date.now() - then.getTime()) / 1000);
  if (s < 60)      return 'just now';
  if (s < 3600)    return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)   return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800)  return `${Math.floor(s / 86400)}d ago`;
  return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function groupLabel(iso) {
  if (!iso) return 'Older';
  const then = new Date(iso);
  const now = new Date();
  const dayMs = 86400000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - dayMs);
  const startOfWeekAgo  = new Date(startOfToday.getTime() - 7 * dayMs);

  if (then >= startOfToday)     return 'Today';
  if (then >= startOfYesterday) return 'Yesterday';
  if (then >= startOfWeekAgo)   return 'This week';
  return 'Older';
}

function loadRead() {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export default function NotificationBell({ role }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(loadRead);
  const [focusIdx, setFocusIdx] = useState(-1);

  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const itemRefs = useRef([]);

  // Fetch on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getNotifications();
        if (!cancelled) setNotices(res);
      } catch { /* silent — bell is non-critical */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Close when viewport resizes to desktop (in case panel was mobile-full-width)
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(min-width: 640px)');
    function onChange(e) { /* no-op — sm+ uses anchored dropdown, still fine */ }
    // Intentionally empty — the responsive layout handles both cases.
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [open]);

  // Click outside closes
  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (buttonRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIdx((i) => Math.min(i + 1, notices.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && focusIdx >= 0) {
        e.preventDefault();
        openNotice(notices[focusIdx]);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, focusIdx, notices]);

  useEffect(() => { if (open) setFocusIdx(-1); }, [open]);

  useEffect(() => {
    if (focusIdx >= 0 && itemRefs.current[focusIdx]) {
      itemRefs.current[focusIdx].scrollIntoView({ block: 'nearest' });
    }
  }, [focusIdx]);

  const unreadCount = notices.filter((n) => !readIds.includes(n.id)).length;

  const grouped = useMemo(() => {
    const buckets = { Today: [], Yesterday: [], 'This week': [], Older: [] };
    for (const n of notices) buckets[groupLabel(n.published_at)].push(n);
    return Object.entries(buckets).filter(([, arr]) => arr.length > 0);
  }, [notices]);

  function persist(next) {
    setReadIds(next);
    try { localStorage.setItem(READ_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  function markAllRead() { persist(notices.map((n) => n.id)); }
  function markOneRead(id) { persist(Array.from(new Set([...readIds, id]))); }

  function openNotice(n) {
    markOneRead(n.id);
    setOpen(false);
    const base = NOTICES_BASE_BY_ROLE[role];
    if (base) navigate(`${base}/${n.id}`);
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className={`relative h-10 w-10 sm:h-9 sm:w-9 rounded-full border grid place-items-center transition-colors ${
          open
            ? 'border-primary bg-primary-subtle text-primary'
            : 'border-border bg-surface text-text-muted hover:text-text-main'
        }`}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full
                           bg-status-tampered text-text-inverse text-[9px] font-bold grid place-items-center
                           ring-2 ring-surface">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-30 sm:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Panel — full-width below topbar on mobile, anchored dropdown on sm+ */}
          <div
            ref={panelRef}
            className="
              fixed left-2 right-2 top-[60px] z-40
              sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px]
              bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden
              animate-dropdown
            "
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-text-main">Notifications</h3>
                <p className="text-[11px] text-text-muted">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-medium text-primary hover:text-primary-active"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto overscroll-contain">
              {loading && (
                <div className="p-4 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-border shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-border rounded animate-pulse w-3/4" />
                        <div className="h-2 bg-border rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && notices.length === 0 && (
                <div className="p-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary-subtle text-primary grid place-items-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-text-main">You're all caught up</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    New notices will show up here.
                  </p>
                </div>
              )}

              {!loading && notices.length > 0 && (
                <>
                  {grouped.map(([label, items]) => (
                    <div key={label}>
                      <div className="px-4 py-1.5 bg-background/70 border-y border-border sticky top-0 z-10">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                          {label}
                        </p>
                      </div>
                      <ul className="divide-y divide-border">
                        {items.map((n) => {
                          const isUnread = !readIds.includes(n.id);
                          const flatIdx = notices.indexOf(n);
                          const isFocused = focusIdx === flatIdx;
                          return (
                            <li
                              key={n.id}
                              ref={(el) => (itemRefs.current[flatIdx] = el)}
                              className={`group relative ${isFocused ? 'bg-primary-subtle/60' : ''}`}
                            >
                              <button
                                onClick={() => openNotice(n)}
                                className={`w-full text-left px-4 py-3.5 sm:py-3 flex gap-3 transition-colors ${
                                  isFocused ? '' : 'hover:bg-primary-subtle/40 active:bg-primary-subtle/60'
                                }`}
                              >
                                <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                                  isUnread ? 'bg-primary' : 'bg-border'
                                }`} />
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs leading-snug pr-8 sm:pr-6 ${
                                    isUnread ? 'font-semibold text-text-main' : 'font-medium text-text-muted'
                                  }`}>
                                    {n.title}
                                  </p>
                                  <p className="text-[10px] text-text-muted mt-1">
                                    {n.audience} · {timeAgo(n.published_at)}
                                  </p>
                                </div>
                              </button>

                              {isUnread && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); markOneRead(n.id); }}
                                  className="absolute top-3 right-3 h-6 w-6 rounded-md opacity-60 sm:opacity-0
                                             sm:group-hover:opacity-100 transition-opacity grid place-items-center
                                             text-text-muted hover:text-primary hover:bg-primary-subtle"
                                  title="Mark as read"
                                  aria-label="Mark as read"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                       stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            {!loading && notices.length > 0 && ALL_LINK_BY_ROLE[role] && (
              <div className="border-t border-border">
                <Link
                  to={ALL_LINK_BY_ROLE[role]}
                  onClick={() => setOpen(false)}
                  className="block text-center text-[11px] font-semibold text-primary hover:text-primary-active
                             py-3 sm:py-2.5 hover:bg-primary-subtle/40 transition-colors"
                >
                  View all notices →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}