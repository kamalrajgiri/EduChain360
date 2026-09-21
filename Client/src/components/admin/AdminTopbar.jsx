import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  HelpCircle,
  Menu,
  Search,
  Settings,
  UserRound,
  LogOut,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function getUserName(user) {
  if (!user) return "Admin User";

  if (user.name) return user.name;

  return (
    [
      user.firstName,
      user.middleName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user.email ||
    "Admin User"
  );
}

function getInitials(name) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AU"
  );
}

export default function AdminTopbar({ onMenuClick }) {
  const navigate = useNavigate();
  const auth = useAuth();

  const user = auth?.user;
  const adminName = getUserName(user);
  const initials = getInitials(adminName);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (typeof auth?.logout === "function") {
        await auth.logout();
      }
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6 lg:px-7">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-text-muted hover:bg-background hover:text-primary lg:hidden"
        >
          <Menu size={19} />
        </button>

        {/* Search */}
        <div className="hidden max-w-md flex-1 md:block">
          <div className="flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3">
            <Search
              size={16}
              className="shrink-0 text-text-muted"
            />

            <input
              type="search"
              placeholder="Search students, staff, admissions..."
              className="min-w-0 flex-1 bg-transparent text-xs text-text-main outline-none placeholder:text-text-muted"
            />

            <span className="hidden rounded-md border border-border bg-surface px-1.5 py-0.5 text-[9px] text-text-muted lg:inline-block">
              /
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Help */}
          <button
            type="button"
            onClick={() => navigate("/help")}
            className="hidden h-9 w-9 place-items-center rounded-xl text-text-muted hover:bg-background hover:text-primary sm:grid"
            title="Help"
          >
            <HelpCircle size={17} />
          </button>

          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationOpen((value) => !value);
                setProfileOpen(false);
              }}
              className="relative grid h-9 w-9 place-items-center rounded-xl text-text-muted hover:bg-background hover:text-primary"
              title="Notifications"
            >
              <Bell size={17} />

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
            </button>

            {notificationOpen && (
              <div className="animate-dropdown absolute right-0 top-11 w-[320px] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <h3 className="text-sm font-bold text-text-main">
                      Notifications
                    </h3>
                    <p className="mt-0.5 text-[10px] text-text-muted">
                      Recent admin activity
                    </p>
                  </div>

                  <span className="rounded-full bg-primary-subtle px-2 py-1 text-[10px] font-bold text-primary">
                    3 new
                  </span>
                </div>

                <div>
                  <button
                    type="button"
                    className="w-full border-b border-border px-4 py-3 text-left hover:bg-primary-subtle/40"
                  >
                    <p className="text-xs font-semibold text-text-main">
                      New admission application
                    </p>
                    <p className="mt-1 text-[10px] text-text-muted">
                      BCA application received 10 minutes ago.
                    </p>
                  </button>

                  <button
                    type="button"
                    className="w-full border-b border-border px-4 py-3 text-left hover:bg-primary-subtle/40"
                  >
                    <p className="text-xs font-semibold text-text-main">
                      Blockchain verification completed
                    </p>
                    <p className="mt-1 text-[10px] text-text-muted">
                      Certificate record was verified successfully.
                    </p>
                  </button>

                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-primary-subtle/40"
                  >
                    <p className="text-xs font-semibold text-text-main">
                      Fee report generated
                    </p>
                    <p className="mt-1 text-[10px] text-text-muted">
                      Monthly finance report is ready.
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((value) => !value);
                setNotificationOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-background"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-subtle text-[10px] font-bold text-primary">
                {initials}
              </div>

              <div className="hidden text-left lg:block">
                <p className="max-w-[120px] truncate text-xs font-semibold text-text-main">
                  {adminName}
                </p>
                <p className="text-[9px] text-text-muted">
                  Administrator
                </p>
              </div>

              <ChevronDown
                size={14}
                className="hidden text-text-muted sm:block"
              />
            </button>

            {profileOpen && (
              <div className="animate-dropdown absolute right-0 top-11 w-56 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-xs font-bold text-text-main">
                    {adminName}
                  </p>

                  <p className="mt-1 truncate text-[10px] text-text-muted">
                    {user?.email || "admin@educhain360.edu"}
                  </p>
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/admin/profile");
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-text-main hover:bg-primary-subtle hover:text-primary"
                  >
                    <UserRound size={15} />
                    My Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigate("/admin/settings");
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-text-main hover:bg-primary-subtle hover:text-primary"
                  >
                    <Settings size={15} />
                    Settings
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigate("/help");
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-text-main hover:bg-primary-subtle hover:text-primary"
                  >
                    <HelpCircle size={15} />
                    Help & Support
                  </button>

                  <div className="my-1 border-t border-border" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-danger hover:bg-red-50"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}