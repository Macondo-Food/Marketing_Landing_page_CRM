const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3099';

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error('No pudimos conectar con el servidor. Verifica tu conexión e intenta de nuevo.');
  }

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const error = new Error(data.error || 'Ocurrió un error inesperado. Intenta de nuevo.');
    error.status = response.status;
    throw error;
  }
  return data;
}

// { nombre, email, telefono, utms, calificado, respuestas } -> { calificado, leadId }
export function createLead(payload) {
  return request('/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// -> [{ start, end }, ...] (ISO strings)
export function getDisponibilidad() {
  return request('/calendar/disponibilidad').then((data) => data.slots ?? []);
}

// (leadId, { start, end }) -> { eventId, meetLink }
export function agendarReunion(leadId, slot) {
  return request('/calendar/agendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadId, slot }),
  });
}

// (usuario, password) -> { token, usuario: { id, nombre, rol } }
export function loginRequest(usuario, password) {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password }),
  });
}

// (idToken) -> { token, usuario: { id, nombre, rol } }
export function loginGoogleRequest(idToken) {
  return request('/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
}

// (token, landing?) -> [{ id, nombre, email, telefono, utm_source, ..., landing, estado, created_at }, ...]
export function getLeads(token, landing) {
  const qs = landing ? `?landing=${encodeURIComponent(landing)}` : '';
  return request(`/leads${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// (token, id) -> { id, nombre, email, telefono, empresa, utm_source, utm_medium, utm_campaign,
//                   utm_content, calificado, prioridad, estado, calendar_event_id, created_at,
//                   respuestas: [{ pregunta, respuesta }, ...] }
export function getLeadDetalle(token, id) {
  return request(`/leads/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// (token, id, { nombre?, email?, telefono?, empresa? }) -> { id, nombre, email, telefono, empresa }
export function updateLead(token, id, payload) {
  return request(`/leads/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// (token, id, estado) -> { id, estado }
export function updateLeadEstado(token, id, estado) {
  return request(`/leads/${id}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ estado }),
  });
}

// (token, landing?) -> { resumen: {...}, respuestas: { [pregunta]: [{ respuesta, total, porcentaje }, ...] } }
export function getDashboard(token, landing) {
  const qs = landing ? `?landing=${encodeURIComponent(landing)}` : '';
  return request(`/dashboard${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// (token, landing?) -> { campanas: [{ utm_source, utm_campaign, total, calificados, agendados, porcentajeConversion }, ...] }
export function getCampanas(token, landing) {
  const qs = landing ? `?landing=${encodeURIComponent(landing)}` : '';
  return request(`/dashboard/campanas${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// (token) -> [{ id, nombre, email, rol, created_at }, ...]
export function getUsuarios(token) {
  return request('/usuarios', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// (token, { nombre, email, password, rol }) -> { id, nombre, email, rol }
export function createUsuario(token, payload) {
  return request('/usuarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// (token, id, { nombre?, rol?, password? }) -> { id, nombre, email, rol, created_at }
export function updateUsuario(token, id, payload) {
  return request(`/usuarios/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// (token, id) -> { id }
export function deleteUsuario(token, id) {
  return request(`/usuarios/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// (token) -> [{ id, url_completa, utm_source, utm_medium, utm_campaign, utm_content, created_at, creado_por_nombre }, ...]
export function getUtmUrls(token) {
  return request('/utm-urls', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// (token, { utm_source, utm_campaign, utm_content, utm_term }) -> { id, url_completa, utm_source, utm_medium, utm_campaign, utm_content, utm_term, creado_por_nombre }
export function createUtmUrl(token, payload) {
  return request('/utm-urls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// (token, landing?) -> [{ id, nombre, email, telefono, empresa, utm_source, ..., landing, motivo_descalificacion, contactado, created_at }, ...]
export function getContactos(token, landing) {
  const qs = landing ? `?landing=${encodeURIComponent(landing)}` : '';
  return request(`/contactos${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// (token, id, contactado) -> { id, contactado }
export function updateContactoContactado(token, id, contactado) {
  return request(`/contactos/${id}/contactado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contactado }),
  });
}
