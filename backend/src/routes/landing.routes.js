import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  listLandings,
  createLanding,
  getLanding,
  updateLanding,
  publishLanding,
  updateStatus,
  deleteLanding,
  checkSlugAvailable,
} from '../controllers/landing.controller.js';

const router = Router();

// Verificación de slug — debe ir ANTES de /:id para que Express no
// interprete "slug" como un id.
router.get('/slug/:slug/available', requireAuth, checkSlugAvailable);

// CRUD — cualquier rol autenticado puede listar/crear/editar borradores
router.get('/', requireAuth, listLandings);
router.post('/', requireAuth, createLanding);
router.get('/:id', requireAuth, getLanding);
router.patch('/:id', requireAuth, updateLanding);

// Publicar/cambiar estado/eliminar — solo admins
router.post('/:id/publish', requireAdmin, publishLanding);
router.patch('/:id/status', requireAdmin, updateStatus);
router.delete('/:id', requireAdmin, deleteLanding);

export default router;
