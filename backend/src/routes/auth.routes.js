import { Router } from 'express';
import { login, loginGoogle } from '../controllers/auth.controller.js';
import { loginLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/login', loginLimiter, login);
router.post('/google', loginLimiter, loginGoogle);

export default router;
