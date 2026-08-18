import pool from '../db/connection.js';
import { evaluateQualification } from '../services/qualification.service.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createLead(req, res) {
  const {
    nombre,
    email,
    telefono,
    empresa,
    tratamiento_datos_aceptado: tratamientoDatosAceptado,
    utms = {},
    respuestas,
  } = req.body ?? {};

  if (typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'nombre es requerido' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'email es inválido' });
  }
  if (typeof telefono !== 'string' || !telefono.trim()) {
    return res.status(400).json({ error: 'telefono es requerido' });
  }
  if (typeof empresa !== 'string' || !empresa.trim()) {
    return res.status(400).json({ error: 'empresa es requerida' });
  }
  if (tratamientoDatosAceptado !== true) {
    return res.status(400).json({ error: 'Debes aceptar el tratamiento de datos personales' });
  }

  let calificado;
  let prioridad;
  let motivoDescalificacion;
  let respuestasEvaluadas;
  try {
    ({
      calificado,
      prioridad,
      motivoDescalificacion,
      respuestas: respuestasEvaluadas,
    } = evaluateQualification(respuestas));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const datosContacto = [
    nombre.trim(),
    email.trim(),
    telefono.trim(),
    empresa.trim(),
    utms.utm_source ?? null,
    utms.utm_medium ?? null,
    utms.utm_campaign ?? null,
    utms.utm_content ?? null,
  ];
  const tratamientoDatosFecha = new Date();

  if (!calificado) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO contactos
          (nombre, email, telefono, empresa, utm_source, utm_medium, utm_campaign, utm_content,
           motivo_descalificacion, tratamiento_datos_aceptado, tratamiento_datos_fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...datosContacto, motivoDescalificacion, true, tratamientoDatosFecha]
      );
      return res.status(201).json({ calificado: false, contactoId: result.insertId });
    } catch (err) {
      console.error('[leads] error al crear contacto:', err);
      return res.status(500).json({ error: 'Error al guardar el contacto' });
    }
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [leadResult] = await connection.execute(
      `INSERT INTO leads
        (nombre, email, telefono, empresa, utm_source, utm_medium, utm_campaign, utm_content,
         calificado, prioridad, tratamiento_datos_aceptado, tratamiento_datos_fecha, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ...datosContacto,
        true,
        prioridad,
        true,
        tratamientoDatosFecha,
        // 'agendado' solo se asigna al crear el evento de Calendar (Fase 4).
        'calificado',
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
    res.status(201).json({ calificado, prioridad, leadId });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[leads] error al crear lead:', err);
    res.status(500).json({ error: 'Error al guardar el lead' });
  } finally {
    if (connection) connection.release();
  }
}

const ESTADOS_EDITABLES = [
  'con_requisitos',
  'sin_requisitos_reunion',
  'reunion_cierre',
  'venta_servicio',
];

export async function updateEstado(req, res) {
  const id = Number(req.params.id);
  const { estado } = req.body ?? {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'id inválido' });
  }
  if (!ESTADOS_EDITABLES.includes(estado)) {
    return res.status(400).json({
      error: `estado debe ser uno de: ${ESTADOS_EDITABLES.join(', ')}`,
    });
  }

  try {
    const [result] = await pool.execute('UPDATE leads SET estado = ? WHERE id = ?', [estado, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }
    res.json({ id, estado });
  } catch (err) {
    console.error('[leads] error al actualizar estado:', err);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
}

export async function getLeadDetalle(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'id inválido' });
  }

  try {
    const [leadRows] = await pool.execute(
      `SELECT id, nombre, email, telefono, empresa, utm_source, utm_medium, utm_campaign, utm_content,
              calificado, prioridad, estado, calendar_event_id, created_at
       FROM leads
       WHERE id = ?`,
      [id]
    );
    if (leadRows.length === 0) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    const [respuestas] = await pool.execute(
      `SELECT pregunta, respuesta FROM respuestas_quiz WHERE lead_id = ? ORDER BY id`,
      [id]
    );

    res.json({ ...leadRows[0], respuestas });
  } catch (err) {
    console.error('[leads] error al obtener detalle de lead:', err);
    res.status(500).json({ error: 'Error al obtener el lead' });
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
