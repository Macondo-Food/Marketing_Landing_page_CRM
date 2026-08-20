import pool from '../db/connection.js';
import { getAvailableSlots, isSlotFree, createCalendarEvent } from '../services/googleCalendar.service.js';
import { enviarCorreoAgendamiento, enviarGoogleChatAgendamiento } from '../services/notificaciones.service.js';

export async function getDisponibilidad(req, res) {
  try {
    const slots = await getAvailableSlots();
    res.json({ slots });
  } catch (err) {
    console.error('[calendar] error al calcular disponibilidad:', err);
    res.status(500).json({ error: 'Error al calcular la disponibilidad' });
  }
}

export async function postAgendar(req, res) {
  const { leadId, slot } = req.body ?? {};

  if (!Number.isInteger(leadId)) {
    return res.status(400).json({ error: 'leadId es requerido' });
  }
  if (!slot || typeof slot.start !== 'string' || typeof slot.end !== 'string') {
    return res.status(400).json({ error: 'slot debe incluir start y end' });
  }

  const start = new Date(slot.start);
  const end = new Date(slot.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return res.status(400).json({ error: 'slot inválido' });
  }

  let lead;
  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, email, telefono, empresa, prioridad, estado, calendar_event_id FROM leads WHERE id = ?',
      [leadId]
    );
    lead = rows[0];
  } catch (err) {
    console.error('[calendar] error al buscar el lead:', err);
    return res.status(500).json({ error: 'Error al buscar el lead' });
  }

  if (!lead) {
    return res.status(404).json({ error: 'Lead no encontrado' });
  }

  if (lead.estado === 'descalificado') {
    return res.status(400).json({ error: 'Este lead está descalificado y no puede agendar una reunión' });
  }
  if (lead.calendar_event_id) {
    return res.status(400).json({ error: 'Este lead ya tiene una reunión agendada' });
  }

  try {
    const free = await isSlotFree(start, end);
    if (!free) {
      return res.status(409).json({ error: 'Ese horario ya no está disponible' });
    }

    const event = await createCalendarEvent({
      start,
      end,
      leadEmail: lead.email,
      leadName: lead.nombre,
    });

    await pool.execute(
      `UPDATE leads SET calendar_event_id = ?, reunion_fecha_hora = ?, estado = 'agendado' WHERE id = ?`,
      [event.id, start, leadId]
    );

    const meetLink = event.hangoutLink ?? null;

    try {
      const notifLead = { ...lead, meetLink };
      enviarCorreoAgendamiento(notifLead, { start, end });
      enviarGoogleChatAgendamiento(notifLead, { start, end });
    } catch (notifErr) {
      console.error('[calendar] error al disparar notificaciones (no afecta la respuesta al usuario):', notifErr);
    }

    res.status(201).json({ eventId: event.id, meetLink });
  } catch (err) {
    console.error('[calendar] error al agendar:', err);
    res.status(500).json({ error: 'Error al agendar la reunión' });
  }
}
