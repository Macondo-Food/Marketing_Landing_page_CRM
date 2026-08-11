const UTM_STORAGE_KEY = 'vsl_utms';
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

export function getStoredUtms() {
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Lee los UTMs de la URL actual y los persiste en localStorage.
// Si la URL no trae UTMs (ej: navegación interna tras el primer aterrizaje),
// conserva los que ya se hayan capturado antes en esta sesión/dispositivo.
export function captureUtms() {
  const params = new URLSearchParams(window.location.search);
  const found = {};
  let hasNew = false;

  UTM_PARAMS.forEach((key) => {
    const value = params.get(key);
    if (value) {
      found[key] = value;
      hasNew = true;
    }
  });

  if (!hasNew) {
    return getStoredUtms();
  }

  // La URL trae UTMs nuevos: reemplaza el set guardado por completo (no se
  // mezclan campos de una campaña anterior con los de la visita actual).
  try {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
  } catch {
    // localStorage no disponible (modo privado, cuotas, etc.) — se ignora,
    // los UTMs igual quedan disponibles en memoria para esta carga de página.
  }
  return found;
}
