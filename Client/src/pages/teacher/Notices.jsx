const NOTICES = [
  {
    title: "Mid-term exam schedule released",
    date: "Sep 8, 2026",
    body: "Mid-term examinations for Grade 10–12 begin next Monday. Please submit marks within 48 hours of each exam.",
  },
  {
    title: "Staff meeting — Friday 3 PM",
    date: "Sep 7, 2026",
    body: "All teachers are requested to attend the term-planning meeting in the staff room.",
  },
  {
    title: "System maintenance window",
    date: "Sep 5, 2026",
    body: "EduChain360 will be briefly unavailable on Saturday night for scheduled maintenance.",
  },
];

export default function Notices() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy-900 mb-1">Notices</h1>
      <p className="text-gray-500 text-sm mb-6">School-wide announcements.</p>

      <div className="space-y-4">
        {NOTICES.map((n) => (
          <div key={n.title} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-navy-900 font-semibold">{n.title}</p>
              <span className="text-xs text-gray-400">{n.date}</span>
            </div>
            <p className="text-gray-500 text-sm">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}