// Webhook hacia el CRM externo (Fase 16, documento "Especificaciones
// Técnicas" del PM). Arma el JSON con la estructura exacta que pidió el PM
// y lo envía por POST a WEBHOOK_CRM_URL si está configurada; si no, solo
// hace console.log del payload que se habría enviado.
//
// Los códigos en inglés de `qualification_data` NO se mapean aquí a partir
// de texto en español: vienen ya calculados como `codigo` en cada
// respuesta evaluada por qualification.service.js (misma fuente de verdad
// que decide `descalifica`/`prioridad`), así este archivo no se puede
// desincronizar si cambia una redacción o una regla de calificación.

const PRIORITY_TIER_POR_PRIORIDAD = {
  vip: 'TIER_1',
  alta: 'TIER_2',
  media_baja: 'TIER_3',
  en_revision: 'TIER_REVIEW',
};

function buildPayload({ formId, contact, respuestas, calificado, prioridad, utms = {} }) {
  const porPregunta = Object.fromEntries(respuestas.map((r) => [r.pregunta, r]));

  return {
    event: 'form_submission',
    form_id: formId,
    timestamp: new Date().toISOString(),
    contact: {
      first_name: contact.nombre,
      email: contact.email,
      phone: contact.telefono,
      company_name: contact.empresa,
    },
    qualification_data: {
      cloud_budget_monthly: porPregunta.inversion_nube?.codigo ?? null,
      current_cloud_provider: porPregunta.proveedor_nube?.codigo ?? null,
      current_cloud_provider_other: porPregunta.proveedor_nube?.detalle ?? null,
      job_title_category: porPregunta.cargo?.codigo ?? null,
      industry_sector: porPregunta.industria?.codigo ?? null,
    },
    qualification_status: calificado ? 'QUALIFIED' : 'DISQUALIFIED',
    priority_tier: prioridad ? (PRIORITY_TIER_POR_PRIORIDAD[prioridad] ?? null) : null,
    attribution: {
      utm_source: utms.utm_source ?? null,
      utm_medium: utms.utm_medium ?? null,
      utm_campaign: utms.utm_campaign ?? null,
      utm_content: utms.utm_content ?? null,
      utm_term: utms.utm_term ?? null,
    },
  };
}

// Fire-and-forget: nunca lanza, para no bloquear ni tumbar el flujo de
// creación del lead en leads.controller.js si el CRM externo falla o no
// está configurado.
export async function enviarWebhookLead(params) {
  const payload = buildPayload(params);
  const url = process.env.WEBHOOK_CRM_URL;

  if (!url) {
    console.log('[webhook] WEBHOOK_CRM_URL no configurada, payload que se habría enviado:', JSON.stringify(payload));
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error(`[webhook] el CRM externo respondió ${response.status}`);
    }
  } catch (err) {
    console.error('[webhook] error al enviar el webhook (no afecta la respuesta al usuario):', err);
  }
}
