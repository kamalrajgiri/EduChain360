import React from "react";

import {
  Menu,
  Search,
  Bell,
  ChevronDown
} from "lucide-react";

function AdminHeader({
  onMenu
}) {

  return (
    <header className="admin-header">

      <div className="header-left">

        <button
          className="mobile-menu"
          onClick={onMenu}
        >
          <Menu size={21} />
        </button>

        <div>

          <h1>
            Good morning, Kamal
          </h1>

          <p>
            Here's what's happening
            across EduChain360 today
          </p>

        </div>

      </div>

      <div className="header-actions">

        <div className="header-search">

          <Search size={16} />

          <input
            placeholder="Search records, students, staff..."
          />

          <kbd>
            Ctrl K
          </kbd>

        </div>

        <button className="notification-button">

          <Bell size={18} />

          <span>
            3
          </span>

        </button>

        <button className="profile-button">

          <div className="avatar">
            KG
          </div>

          <div className="profile-details">

            <strong>
              Kamal Raj Giri
            </strong>

            <small>
              System Administrator
            </small>

          </div>

          <ChevronDown size={15} />

        </button>

      </div>

    </header>
  );
}

export default AdminHeader;