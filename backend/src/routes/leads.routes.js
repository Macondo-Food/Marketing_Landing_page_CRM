import { Router } from 'express';
import { createLead, listLeads, updateEstado } from '../controllers/leads.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { leadsLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/', leadsLimiter, createLead);
router.get('/', requireAuth, listLeads);
router.patch('/:id/estado', requireAuth, updateEstado);

export default router;
