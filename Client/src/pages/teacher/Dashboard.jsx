import { useEffect, useState } from "react";
import { Users, ClipboardCheck, BellRing, School } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getGreeting } from "../../utils/greeting";

const STATS = [
  { label: "My Classes", value: "4", icon: School },
  { label: "Total Students", value: "142", icon: Users },
  { label: "Pending Attendance", value: "1", icon: ClipboardCheck },
  { label: "Notices This Week", value: "3", icon: BellRing },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());

  // Keep the greeting accurate if the panel is left open across a time boundary.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Teacher";

  return (
    <div>
      <div className="bg-gradient-to-r from-navy-800 to-indigo-700 rounded-xl p-6 mb-6 text-white shadow-sm">
        <h1 className="text-2xl font-semibold">
          {getGreeting(now)}, {firstName}
        </h1>
        <p className="text-white/80 text-sm mt-1">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          {" · "}Here's what's happening in your classes today.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-navy-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-white/10 flex items-center justify-center mb-3">
                <Icon size={18} className="text-indigo-700 dark:text-indigo-100" />
              </div>
              <p className="text-3xl font-semibold text-indigo-700 dark:text-indigo-100">
                {stat.value}
              </p>
              <p className="text-gray-500 dark:text-white/60 text-sm mt-1">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm p-5 mt-6">
        <h2 className="text-navy-900 dark:text-white font-semibold mb-3">
          Today's schedule
        </h2>
        <p className="text-gray-500 dark:text-white/60 text-sm">
          
        </p>
      </div>
    </div>
  );
}