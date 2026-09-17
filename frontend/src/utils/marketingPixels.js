// Píxeles de marketing — cargados dinámicamente desde la DB (#22, #23).
//
// Los IDs ya no están hardcodeados: se leen de la tabla pixel_configs
// vía GET /pixels/landing?landing={id}. Esto permite configurar los
// píxeles de cada landing desde el CRM sin tocar código.
//
// A propósito NO viven en index.html: esa ubicación los cargaría en TODA
// la SPA, incluido /crm (login y datos de contacto de clientes). Por eso
// se inyectan por código y solo se llama desde las landings públicas.
//
// Fallback: si la API falla o no hay configs en DB, usa los IDs
// hardcodeados como respaldo para que las landings nunca queden sin tracking.

import { getPixelsLanding } from '../services/api.js';

const FALLBACK_META_PIXEL_ID = '3042201516085954';
const FALLBACK_LINKEDIN_PARTNER_ID = '9632482';

const META_SRC = 'https://connect.facebook.net/en_US/fbevents.js';
const LINKEDIN_SRC = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';

function loadMetaPixel(pixelId) {
  if (window.fbq) return;

  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', META_SRC);
  /* eslint-enable */

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

function loadLinkedInInsight(partnerId) {
  if (document.querySelector(`script[src="${LINKEDIN_SRC}"]`)) return;

  window._linkedin_partner_id = partnerId;
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(partnerId);

  if (!window.lintrk) {
    window.lintrk = function (a, b) {
      window.lintrk.q.push([a, b]);
    };
    window.lintrk.q = [];
  }

  const first = document.getElementsByTagName('script')[0];
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = LINKEDIN_SRC;
  first.parentNode.insertBefore(script, first);
}

export async function loadMarketingPixels(landingId) {
  try {
    let configs = [];
    try {
      configs = await getPixelsLanding(landingId);
    } catch {
      // Si la API falla, usar fallback hardcodeado
    }

    const metaConfig = configs.find((c) => c.tipo === 'meta_pixel');
    const linkedinConfig = configs.find((c) => c.tipo === 'linkedin_insight');

    const metaId = metaConfig?.pixel_id || FALLBACK_META_PIXEL_ID;
    const linkedinId = linkedinConfig?.pixel_id || FALLBACK_LINKEDIN_PARTNER_ID;

    loadMetaPixel(metaId);
    loadLinkedInInsight(linkedinId);
  } catch {
    // Si un bloqueador de anuncios o la red tumban la carga, no debe
    // afectar el render de la landing.
  }
}
