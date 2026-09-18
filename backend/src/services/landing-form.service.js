/**
 * Servicio de formularios del builder (#16, #17, #18, #19, #21).
 *
 * Valida que el HTML publicado tenga un <form> correcto e inyecta los
 * campos ocultos necesarios (landing slug, tratamiento de datos).
 */

// Verifica que el HTML contenga al menos un <form> (#18).
export function validateFormExists(html) {
  if (!html || typeof html !== 'string') return false;
  return /<form[\s>]/i.test(html);
}

// Inyecta campos ocultos y ajusta el action del form para que apunte
// al endpoint POST /leads (#19, #21).
export function injectFormFields(html, { slug }) {
  if (!html) return html;

  let result = html;

  // Inyectar <input type="hidden" name="landing"> si no existe
  if (!/name=["']landing["']/i.test(result)) {
    result = result.replace(
      /(<form[^>]*>)/i,
      `$1\n<input type="hidden" name="landing" value="${escapeAttr(slug)}">`
    );
  }

  // Inyectar checkbox de tratamiento de datos si no existe
  if (!/name=["']tratamiento_datos_aceptado["']/i.test(result)) {
    const checkboxHtml = `
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#666;margin-top:8px;">
        <input type="checkbox" name="tratamiento_datos_aceptado" value="true" required style="margin:0;">
        Acepto el tratamiento de datos personales
      </label>`;
    // Insertar antes del botón submit
    result = result.replace(
      /(<button[^>]*type=["']submit["'][^>]*>)/i,
      `${checkboxHtml}\n$1`
    );
  }

  // Asegurar que el action apunte a /leads (por si el editor lo dejó vacío)
  result = result.replace(
    /(<form[^>]*?)(action=["'][^"']*["'])([^>]*>)/i,
    `$1action="/leads"$3`
  );
  // Si no tiene action, agregarlo
  if (!/action=["']/i.test(result.match(/<form[^>]*>/i)?.[0] || '')) {
    result = result.replace(
      /(<form)([\s>])/i,
      `$1 action="/leads"$2`
    );
  }

  // Agregar method POST si no existe
  if (!/method=["']/i.test(result.match(/<form[^>]*>/i)?.[0] || '')) {
    result = result.replace(
      /(<form[^>]*?)(>)/i,
      `$1 method="POST"$2`
    );
  }

  return result;
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
