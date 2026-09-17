import { Router } from 'express';
import { getPixelsPublicos, listPixels, upsertPixel, togglePixel, deletePixel } from '../controllers/pixel.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Público — las landings lo consumen al cargar (sin auth)
router.get('/landing', getPixelsPublicos);

// CRM — requiere autenticación
router.get('/admin', requireAuth, listPixels);
router.post('/', requireAuth, upsertPixel);
router.patch('/:id/toggle', requireAuth, togglePixel);
router.delete('/:id', requireAuth, deletePixel);

export default router;
