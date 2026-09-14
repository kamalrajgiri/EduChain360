import { Router } from 'express';
import authRoutes from './auth.routes.js';
const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, service: 'EduChain360 API', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
// Future: /admin, /students, /teachers, /fees, /library, /hr, /lab, /public, /chatbot, /blockchain

export default router;