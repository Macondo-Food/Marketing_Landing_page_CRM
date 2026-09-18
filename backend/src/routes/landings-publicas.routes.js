import { Router } from 'express';
import pool from '../db/connection.js';
import { getCachedLanding, setCachedLanding } from '../services/landing-cache.service.js';

const router = Router();

// CSP estricta para landings publicadas — sin inline scripts, sin eval,
// sin recursos de orígenes no autorizados. Aunque el HTML fue sanitizado
// al publicar, la CSP es una capa extra de defensa.
const CSP_HEADER = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "script-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
].join('; ');

function buildFullHtml(landing) {
  const title = landing.meta_title || landing.nombre;
  const desc = landing.meta_description || '';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${desc ? `<meta name="description" content="${escapeHtml(desc)}">` : ''}
  <style>${landing.css_publicado || ''}</style>
</head>
<body>
${landing.html_publicado || ''}
</body>
</html>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// GET /:slug — busca landing publicada (caché primero, DB fallback).
// Si no existe, pasa al siguiente middleware (SPA de React).
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Intentar caché primero (#14)
    let landing = getCachedLanding(slug);

    if (!landing) {
      const [rows] = await pool.query(
        `SELECT slug, nombre, estado, html_publicado, css_publicado,
                meta_title, meta_description, redirect_url
         FROM landings WHERE slug = ?`,
        [slug]
      );
      if (rows.length === 0) return next();
      landing = rows[0];

      // Solo cachear landings publicadas (las desactivadas pueden cambiar a redirect)
      if (landing.estado === 'publicada') {
        setCachedLanding(slug, landing);
      }
    }

    // Redirección si está desactivada (#13)
    if (landing.estado === 'desactivada') {
      if (landing.redirect_url) {
        return res.redirect(301, landing.redirect_url);
      }
      return next();
    }

    if (landing.estado !== 'publicada' || !landing.html_publicado) {
      return next();
    }

    res.setHeader('Content-Security-Policy', CSP_HEADER);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    // Cache-Control para CDN/proxies (#15): público, 60s en edge, 300s stale-while-revalidate
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.type('html').send(buildFullHtml(landing));
  } catch (err) {
    console.error('[landings-publicas] error al servir landing:', err);
    next();
  }
});

export default router;
