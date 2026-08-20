import { Router } from 'express';
import {
  createLead,
  getLeadDetalle,
  listLeads,
  updateEstado,
  updateLead,
} from '../controllers/leads.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { leadsLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/', leadsLimiter, createLead);
router.get('/', requireAuth, listLeads);
router.get('/:id', requireAuth, getLeadDetalle);
router.patch('/:id', requireAuth, updateLead);
router.patch('/:id/estado', requireAuth, updateEstado);

export default router;
