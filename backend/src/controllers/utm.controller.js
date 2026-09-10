import pool from '../db/connection.js';

const DOMAIN = 'https://www.macondosoftwares.com';

// Mapa de landings válidas. Cada landing tiene una ruta pública en el
// frontend. Agregar una entrada aquí cada vez que se crea una landing nueva
// (debe coincidir con frontend/src/utils/landings.js).
const LANDINGS = {
  'vsl-macondo': { nombre: 'VSL Macondo (Cloud)', ruta: '/vsl' },
  'lp1': { nombre: 'Cloud Savings (LatAm)', ruta: '/lp1' },
};

const LANDING_IDS = Object.keys(LANDINGS);

// utm_medium se deriva de la plataforma (utm_source), no lo manda el
// cliente. Las 4 plataformas de pauta usan 'cpc' (convención estándar de
// Google Analytics para tráfico pagado, sea cual sea la red). 'organico'
// usa 'social': asumimos que representa contenido compartido sin pago en
// redes sociales (bio, post, story), que es el mismo canal que las otras
// 4 opciones pero sin pauta — no usamos 'organic' porque ese valor está
// reservado por convención para tráfico de buscadores que GA ya taggea
// solo (Google/Bing), y taguearlo a mano ahí puede pisar esa detección
// automática en vez de sumar información nueva.
const MEDIUM_BY_SOURCE = {
  meta: 'cpc',
  linkedin: 'cpc',
  google_ads: 'cpc',
  tiktok_ads: 'cpc',
  organico: 'social',
};

const SOURCES = Object.keys(MEDIUM_BY_SOURCE);

export async function listUtmUrls(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.url_completa, u.utm_source, u.utm_medium, u.utm_campaign,
              u.utm_content, u.utm_term, u.landing, u.created_at, us.nombre AS creado_por_nombre
       FROM utm_urls u
       JOIN usuarios us ON us.id = u.creado_por
       ORDER BY u.created_at DESC, u.id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[utm] error al listar urls:', err);
    res.status(500).json({ error: 'Error al obtener el historial de URLs' });
  }
}

export async function createUtmUrl(req, res) {
  const {
    utm_source: utmSource,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
    landing,
  } = req.body ?? {};

  if (!SOURCES.includes(utmSource)) {
    return res.status(400).json({ error: `utm_source debe ser uno de: ${SOURCES.join(', ')}` });
  }
  if (typeof utmCampaign !== 'string' || !utmCampaign.trim()) {
    return res.status(400).json({ error: 'utm_campaign es requerido' });
  }
  if (utmContent !== undefined && utmContent !== null && typeof utmContent !== 'string') {
    return res.status(400).json({ error: 'utm_content debe ser texto' });
  }
  if (utmTerm !== undefined && utmTerm !== null && typeof utmTerm !== 'string') {
    return res.status(400).json({ error: 'utm_term debe ser texto' });
  }
  if (typeof landing !== 'string' || !LANDING_IDS.includes(landing)) {
    return res.status(400).json({ error: `landing debe ser una de: ${LANDING_IDS.join(', ')}` });
  }

  const utmMedium = MEDIUM_BY_SOURCE[utmSource];
  const campaign = utmCampaign.trim();
  const content = typeof utmContent === 'string' ? utmContent.trim() : '';
  const term = typeof utmTerm === 'string' ? utmTerm.trim() : '';

  const params = new URLSearchParams({
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: campaign,
  });
  if (content) params.set('utm_content', content);
  if (term) params.set('utm_term', term);
  const urlCompleta = `${DOMAIN}${LANDINGS[landing].ruta}?${params.toString()}`;

  try {
    const [result] = await pool.execute(
      `INSERT INTO utm_urls (url_completa, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [urlCompleta, utmSource, utmMedium, campaign, content || null, term || null, landing, req.user.userId]
    );

    res.status(201).json({
      id: result.insertId,
      url_completa: urlCompleta,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: campaign,
      utm_content: content || null,
      utm_term: term || null,
      landing,
      creado_por_nombre: req.user.nombre,
    });
  } catch (err) {
    console.error('[utm] error al crear url:', err);
    res.status(500).json({ error: 'Error al generar la URL' });
  }
}
