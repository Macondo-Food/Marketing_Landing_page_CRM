import crypto from 'crypto';

/**
 * Meta Conversions API — envía eventos de conversión server-side (#24).
 *
 * Se dispara de forma asíncrona (fire-and-forget) al crear un lead.
 * Configuración vía .env:
 *   META_PIXEL_ID     — ID del pixel de Meta
 *   META_ACCESS_TOKEN — token de acceso de la API de Conversiones
 *
 * Si alguna variable está vacía, el servicio hace log y no envía nada.
 */

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';

function isConfigured() {
  return !!process.env.META_PIXEL_ID && !!process.env.META_ACCESS_TOKEN;
}

function hashIfPresent(value) {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

/**
 * Envía un evento Lead a Meta Conversions API.
 * No bloquea el flujo principal — los errores se loguean pero no se propagan.
 */
export async function sendMetaLeadEvent({ nombre, email, telefono, empresa, landing, utms = {} }) {
  if (!isConfigured()) {
    return;
  }

  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  const eventData = {
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: landing ? `${process.env.APP_URL || ''}/${landing}` : undefined,
    user_data: {
      em: hashIfPresent(email),
      ph: hashIfPresent(telefono?.replace(/\D/g, '')),
      fn: hashIfPresent(nombre?.split(' ')[0]),
      ln: hashIfPresent(nombre?.split(' ').slice(1).join(' ')),
      external_id: hashIfPresent(`${email}-${landing}`),
      client_user_agent: 'server-side',
    },
    custom_data: {
      content_name: landing,
      content_category: empresa || undefined,
      lead_source: utms.utm_source || undefined,
      lead_medium: utms.utm_medium || undefined,
      lead_campaign: utms.utm_campaign || undefined,
    },
    action_source: 'website',
  };

  try {
    const response = await fetch(`${META_GRAPH_URL}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [eventData],
        access_token: accessToken,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(`[meta-capi] error ${response.status}: ${errorBody}`);
    }
  } catch (err) {
    console.warn('[meta-capi] error al enviar evento:', err.message);
  }
}
