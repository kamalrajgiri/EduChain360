import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getTimetable } from '../../api/teacher.js';
import { SkeletonCard } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABEL = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday' };

export default function TeacherTimetable() {
  const { data: entries, loading, error, retry } = useFetch(() => getTimetable(), []);

  const rows = entries || [];

  // Build a matrix: unique time-slots × days
  const slots = Array.from(new Set(rows.map((r) => `${r.start_time}|${r.end_time}`)))
    .sort()
    .map((key) => {
      const [start, end] = key.split('|');
      return { start, end, key };
    });

  function cell(day, slot) {
    return rows.find(
      (r) => r.day_of_week === day
        && String(r.start_time) === slot.start
        && String(r.end_time) === slot.end
    );
  }

  return (
    <DashboardLayout pageTitle="Timetable" pageSubtitle="Your weekly class schedule">
      {loading && (
        <div className="space-y-3">
          <SkeletonCard lines={6} />
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Couldn't load timetable" message={error} onRetry={retry} />
      )}

      {!loading && !error && rows.length === 0 && (
        <EmptyState
          icon="🗓️"
          title="No timetable entries yet"
          message="Once the admin publishes your schedule, it will show up here."
        />
      )}

      {!loading && !error && rows.length > 0 && (
        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-main">Weekly schedule</h2>
            <p className="text-xs text-text-muted">
              {rows.length} session{rows.length === 1 ? '' : 's'}
            </p>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead className="bg-background text-[10px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold w-32">Time</th>
                  {DAY_ORDER.map((d) => (
                    <th key={d} className="text-left px-4 py-2.5 font-semibold">{DAY_LABEL[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.key} className="border-t border-border">
                    <td className="px-4 py-3 text-text-muted font-mono">
                      {slot.start.slice(0, 5)}–{slot.end.slice(0, 5)}
                    </td>
                    {DAY_ORDER.map((d) => {
                      const e = cell(d, slot);
                      return (
                        <td key={d} className="px-4 py-3">
                          {e ? (
                            <div className="bg-primary-subtle text-primary rounded-lg px-3 py-2">
                              <p className="text-[11px] font-semibold truncate">{e.subject}</p>
                              <p className="text-[10px] opacity-80 truncate">
                                {e.class_name}{e.room ? ` · ${e.room}` : ''}
                              </p>
                            </div>
                          ) : (
                            <span className="text-text-muted/40">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </DashboardLayout>
  );
}