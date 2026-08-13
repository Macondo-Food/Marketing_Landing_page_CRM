import { Router } from 'express';
import {
  createUsuario,
  deleteUsuario,
  listUsuarios,
  updateUsuario,
} from '../controllers/usuarios.controller.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', requireAdmin, listUsuarios);
router.post('/', requireAdmin, createUsuario);
router.patch('/:id', requireAdmin, updateUsuario);
router.delete('/:id', requireAdmin, deleteUsuario);

export default router;
