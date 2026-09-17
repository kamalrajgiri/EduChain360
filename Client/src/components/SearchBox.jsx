import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { search } from '../api/student.js';

export default function SearchBox({ role }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const wrapRef = useRef(null);

  // Only Student has the endpoint for now
  const enabled = role === 'Student';

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
        setResults({ books: [], notices: [], certificates: [], subjects: [] });
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

  const totalResults = results
    ? (results.books.length + results.notices.length +
       results.certificates.length + results.subjects.length)
    : 0;

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
        placeholder="Search books, notices, certificates..."
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

            {!loading && results && totalResults === 0 && (
              <div className="p-6 text-center">
                <p className="text-xs font-semibold text-text-main">No matches for "{q}"</p>
                <p className="text-[11px] text-text-muted mt-0.5">Try a different word.</p>
              </div>
            )}

            {!loading && results && totalResults > 0 && (
              <>
                {results.books.length > 0 && (
                  <Group label="Books">
                    {results.books.map((b) => (
                      <ResultRow key={b.id} onClick={() => go('/student/library')}>
                        <span className="text-sm">📖</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text-main truncate">{b.title}</p>
                          <p className="text-[10px] text-text-muted truncate">
                            {b.author || '—'} · {b.available_copies} available
                          </p>
                        </div>
                      </ResultRow>
                    ))}
                  </Group>
                )}

                {results.notices.length > 0 && (
                  <Group label="Notices">
                    {results.notices.map((n) => (
                      <ResultRow key={n.id} onClick={() => go(`/student/notices/${n.id}`)}>
                        <span className="text-sm">📣</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text-main truncate">{n.title}</p>
                          <p className="text-[10px] text-text-muted">{n.audience}</p>
                        </div>
                      </ResultRow>
                    ))}
                  </Group>
                )}

                {results.certificates.length > 0 && (
                  <Group label="Certificates">
                    {results.certificates.map((c) => (
                      <ResultRow key={c.id} onClick={() => go(`/student/certificates/${c.credential_uuid}`)}>
                        <span className="text-sm">🎓</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text-main truncate">{c.title}</p>
                          <p className="text-[10px] text-text-muted">
                            Issued {new Date(c.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </ResultRow>
                    ))}
                  </Group>
                )}

                {results.subjects.length > 0 && (
                  <Group label="Subjects">
                    {results.subjects.map((s) => (
                      <ResultRow key={s.id} onClick={() => go('/student/attendance')}>
                        <span className="text-sm">📚</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text-main">{s.name}</p>
                          <p className="text-[10px] text-text-muted font-mono">{s.code}</p>
                        </div>
                      </ResultRow>
                    ))}
                  </Group>
                )}
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

function Group({ label, children }) {
  return (
    <div>
      <div className="px-4 py-1.5 bg-background/70 border-y border-border">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{label}</p>
      </div>
      <ul className="divide-y divide-border">{children}</ul>
    </div>
  );
}

function ResultRow({ onClick, children }) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full text-left px-4 py-2.5 hover:bg-primary-subtle/40 transition-colors flex items-center gap-3"
      >
        {children}
      </button>
    </li>
  );
}