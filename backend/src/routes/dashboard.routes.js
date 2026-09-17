import { Router } from 'express';
import { getDashboard, getCampanas, getLandings } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getDashboard);
router.get('/campanas', requireAuth, getCampanas);
router.get('/landings', requireAuth, getLandings);

export default router;
