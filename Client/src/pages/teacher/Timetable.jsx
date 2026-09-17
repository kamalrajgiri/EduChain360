const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = ["9:00", "10:00", "11:00", "1:00", "2:00"];

// Mock — swap for a fetch to /api/timetable once ready.
const CELLS = {
  "Sun-9:00": "Grade 11 A · Physics",
  "Mon-10:00": "Grade 11 B · Physics",
  "Tue-9:00": "Grade 10 A · Science",
  "Wed-1:00": "Grade 10 B · Science",
  "Thu-11:00": "Grade 11 A · Physics",
};

export default function Timetable() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy-900 mb-1">Timetable</h1>
      <p className="text-gray-500 text-sm mb-6">Your weekly class schedule.</p>

      <div className="bg-white rounded-xl shadow-sm p-5 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left text-gray-500 font-medium pb-3 pr-4">Time</th>
              {DAYS.map((d) => (
                <th key={d} className="text-left text-gray-500 font-medium pb-3 pr-4">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p) => (
              <tr key={p} className="border-t border-gray-100">
                <td className="py-3 pr-4 text-gray-500">{p}</td>
                {DAYS.map((d) => {
                  const key = `${d}-${p}`;
                  return (
                    <td key={key} className="py-3 pr-4">
                      {CELLS[key] ? (
                        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded-md">
                          {CELLS[key]}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}