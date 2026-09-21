import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import {
  getDashboard,
  getAttendance,
  getAttendanceCalendar,
  getResults,
  getAllExams,
  getFees,
  getReceipt,
  payFees,
  getCertificates,
  getCertificate,
  getLibrary
} from '../controllers/student.controller.js';

const router = Router();

router.use(authenticate, requireRole('Student'));

router.get('/dashboard',                 getDashboard);
router.get('/attendance',                getAttendance);
router.get('/attendance/calendar',       getAttendanceCalendar);
router.get('/results',                   getResults);
router.get('/exams',                     getAllExams);
router.get('/fees',                      getFees);
router.get('/fees/receipts/:id',         getReceipt);
router.post('/fees/pay',                 payFees);
router.get('/certificates',              getCertificates);
router.get('/certificates/:uuid',        getCertificate);
router.get('/library',                   getLibrary);

export default router;