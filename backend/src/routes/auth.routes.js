import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';
import { loginLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/login', loginLimiter, login);

export default router;
