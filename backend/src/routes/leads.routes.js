import { Router } from 'express';
import { createLead, listLeads } from '../controllers/leads.controller.js';

const router = Router();

router.post('/', createLead);
router.get('/', listLeads);

export default router;
