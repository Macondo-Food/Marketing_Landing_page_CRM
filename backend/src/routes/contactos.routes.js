import { Router } from 'express';
import { listContactos } from '../controllers/contactos.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listContactos);

export default router;
