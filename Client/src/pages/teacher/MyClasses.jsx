const CLASSES = [
  { name: "Grade 11 Science A", subject: "Physics", students: 36 },
  { name: "Grade 11 Science B", subject: "Physics", students: 34 },
  { name: "Grade 10 A", subject: "Science", students: 38 },
  { name: "Grade 10 B", subject: "Science", students: 34 },
];

export default function MyClasses() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy-900 mb-1">My Classes</h1>
      <p className="text-gray-500 text-sm mb-6">Classes assigned to you this term.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CLASSES.map((c) => (
          <div key={c.name} className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-navy-900 font-semibold">{c.name}</p>
            <p className="text-gray-500 text-sm mt-1">{c.subject}</p>
            <p className="text-indigo-700 text-sm font-medium mt-3">
              {c.students} students
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}