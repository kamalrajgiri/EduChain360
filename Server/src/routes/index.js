import { Router } from 'express';
import authRoutes from './auth.routes.js';
import studentRoutes from './student.routes.js';
import notificationsRoutes from './notifications.routes.js';
import accountantRoutes from './accountant.routes.js';
import searchRoutes from './search.routes.js';
import teacherRoutes from './teacher.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, service: 'EduChain360 API', time: new Date().toISOString() });
});

router.use('/auth',          authRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/search',        searchRoutes);

// Role-specific
router.use('/student',       studentRoutes);
router.use('/accountant',    accountantRoutes);
router.use('/teacher',       teacherRoutes);

export default router;