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

// (token) -> [{ id, nombre, email, telefono, utm_source, ..., estado, created_at }, ...]
export function getLeads(token) {
  return request('/leads', {
    headers: { Authorization: `Bearer ${token}` },
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

// (token) -> { resumen: {...}, respuestas: { [pregunta]: [{ respuesta, total, porcentaje }, ...] } }
export function getDashboard(token) {
  return request('/dashboard', {
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
