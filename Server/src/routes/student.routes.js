import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import {
  getDashboard,
  getAttendance,
  getResults,
  getFees,
  getReceipt,
  payFees,
  getCertificates,
  getCertificate,
  getLibrary,
  getNotices,
  getNotice,
  updateProfile,
  changePassword,
  updateAvatar,
  clearAvatar,
  search
} from '../controllers/student.controller.js';

const router = Router();

router.use(authenticate, requireRole('Student'));

router.get('/dashboard',                 getDashboard);
router.get('/attendance',                getAttendance);
router.get('/results',                   getResults);
router.get('/fees',                      getFees);
router.get('/fees/receipts/:id',         getReceipt);
router.post('/fees/pay',                 payFees);
router.get('/certificates',              getCertificates);
router.get('/certificates/:uuid',        getCertificate);
router.get('/library',                   getLibrary);
router.get('/notices',                   getNotices);
router.get('/notices/:id',               getNotice);
router.patch('/profile',                 updateProfile);
router.post('/change-password',          changePassword);
router.post('/profile/photo',            updateAvatar);
router.delete('/profile/photo',          clearAvatar);
router.get('/search',                    search);

export default router;