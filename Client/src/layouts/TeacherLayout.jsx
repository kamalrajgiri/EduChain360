// Client/src/layouts/TeacherLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  GraduationCap,
  Clock,
  Bell,
  Bot,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const MENU = [
  { to: "/teacher/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/teacher/my-classes", icon: Users, label: "My Classes" },
  { to: "/teacher/attendance", icon: CalendarCheck, label: "Attendance" },
  { to: "/teacher/exams-marks", icon: GraduationCap, label: "Exams & Marks" },
  { to: "/teacher/timetable", icon: Clock, label: "Timetable" },
  { to: "/teacher/notices", icon: Bell, label: "Notices" },
  { to: "/teacher/ai-chatbot", icon: Bot, label: "AI Chatbot" },
];

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-canvas-offwhite dark:bg-navy-900 transition-colors">
      {/* Sidebar — Navy is the brand/navigation color */}
      <aside className="w-60 bg-gradient-to-b from-navy-900 to-navy-800 flex flex-col shrink-0">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            EC
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              EduChain360
            </p>
            <p className="text-indigo-100 text-xs leading-tight">Teacher</p>
          </div>
        </div>

        <p className="text-navy-100/60 text-xs font-semibold tracking-wide px-5 mt-2 mb-2">
          MAIN MENU
        </p>

        <nav className="flex-1 px-2">
          {MENU.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm mb-1 transition-all ${
                    isActive
                      ? "bg-navy-700 text-white font-medium shadow-sm"
                      : "text-navy-100/80 hover:bg-navy-700/50 hover:text-white hover:translate-x-0.5"
                  }`
                }
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-2 pb-4 border-t border-white/10 pt-3 mx-3">
          <NavLink
            to="/teacher/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm mb-1 transition-colors ${
                isActive
                  ? "bg-navy-700 text-white font-medium"
                  : "text-navy-100/70 hover:bg-navy-700/50 hover:text-white"
              }`
            }
          >
            <SettingsIcon size={17} strokeWidth={2} />
            Settings
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-navy-100/70 hover:text-white hover:bg-navy-700/50 transition-colors"
          >
            <LogOut size={17} strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-navy-800 flex items-center justify-between px-6 shrink-0">
          <input
            type="text"
            placeholder="Search records, students, staff..."
            className="w-72 px-3 py-1.5 rounded-full text-sm bg-white/10 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition-colors"
          />
          <div className="flex items-center gap-4">
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              TEACHER
            </span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                {user?.initials || "T"}
              </div>
              <div className="text-white text-sm leading-tight">
                <p className="font-medium">{user?.name || "Teacher"}</p>
                <p className="text-white/60 text-xs">{user?.role || "Teacher"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}