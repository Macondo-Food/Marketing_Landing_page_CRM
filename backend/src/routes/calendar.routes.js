import { Router } from 'express';
import { getDisponibilidad, postAgendar } from '../controllers/calendar.controller.js';

const router = Router();

router.get('/disponibilidad', getDisponibilidad);
router.post('/agendar', postAgendar);

export default router;
