import { Router } from 'express';
import { getDashboard, getCampanas } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getDashboard);
router.get('/campanas', requireAuth, getCampanas);

export default router;
