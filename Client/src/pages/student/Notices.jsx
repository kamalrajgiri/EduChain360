// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import DashboardLayout from '../../layouts/DashboardLayout.jsx';
// import { useFetch } from '../../hooks/useFetch.js';
// import { getMyNotices } from '../../api/notifications.js';
// import { SkeletonCard } from '../../components/Skeleton.jsx';
// import ErrorState from '../../components/ErrorState.jsx';
// import EmptyState from '../../components/EmptyState.jsx';

// const READ_KEY = 'educhain360_read_notices';

// function timeAgo(iso) {
//   if (!iso) return '—';
//   const then = new Date(iso);
//   const now = new Date();
//   const seconds = Math.floor((now - then) / 1000);
//   if (seconds < 60)    return 'just now';
//   if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
//   if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
//   if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
//   return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
// }

// const AUDIENCE_CHIP = {
//   ALL:      'bg-primary-subtle text-primary',
//   STUDENTS: 'bg-status-pending/10 text-status-pending',
//   PARENTS:  'bg-status-pending/10 text-status-pending',
//   STAFF:    'bg-secondary-subtle text-secondary',
//   TEACHERS: 'bg-secondary-subtle text-secondary'
// };

// function loadRead() {
//   try {
//     const raw = localStorage.getItem(READ_KEY);
//     return raw ? JSON.parse(raw) : [];
//   } catch {
//     return [];
//   }
// }

// export default function StudentNotices() {
//   const { data, loading, error, retry } = useFetch(() => getMyNotices(), []);
//   const [readIds, setReadIds] = useState(loadRead);
//   const [flash, setFlash] = useState(false);

//   useEffect(() => {
//     if (!flash) return;
//     const t = setTimeout(() => setFlash(false), 1500);
//     return () => clearTimeout(t);
//   }, [flash]);

//   const unreadCount = (data || []).filter((n) => !readIds.includes(n.id)).length;

//   function markAllRead() {
//     const ids = (data || []).map((n) => n.id);
//     const next = Array.from(new Set([...readIds, ...ids]));
//     setReadIds(next);
//     try { localStorage.setItem(READ_KEY, JSON.stringify(next)); } catch { /* ignore */ }
//     setFlash(true);
//   }

//   return (
//     <DashboardLayout
//       pageTitle="Notices"
//       pageSubtitle="Announcements from your institution"
//     >
//       {loading && (
//         <div className="space-y-3">
//           <SkeletonCard lines={2} />
//           <SkeletonCard lines={2} />
//           <SkeletonCard lines={2} />
//         </div>
//       )}

//       {!loading && error && (
//         <ErrorState title="Couldn't load notices" message={error} onRetry={retry} />
//       )}

//       {!loading && !error && (!data || data.length === 0) && (
//         <EmptyState
//           icon="📭"
//           title="No notices yet"
//           message="When the institution publishes announcements, they'll show up here."
//         />
//       )}

//       {!loading && !error && data && data.length > 0 && (
//         <div className="space-y-3">
//           <div className="flex items-center justify-between gap-3 flex-wrap">
//             <p className="text-xs text-text-muted">
//               {data.length} notice{data.length === 1 ? '' : 's'}
//               {unreadCount > 0 && ` · ${unreadCount} unread`}
//             </p>
//             {unreadCount > 0 && (
//               <button
//                 onClick={markAllRead}
//                 className="text-xs font-medium text-primary hover:text-primary-active transition-colors"
//               >
//                 Mark all read
//               </button>
//             )}
//             {flash && (
//               <span className="text-xs font-medium text-status-verified">
//                 ✓ All marked read
//               </span>
//             )}
//           </div>

//           {data.map((n) => {
//             const isRead = readIds.includes(n.id);
//             return (
//               <Link
//                 key={n.id}
//                 to={`/student/notices/${n.id}`}
//                 className={`block bg-surface border border-border rounded-2xl p-5
//                            hover:border-primary hover:shadow-sm transition-all group
//                            ${isRead ? 'opacity-70' : ''}`}
//               >
//                 <div className="flex items-start justify-between gap-4">
//                   <div className="min-w-0 flex-1">
//                     <div className="flex items-center gap-2 mb-1.5 flex-wrap">
//                       <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${AUDIENCE_CHIP[n.audience] || 'bg-background text-text-muted'}`}>
//                         {n.audience}
//                       </span>
//                       {!isRead && (
//                         <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Unread" />
//                       )}
//                       <span className="text-[11px] text-text-muted">{timeAgo(n.published_at)}</span>
//                     </div>

//                     <h3 className={`text-sm font-bold group-hover:text-primary transition-colors ${
//                       isRead ? 'text-text-muted' : 'text-text-main'
//                     }`}>
//                       {n.title}
//                     </h3>

//                     <p className="text-xs text-text-muted mt-1 line-clamp-2">
//                       {n.message}
//                     </p>
//                   </div>

//                   <span className="text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform shrink-0 self-center">
//                     Open →
//                   </span>
//                 </div>
//               </Link>
//             );
//           })}
//         </div>
//       )}
//     </DashboardLayout>
//   );
// }


import NoticesList from '../../components/NoticesList.jsx';

export default function StudentNotices() {
  return (
    <NoticesList
      basePath="/student/notices"
      pageTitle="Notices"
      pageSubtitle="Announcements from your institution"
    />
  );
}