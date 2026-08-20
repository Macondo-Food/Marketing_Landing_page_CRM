import { Router } from 'express';
import { listContactos, updateContactado } from '../controllers/contactos.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listContactos);
router.patch('/:id/contactado', requireAuth, updateContactado);

export default router;
