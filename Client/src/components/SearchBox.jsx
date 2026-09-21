import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { search } from '../api/search.js';

export default function SearchBox({ role }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const wrapRef = useRef(null);

  // Hide on roles we haven't wired yet (only Student + Accountant for now)
  const enabled = role === 'Student' || role === 'Accountant' || role === 'Teacher' || role === 'Admin';

  // Debounced search
  useEffect(() => {
    if (!enabled) return;
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await search(trimmed);
        setResults(res);
      } catch {
        setResults({ query: trimmed, groups: [], total: 0 });
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, enabled]);

  // Click outside closes
  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Esc closes
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { setOpen(false); setQ(''); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  if (!enabled) return null;

  const groups = results?.groups || [];
  const total = results?.total || 0;

  function go(path) {
    setOpen(false);
    setQ('');
    navigate(path);
  }

  return (
    <div ref={wrapRef} className="relative hidden md:block">
      <input
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search..."
        className="w-52 lg:w-64 xl:w-80 rounded-full border border-border bg-background
                   px-4 py-2 text-xs text-text-main placeholder:text-text-muted/60
                   focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15
                   transition-all"
      />

      {open && q.trim().length >= 2 && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-surface border border-border
                        rounded-2xl shadow-xl overflow-hidden z-40 animate-dropdown">
          <div className="max-h-[420px] overflow-y-auto">

            {loading && (
              <div className="p-4 text-center text-xs text-text-muted">Searching…</div>
            )}

            {!loading && results && total === 0 && (
              <div className="p-6 text-center">
                <p className="text-xs font-semibold text-text-main">No matches for "{q}"</p>
                <p className="text-[11px] text-text-muted mt-0.5">Try a different word.</p>
              </div>
            )}

            {!loading && groups.length > 0 && (
              <>
                {groups.map((g) => (
                  <div key={g.id}>
                    <div className="px-4 py-1.5 bg-background/70 border-y border-border">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                        {g.label}
                      </p>
                    </div>
                    <ul className="divide-y divide-border">
                      {g.items.map((it) => (
                        <li key={`${g.id}-${it.id}`}>
                          <button
                            onClick={() => go(it.path)}
                            className="w-full text-left px-4 py-2.5 hover:bg-primary-subtle/40 transition-colors flex items-center gap-3"
                          >
                            <span className="text-sm shrink-0">{g.icon}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-text-main truncate">{it.title}</p>
                              {it.subtitle && (
                                <p className="text-[10px] text-text-muted truncate">{it.subtitle}</p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="border-t border-border px-4 py-2 bg-background">
            <p className="text-[10px] text-text-muted">
              Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] font-mono">Esc</kbd> to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}