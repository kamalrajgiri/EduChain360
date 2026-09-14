import { Router } from 'express';
import authRoutes from './auth.routes.js';
import studentRoutes from './student.routes.js';
const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, service: 'EduChain360 API', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/student', studentRoutes);
// Future: /admin, /students, /teachers, /fees, /library, /hr, /lab, /public, /chatbot, /blockchain

export default router;