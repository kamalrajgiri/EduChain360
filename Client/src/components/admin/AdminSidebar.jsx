import React from "react";

import {
  NavLink
} from "react-router-dom";

import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  Wallet,
  Library,
  UserCog,
  BarChart3,
  ShieldCheck,
  Settings,
  X
} from "lucide-react";

const menuItems = [

  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard
  },

  {
    label: "Admissions",
    path: "/admin/admissions",
    icon: GraduationCap
  },

  {
    label: "Users",
    path: "/admin/users",
    icon: Users
  },

  {
    label: "Academics",
    path: "/admin/academics",
    icon: BookOpen
  },

  {
    label: "Finance",
    path: "/admin/finance",
    icon: Wallet
  },

  {
    label: "Library",
    path: "/admin/library",
    icon: Library
  },

  {
    label: "HR Management",
    path: "/admin/hr",
    icon: UserCog
  },

  {
    label: "Analytics",
    path: "/admin/analytics",
    icon: BarChart3
  },

  {
    label: "Blockchain Verify",
    path: "/admin/blockchain",
    icon: ShieldCheck
  },

  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings
  }

];

function AdminSidebar({
  open,
  onClose
}) {

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`admin-sidebar ${
          open ? "open" : ""
        }`}
      >

        <div className="sidebar-brand">

          <div className="brand-logo">
            EC
          </div>

          <div>
            <h2>
              EduChain
              <span>360</span>
            </h2>

            <small>
              Administrator Portal
            </small>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>

        <div className="menu-title">
          MAIN MENU
        </div>

        <nav className="sidebar-nav">

          {menuItems.map(
            ({
              label,
              path,
              icon: Icon
            }) => (

              <NavLink
                key={path}
                to={path}
                end={path === "/admin"}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >

                <span className="sidebar-icon">
                  <Icon size={17} />
                </span>

                <span>
                  {label}
                </span>

              </NavLink>

            )
          )}

        </nav>

        <div className="sidebar-footer">

          <div className="admin-profile">

            <div className="avatar">
              KG
            </div>

            <div>
              <strong>
                Kamal Raj Giri
              </strong>

              <small>
                System Administrator
              </small>
            </div>

          </div>

        </div>

      </aside>
    </>
  );
}

export default AdminSidebar;