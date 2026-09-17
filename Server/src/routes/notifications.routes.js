import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getNotifications } from '../controllers/notifications.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', getNotifications);

export default router;