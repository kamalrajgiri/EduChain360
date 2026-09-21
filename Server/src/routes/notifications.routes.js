import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotifications,
  getMyNotices,
  getMyNotice
} from '../controllers/notifications.controller.js';

const router = Router();

router.use(authenticate);

// Bell dropdown — recent notices for the current role
router.get('/', getNotifications);

// Full notices list + detail — same audience filter, full body
router.get('/notices',     getMyNotices);
router.get('/notices/:id', getMyNotice);

export default router;