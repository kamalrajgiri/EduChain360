import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import {
  getDashboard,
  getAttendance,
  getResults,
  getFees,
  getReceipt,
  getCertificates,
  getCertificate,
  getLibrary
} from '../controllers/student.controller.js';

const router = Router();

// Every route here requires an authenticated Student
router.use(authenticate, requireRole('Student'));

router.get('/dashboard',                 getDashboard);
router.get('/attendance',                getAttendance);
router.get('/results',                   getResults);
router.get('/fees',                      getFees);
router.get('/fees/receipts/:id',         getReceipt);
router.get('/certificates',              getCertificates);
router.get('/certificates/:uuid',        getCertificate);
router.get('/library',                   getLibrary);

export default router;