import { Router } from 'express';
import { createLead, listLeads, updateEstado } from '../controllers/leads.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', createLead);
router.get('/', requireAuth, listLeads);
router.patch('/:id/estado', requireAuth, updateEstado);

export default router;
