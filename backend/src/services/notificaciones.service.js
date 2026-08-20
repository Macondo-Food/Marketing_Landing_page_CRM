import nodemailer from 'nodemailer';

// Fase 14: notificaciones de agendamiento. Se disparan SOLO cuando
// POST /calendar/agendar confirma un evento creado (calendar.controller.js),
// nunca al crear el lead ni para descalificados. Igual que
// webhook.service.js, ambas funciones son fire-and-forget: nunca lanzan,
// si falta configuración o falla el envío solo hacen console.log/console.error
// y no afectan la respuesta al usuario.

const PRIORIDAD_LABELS = {
  vip: 'VIP',
  alta: 'Alta',
  media_baja: 'Media-baja',
  en_revision: 'En revisión',
};

function formatFechaReunion(start) {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(start));
}

function buildResumen(lead, slot) {
  return {
    fecha: formatFechaReunion(slot.start),
    prioridad: PRIORIDAD_LABELS[lead.prioridad] ?? lead.prioridad ?? '—',
  };
}

export async function enviarCorreoAgendamiento(lead, slot) {
  const { NOTIF_EMAIL_USER, NOTIF_EMAIL_APP_PASSWORD, NOTIF_EMAIL_DESTINO } = process.env;

  if (!NOTIF_EMAIL_USER || !NOTIF_EMAIL_APP_PASSWORD || !NOTIF_EMAIL_DESTINO) {
    console.log(
      '[notificaciones] NOTIF_EMAIL_USER/NOTIF_EMAIL_APP_PASSWORD/NOTIF_EMAIL_DESTINO no configuradas, no se envía correo.'
    );
    return;
  }

  const { fecha, prioridad } = buildResumen(lead, slot);
  const texto = [
    'Nuevo lead agendó una reunión.',
    '',
    `Nombre: ${lead.nombre}`,
    `Empresa: ${lead.empresa ?? '—'}`,
    `Email: ${lead.email}`,
    `Teléfono: ${lead.telefono ?? '—'}`,
    `Prioridad: ${prioridad}`,
    `Fecha y hora: ${fecha}`,
    `Google Meet: ${lead.meetLink ?? 'no disponible'}`,
  ].join('\n');

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: NOTIF_EMAIL_USER, pass: NOTIF_EMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: NOTIF_EMAIL_USER,
      to: NOTIF_EMAIL_DESTINO,
      subject: `Nueva reunión agendada — ${lead.nombre}`,
      text: texto,
    });
  } catch (err) {
    console.error('[notificaciones] error al enviar el correo de agendamiento:', err);
  }
}

export async function enviarGoogleChatAgendamiento(lead, slot) {
  const url = process.env.GOOGLE_CHAT_WEBHOOK_URL;
  const { fecha, prioridad } = buildResumen(lead, slot);

  const texto = [
    '📅 Nueva reunión agendada',
    `${lead.nombre} (${lead.empresa ?? '—'}) — Prioridad ${prioridad}`,
    fecha,
    `${lead.email} · ${lead.telefono ?? '—'}`,
    `Meet: ${lead.meetLink ?? 'no disponible'}`,
  ].join('\n');

  if (!url) {
    console.log('[notificaciones] GOOGLE_CHAT_WEBHOOK_URL no configurada, mensaje que se habría enviado:', texto);
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto }),
    });
    if (!response.ok) {
      console.error(`[notificaciones] Google Chat respondió ${response.status}`);
    }
  } catch (err) {
    console.error('[notificaciones] error al enviar a Google Chat:', err);
  }
}
