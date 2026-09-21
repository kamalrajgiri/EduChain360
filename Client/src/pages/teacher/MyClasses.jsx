import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getMyClasses } from '../../api/teacher.js';
import { SkeletonCard } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function TeacherMyClasses() {
  const { data: classes, loading, error, retry } = useFetch(() => getMyClasses(), []);

  return (
    <DashboardLayout
      pageTitle="My Classes"
      pageSubtitle="Classes assigned to you this term"
    >
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Couldn't load classes" message={error} onRetry={retry} />
      )}

      {!loading && !error && (!classes || classes.length === 0) && (
        <EmptyState
          icon="🏫"
          title="No classes assigned yet"
          message="Once the admin assigns you to classes, they'll show up here with student rosters."
        />
      )}

      {!loading && !error && classes && classes.length > 0 && (
        <>
          <p className="text-xs text-text-muted mb-4">
            {classes.length} class{classes.length === 1 ? '' : 'es'} assigned
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {classes.map((c) => {
              // First subject in the group_concat string as the "primary" subject for the icon
              const firstSubject = (c.subjects || '').split(',')[0].trim() || 'CL';
              return (
                <Link
                  key={c.id}
                  to={`/teacher/classes/${c.id}`}
                  className="bg-surface border border-border rounded-2xl p-5 hover:border-primary hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-primary-subtle text-primary grid place-items-center text-xs font-bold">
                      {firstSubject.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                      {c.academic_year}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">
                    {c.subjects || 'No subjects assigned'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      {c.student_count} {c.student_count === 1 ? 'student' : 'students'}
                    </span>
                    <span className="text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform">
                      Open →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}