import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Spinner from '../../components/Spinner.jsx';
import { getLibrary } from '../../api/student.js';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ISSUE_STATUS_CHIP = {
  ISSUED:   'bg-primary-subtle text-primary',
  RETURNED: 'bg-status-verified/10 text-status-verified',
  OVERDUE:  'bg-status-tampered/10 text-status-tampered'
};

export default function StudentLibrary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  async function load(q = '') {
    setSearching(true);
    try {
      const res = await getLibrary(q);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load library');
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getLibrary('');
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load library');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    load(query.trim());
  }

  return (
    <DashboardLayout
      pageTitle="Library"
      pageSubtitle="Your borrowed books & catalog search"
    >
      {loading && (
        <div className="py-24 grid place-items-center">
          <Spinner size="lg" label="Loading library..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-4 py-3 text-sm text-status-tampered">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">

          {/* Row 1 — My borrowed books */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-text-main">My borrowed books</h2>
              <p className="text-xs text-text-muted">{data.myIssues.length} record{data.myIssues.length === 1 ? '' : 's'}</p>
            </header>

            {data.myIssues.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">
                You haven't borrowed any books yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-semibold">Title</th>
                    <th className="text-left px-5 py-2.5 font-semibold hidden md:table-cell">Author</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Issued</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Due</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.myIssues.map((r) => (
                    <tr key={r.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                      <td className="px-5 py-3 text-text-main font-medium">{r.title}</td>
                      <td className="px-5 py-3 text-text-muted hidden md:table-cell">{r.author || '—'}</td>
                      <td className="px-5 py-3 text-text-muted">{fmtDate(r.issued_on)}</td>
                      <td className="px-5 py-3 text-text-muted">{fmtDate(r.due_date)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${ISSUE_STATUS_CHIP[r.status] || ''}`}>
                          {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Row 2 — Catalog search */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-text-main">Search the catalog</h2>
              <p className="text-xs text-text-muted">Find books by title, author, or subject</p>
            </header>

            <div className="p-5">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Organic Chemistry"
                  className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                             text-text-main placeholder:text-text-muted/60
                             focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold px-5
                             disabled:opacity-60 transition-colors"
                >
                  {searching ? 'Searching…' : 'Search'}
                </button>
              </form>

              {data.query && (
                <div className="mt-5">
                  <p className="text-xs text-text-muted mb-2">
                    {data.catalog.length} result{data.catalog.length === 1 ? '' : 's'} for "{data.query}"
                  </p>

                  {data.catalog.length === 0 ? (
                    <div className="border border-border rounded-lg p-6 text-center text-xs text-text-muted">
                      No matching books found.
                    </div>
                  ) : (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-background text-[11px] uppercase tracking-wider text-text-muted">
                          <tr>
                            <th className="text-left px-4 py-2 font-semibold">Title</th>
                            <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Author</th>
                            <th className="text-left px-4 py-2 font-semibold hidden lg:table-cell">Category</th>
                            <th className="text-left px-4 py-2 font-semibold">Availability</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.catalog.map((b) => (
                            <tr key={b.id} className="border-t border-border hover:bg-primary-subtle/40 transition-colors">
                              <td className="px-4 py-2.5 text-text-main font-medium">{b.title}</td>
                              <td className="px-4 py-2.5 text-text-muted hidden md:table-cell">{b.author || '—'}</td>
                              <td className="px-4 py-2.5 text-text-muted hidden lg:table-cell">{b.category || '—'}</td>
                              <td className="px-4 py-2.5">
                                {b.available_copies > 0 ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-status-verified/10 text-status-verified">
                                    {b.available_copies} available
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-status-pending/10 text-status-pending">
                                    Issued out
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <p className="text-xs text-text-muted">
            You can only view your own borrowing history — all library queries are scoped to your own student ID.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}