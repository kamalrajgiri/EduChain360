import { Router } from 'express';
import authRoutes from './auth.routes.js';
import studentRoutes from './student.routes.js';
import notificationsRoutes from './notifications.routes.js';
import adminRoutes from './admin.routes.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, service: 'EduChain360 API', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/student', studentRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/admin', authenticate, requireRole('Admin'), adminRoutes);

export default router;