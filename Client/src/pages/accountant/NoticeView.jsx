// import { useParams, useNavigate } from 'react-router-dom';
// import DashboardLayout from '../../layouts/DashboardLayout.jsx';
// import { useFetch } from '../../hooks/useFetch.js';
// import { getMyNotice } from '../../api/notifications.js';
// import Spinner from '../../components/Spinner.jsx';
// import ErrorState from '../../components/ErrorState.jsx';

// function fmtDateTime(d) {
//   if (!d) return '—';
//   const dt = new Date(d);
//   return dt.toLocaleString('en-GB', {
//     day: 'numeric', month: 'short', year: 'numeric',
//     hour: 'numeric', minute: '2-digit'
//   });
// }

// const AUDIENCE_LABEL = {
//   ALL:      'All users',
//   STAFF:    'All staff',
//   TEACHERS: 'Teachers',
//   STUDENTS: 'Students',
//   PARENTS:  'Parents'
// };

// export default function AccountantNoticeView() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { data, loading, error, retry } = useFetch(() => getMyNotice(id), [id]);

//   return (
//     <DashboardLayout
//       pageTitle="Notice"
//       pageSubtitle={data ? data.title : 'Loading…'}
//     >
//       <div className="mb-4">
//         <button
//           onClick={() => navigate('/accountant/notices')}
//           className="text-xs text-primary hover:text-primary-active font-medium"
//         >
//           ← Back to Notices
//         </button>
//       </div>

//       {loading && (
//         <div className="py-24 grid place-items-center">
//           <Spinner size="lg" label="Loading notice..." />
//         </div>
//       )}

//       {!loading && error && (
//         <ErrorState title="Couldn't load notice" message={error} onRetry={retry} />
//       )}

//       {!loading && !error && data && (
//         <article className="bg-surface border border-border rounded-2xl overflow-hidden max-w-3xl mx-auto">
//           <header className="px-6 py-5 border-b border-border">
//             <div className="flex items-center gap-2 mb-2">
//               <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-subtle text-primary">
//                 {AUDIENCE_LABEL[data.audience] || data.audience}
//               </span>
//             </div>
//             <h1 className="text-lg font-bold text-text-main leading-snug">
//               {data.title}
//             </h1>
//             <p className="text-xs text-text-muted mt-2">
//               {data.published_by_name ? `${data.published_by_name} · ` : ''}
//               {fmtDateTime(data.published_at)}
//             </p>
//           </header>

//           <div className="px-6 py-6">
//             <p className="text-sm text-text-main whitespace-pre-line leading-relaxed">
//               {data.message}
//             </p>
//           </div>

//           <footer className="px-6 py-4 border-t border-border bg-background">
//             <p className="text-[11px] text-text-muted">
//               This notice was published to your institutional feed. Reach out to the
//               administration office for any clarification.
//             </p>
//           </footer>
//         </article>
//       )}
//     </DashboardLayout>
//   );
// }

import NoticeDetail from '../../components/NoticeDetail.jsx';

export default function AccountantNoticeView() {
  return <NoticeDetail backPath="/accountant/notices" />;
}