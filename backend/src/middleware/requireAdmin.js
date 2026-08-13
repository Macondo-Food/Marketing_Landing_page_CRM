import { requireAuth } from './auth.js';

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso restringido a administradores' });
    }
    next();
  });
}
