import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import {
  getDashboard,
  getMyClasses,
  getClassDetail,
  getAttendance,
  saveAttendance,
  getExams,
  getExamMarks,
  getExamDetailByName,
  saveExams,
  getTimetable,
  getActivity,
  getStudentAttendance
} from '../controllers/teacher.controller.js';

const router = Router();

router.use(authenticate, requireRole('Teacher'));

// Dashboard
router.get('/dashboard',                                getDashboard);
router.get('/activity',                                 getActivity);

// Classes
router.get('/classes',                                  getMyClasses);
router.get('/classes/:classId',                         getClassDetail);

// Attendance
router.get('/attendance',                               getAttendance);
router.post('/attendance',                              saveAttendance);
router.get('/students/:studentId/attendance',           getStudentAttendance);

// Exams & marks
router.get('/exams',                                    getExams);
router.get('/exams/detail',                            getExamDetailByName);
router.get('/exams/:examId/marks',                      getExamMarks);
router.post('/exams/save',                              saveExams);

// Timetable
router.get('/timetable',                                getTimetable);

export default router;