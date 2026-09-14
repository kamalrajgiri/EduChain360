import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

function AdminLayout() {

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  return (
    <div className="admin-shell">

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="admin-main">

        <AdminHeader
          onMenu={() => setSidebarOpen(true)}
        />

        <main className="page-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default AdminLayout;