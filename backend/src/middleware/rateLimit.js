import rateLimit from 'express-rate-limit';

// Máximo 5 intentos de login cada 15 min por IP — evita fuerza bruta
// contra la contraseña del CRM.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde.' },
});

// Máximo 20 leads cada 15 min por IP — margen generoso para tráfico real
// de anuncios, evita spam de leads falsos.
export const leadsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
});
