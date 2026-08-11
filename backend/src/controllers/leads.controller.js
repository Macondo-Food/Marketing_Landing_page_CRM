import pool from '../db/connection.js';
import { evaluateQualification } from '../services/qualification.service.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createLead(req, res) {
  const { nombre, email, telefono, utms = {}, respuestas } = req.body ?? {};

  if (typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'nombre es requerido' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'email es inválido' });
  }
  if (typeof telefono !== 'string' || !telefono.trim()) {
    return res.status(400).json({ error: 'telefono es requerido' });
  }

  let calificado;
  let respuestasEvaluadas;
  try {
    ({ calificado, respuestas: respuestasEvaluadas } = evaluateQualification(respuestas));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [leadResult] = await connection.execute(
      `INSERT INTO leads
        (nombre, email, telefono, utm_source, utm_medium, utm_campaign, utm_content, calificado, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        email.trim(),
        telefono.trim(),
        utms.utm_source ?? null,
        utms.utm_medium ?? null,
        utms.utm_campaign ?? null,
        utms.utm_content ?? null,
        calificado,
        // 'agendado' solo se asigna al crear el evento de Calendar (Fase 4).
        calificado ? 'calificado' : 'descalificado',
      ]
    );

    const leadId = leadResult.insertId;

    for (const r of respuestasEvaluadas) {
      await connection.execute(
        `INSERT INTO respuestas_quiz (lead_id, pregunta, respuesta, descalifica) VALUES (?, ?, ?, ?)`,
        [leadId, r.pregunta, r.respuesta, r.descalifica]
      );
    }

    await connection.commit();
    res.status(201).json({ calificado, leadId });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[leads] error al crear lead:', err);
    res.status(500).json({ error: 'Error al guardar el lead' });
  } finally {
    if (connection) connection.release();
  }
}

export async function listLeads(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, nombre, email, telefono, utm_source, utm_medium, utm_campaign, utm_content,
              calificado, estado, calendar_event_id, created_at
       FROM leads
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[leads] error al listar leads:', err);
    res.status(500).json({ error: 'Error al obtener los leads' });
  }
}
