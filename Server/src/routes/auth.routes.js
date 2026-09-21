import { Router } from 'express';
import {
  login,
  me,
  updateProfile,
  changePassword,
  updateAvatar,
  clearAvatar
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, me);

// Shared profile endpoints — any authenticated user
router.patch('/profile',                authenticate, updateProfile);
router.post('/change-password',         authenticate, changePassword);
router.post('/profile/photo',           authenticate, updateAvatar);
router.delete('/profile/photo',         authenticate, clearAvatar);

export default router;