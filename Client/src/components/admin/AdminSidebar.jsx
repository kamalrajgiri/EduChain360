import {
  LayoutDashboard,
  UserPlus,
  Users,
  GraduationCap,
  WalletCards,
  Library,
  BriefcaseBusiness,
  BarChart3,
  Blocks,
  Settings,
  HelpCircle,
  LogOut,
  X,
  ShieldCheck,
  ChevronRight,
  School,
  BookOpen,
  ClipboardList,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const navigation = [
  {
    label: "OVERVIEW",
    items: [
      {
        name: "Dashboard",
        path: "/admin",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      {
        name: "Admissions",
        path: "/admin/admissions",
        icon: UserPlus,
      },
      {
        name: "Users",
        path: "/admin/users",
        icon: Users,
      },
      {
        name: "Academics",
        path: "/admin/academics",
        icon: GraduationCap,
      },
      {
        name: "Finance",
        path: "/admin/finance",
        icon: WalletCards,
      },
      {
        name: "Library",
        path: "/admin/library",
        icon: Library,
      },
      {
        name: "Human Resources",
        path: "/admin/hr",
        icon: BriefcaseBusiness,
      },
        {
          name: "Classes",
          path: "/admin/classes",
          icon: School,
      },

        {
          name: "Subjects",
          path: "/admin/subjects",
          icon: BookOpen,
        },

        {
          name: "Enrollments",
          path: "/admin/enrollments",
          icon: ClipboardList,
        },

        {
          name: "Teacher Assignments",
          path: "/admin/teacher-assignments",
          icon: UserCheck,
        },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      {
        name: "Analytics",
        path: "/admin/analytics",
        icon: BarChart3,
      },
      {
        name: "Blockchain",
        path: "/admin/blockchain",
        icon: Blocks,
      },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      {
        name: "Settings",
        path: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

function getUserName(user) {
  if (!user) return "Admin User";

  if (user.name) return user.name;

  const fullName = [
    user.firstName,
    user.middleName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return fullName || user.email || "Admin User";
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function AdminSidebar({
  open,
  onClose,
  collapsed = false,
  onToggleCollapse,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const auth = useAuth();
  const user = auth?.user;

  const adminName = getUserName(user);
  const initials = getInitials(adminName);

  const handleLogout = async () => {
    try {
      if (typeof auth?.logout === "function") {
        await auth.logout();
      }
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div
        className={`flex h-[72px] items-center border-b border-white/10 ${
          collapsed ? "lg:justify-center lg:px-3" : "px-5"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-primary shadow-sm">
            <ShieldCheck size={20} strokeWidth={2.2} />
          </div>

          <div className={collapsed ? "lg:hidden" : ""}>
            <p className="text-[15px] font-bold tracking-tight text-white">
              EduChain360
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/50">
              Admin Portal
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="ml-auto hidden h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* Admin user */}
      <button
        type="button"
        onClick={() => {
          navigate("/admin/profile");
          onClose();
        }}
        className={`mx-4 mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-left transition hover:bg-white/[0.1] ${
          collapsed ? "lg:mx-3" : ""
        }`}
        title={collapsed ? adminName : undefined}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-primary">
            {initials || "AU"}
          </div>

          <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
            <p className="truncate text-sm font-semibold text-white">
              {adminName}
            </p>

            <p className="mt-0.5 truncate text-[11px] text-white/50">
              Administrator
            </p>
          </div>

          <ChevronRight
            size={15}
            className={`text-white/30 ${collapsed ? "lg:hidden" : ""}`}
          />
        </div>
      </button>

      {/* Navigation */}
      <nav className="mt-6 flex-1 overflow-y-auto px-3 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navigation.map((section) => (
          <div key={section.label} className="mb-6">
            <p className={`mb-2 px-3 text-[9px] font-bold tracking-[0.16em] text-white/35 ${
              collapsed ? "lg:hidden" : ""
            }`}>
              {section.label}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                const active = item.end
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={onClose}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
                      collapsed ? "lg:justify-center lg:px-0" : ""
                    } ${
                      active
                        ? "bg-white text-primary shadow-sm"
                        : "text-white/65 hover:bg-white/[0.07] hover:text-white"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      size={17}
                      strokeWidth={active ? 2.3 : 1.9}
                      className={
                        active
                          ? "text-primary"
                          : "text-white/50 group-hover:text-white"
                      }
                    />

                    <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>
                      {item.name}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        {/* Support */}
        <div className="mt-auto">
          <p className={`mb-2 px-3 text-[9px] font-bold tracking-[0.16em] text-white/35 ${
            collapsed ? "lg:hidden" : ""
          }`}>
            SUPPORT
          </p>

          <button
            type="button"
            onClick={() => navigate("/help")}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/65 transition hover:bg-white/[0.07] hover:text-white ${
              collapsed ? "lg:justify-center lg:px-0" : ""
            }`}
            title={collapsed ? "Help & Support" : undefined}
          >
            <HelpCircle size={17} className="text-white/50" />
            <span className={collapsed ? "lg:hidden" : ""}>Help & Support</span>
          </button>
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/60 transition hover:bg-red-500/10 hover:text-red-300 ${
            collapsed ? "lg:justify-center lg:px-0" : ""
          }`}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut size={17} />
          <span className={collapsed ? "lg:hidden" : ""}>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-primary-dark shadow-2xl transition-[width,transform] duration-200 lg:translate-x-0 lg:shadow-none ${
          collapsed ? "lg:w-[78px]" : "lg:w-[260px]"
        } w-[260px] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}