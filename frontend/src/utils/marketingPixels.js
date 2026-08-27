// Píxeles de marketing (Meta Pixel + LinkedIn Insight Tag).
//
// A propósito NO viven en index.html: esa ubicación los cargaría en TODA la
// SPA, incluido /crm (login y datos de contacto de clientes). Las condiciones
// de LinkedIn piden no aplicar la etiqueta globalmente si el sitio tiene
// páginas con datos sensibles. Por eso se inyectan por código y solo se
// llama a `loadMarketingPixels()` desde la landing pública (LandingVSL.jsx).
//
// Cada script se agrega dinámicamente con document.createElement (igual que
// VturbPlayer.jsx) y con guarda contra doble inyección, por si el efecto de
// React se re-monta (Fast Refresh / StrictMode en desarrollo).

const META_PIXEL_ID = '3042201516085954';
const LINKEDIN_PARTNER_ID = '9632482';

const META_SRC = 'https://connect.facebook.net/en_US/fbevents.js';
const LINKEDIN_SRC = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';

function loadMetaPixel() {
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

  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

function loadLinkedInInsight() {
  if (document.querySelector(`script[src="${LINKEDIN_SRC}"]`)) return;

  window._linkedin_partner_id = LINKEDIN_PARTNER_ID;
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(LINKEDIN_PARTNER_ID);

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

export function loadMarketingPixels() {
  try {
    loadMetaPixel();
    loadLinkedInInsight();
  } catch {
    // Si un bloqueador de anuncios o la red tumban la carga, no debe
    // afectar el render de la landing.
  }
}
