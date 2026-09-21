import express from "express";

import {
  getDashboard,
  getAdmissions,
  createAdmission,
  updateAdmission,
  deleteAdmission,

  getUsers,
  createUser,
  updateUser,
  deleteUser,

  getAcademics,
  getFinance,
  getLibrary,
  getHr,
  getAnalytics,
  getBlockchain,

  getProfile,
  updateProfile,
  changePassword,

  getNotifications,
  markNotificationRead,

  getSettings,
  updateSettings,
} from "../controllers/admin.controller.js";

import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getStudentsForEnrollment,
  getEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getTeachersForAssignment,
  getTeacherAssignments,
  createTeacherAssignment,
  updateTeacherAssignment,
  deleteTeacherAssignment,
  getAcademicManagementSummary,
} from "../controllers/adminAcademic.controller.js";

const router = express.Router();

router.get("/dashboard", getDashboard);

router.get("/admissions", getAdmissions);
router.post("/admissions", createAdmission);
router.patch("/admissions/:id", updateAdmission);
router.delete("/admissions/:id", deleteAdmission);

router.get("/users", getUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/academics", getAcademics);

router.get("/academic-management/summary", getAcademicManagementSummary);

router.get("/academic-management/classes", getClasses);
router.post("/academic-management/classes", createClass);
router.patch("/academic-management/classes/:id", updateClass);
router.delete("/academic-management/classes/:id", deleteClass);

router.get("/academic-management/subjects", getSubjects);
router.post("/academic-management/subjects", createSubject);
router.patch("/academic-management/subjects/:id", updateSubject);
router.delete("/academic-management/subjects/:id", deleteSubject);

router.get("/academic-management/students", getStudentsForEnrollment);
router.get("/academic-management/enrollments", getEnrollments);
router.post("/academic-management/enrollments", createEnrollment);
router.patch("/academic-management/enrollments/:id", updateEnrollment);
router.delete("/academic-management/enrollments/:id", deleteEnrollment);

router.get("/academic-management/teachers", getTeachersForAssignment);
router.get("/academic-management/teacher-assignments", getTeacherAssignments);
router.post("/academic-management/teacher-assignments", createTeacherAssignment);
router.patch("/academic-management/teacher-assignments/:id", updateTeacherAssignment);
router.delete("/academic-management/teacher-assignments/:id", deleteTeacherAssignment);

router.get("/finance", getFinance);
router.get("/library", getLibrary);
router.get("/hr", getHr);
router.get("/analytics", getAnalytics);
router.get("/blockchain", getBlockchain);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/profile/password", changePassword);

router.get("/notifications", getNotifications);
router.patch(
  "/notifications/:id/read",
  markNotificationRead
);

router.get("/settings", getSettings);
router.patch("/settings", updateSettings);

export default router;