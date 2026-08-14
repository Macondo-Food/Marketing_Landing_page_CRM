import { Router } from 'express';
import { createUtmUrl, listUtmUrls } from '../controllers/utm.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listUtmUrls);
router.post('/', requireAuth, createUtmUrl);

export default router;
