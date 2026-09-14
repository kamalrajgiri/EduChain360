import React from "react";
import {
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import AdminLayout from "./components/admin/AdminLayout";

import Dashboard from "./pages/admin/Dashboard";
import Admissions from "./pages/admin/Admissions";
import Users from "./pages/admin/Users";
import Academics from "./pages/admin/Academics";
import Finance from "./pages/admin/Finance";
import Library from "./pages/admin/Library";
import Hr from "./pages/admin/Hr";
import Analytics from "./pages/admin/Analytics";
import Blockchain from "./pages/admin/Blockchain";
import Settings from "./pages/admin/Settings";

function App() {
  return (
    <Routes>

      <Route
        path="/admin"
        element={<AdminLayout />}
      >

        <Route
          index
          element={<Dashboard />}
        />

        <Route
          path="admissions"
          element={<Admissions />}
        />

        <Route
          path="users"
          element={<Users />}
        />

        <Route
          path="academics"
          element={<Academics />}
        />

        <Route
          path="finance"
          element={<Finance />}
        />

        <Route
          path="library"
          element={<Library />}
        />

        <Route
          path="hr"
          element={<Hr />}
        />

        <Route
          path="analytics"
          element={<Analytics />}
        />

        <Route
          path="blockchain"
          element={<Blockchain />}
        />

        <Route
          path="settings"
          element={<Settings />}
        />

      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/admin"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;