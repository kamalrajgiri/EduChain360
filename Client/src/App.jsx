import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import TeacherLayout from "./layouts/TeacherLayout";
import Dashboard from "./pages/teacher/Dashboard";
import MyClasses from "./pages/teacher/MyClasses";
import Attendance from "./pages/teacher/Attendance";
import ExamsMarks from "./pages/teacher/ExamsMarks";
import Timetable from "./pages/teacher/Timetable";
import Notices from "./pages/teacher/Notices";
import AIChatbot from "./pages/teacher/AIChatbot";
import Settings from "./pages/teacher/Settings";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/teacher"
              element={
                <ProtectedRoute>
                  <TeacherLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="my-classes" element={<MyClasses />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="exams-marks" element={<ExamsMarks />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="notices" element={<Notices />} />
              <Route path="ai-chatbot" element={<AIChatbot />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}