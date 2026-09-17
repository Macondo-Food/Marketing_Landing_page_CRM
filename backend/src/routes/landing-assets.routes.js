import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { uploadAsset, listAssets, deleteAsset } from '../controllers/landing-assets.controller.js';

const router = Router();

// Todas las rutas de assets requieren autenticación
router.post('/:id/assets', requireAuth, upload.single('file'), uploadAsset);
router.get('/:id/assets', requireAuth, listAssets);
router.delete('/:id/assets/:assetId', requireAuth, deleteAsset);

export default router;
