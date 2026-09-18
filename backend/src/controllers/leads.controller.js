import pool from '../db/connection.js';
import { evaluateQualification } from '../services/qualification.service.js';
import { enviarWebhookLead } from '../services/webhook.service.js';
import { sendMetaLeadEvent } from '../services/meta-capi.service.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Identificador del formulario para el CRM externo (documento "Especificaciones
// Técnicas" del PM). Único formulario en el proyecto, así que es una constante.
const WEBHOOK_FORM_ID = 'quiz_vsl_macondo';

export async function createLead(req, res) {
  const {
    nombre,
    email,
    telefono,
    empresa,
    tratamiento_datos_aceptado: tratamientoDatosAceptado,
    utms = {},
    respuestas,
    landing,
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
  if (typeof landing !== 'string' || !landing.trim()) {
    return res.status(400).json({ error: 'landing es requerida' });
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

  const landingTrimmed = landing.trim();

  // Buscar asignación automática de la landing (#20)
  let asignadoA = null;
  try {
    const [landingRows] = await pool.query(
      'SELECT asignado_a FROM landings WHERE slug = ?', [landingTrimmed]
    );
    if (landingRows.length > 0) {
      asignadoA = landingRows[0].asignado_a;
    }
  } catch {
    // Si la tabla landings no existe aún, ignorar — la asignación queda null
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
    utms.utm_term ?? null,
    landingTrimmed,
  ];
  const tratamientoDatosFecha = new Date();
  const contactoWebhook = {
    nombre: nombre.trim(),
    email: email.trim(),
    telefono: telefono.trim(),
    empresa: empresa.trim(),
  };

  if (!calificado) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO contactos
          (nombre, email, telefono, empresa, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing,
           motivo_descalificacion, tratamiento_datos_aceptado, tratamiento_datos_fecha, asignado_a)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...datosContacto, motivoDescalificacion, true, tratamientoDatosFecha, asignadoA]
      );
      enviarWebhookLead({
        formId: WEBHOOK_FORM_ID,
        contact: contactoWebhook,
        respuestas: respuestasEvaluadas,
        calificado: false,
        prioridad: null,
        utms,
      });
      // Meta CAPI — fire-and-forget (#24)
      sendMetaLeadEvent({ nombre, email, telefono, empresa, landing, utms });

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
        (nombre, email, telefono, empresa, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing,
         calificado, prioridad, tratamiento_datos_aceptado, tratamiento_datos_fecha, estado, asignado_a)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ...datosContacto,
        true,
        prioridad,
        true,
        tratamientoDatosFecha,
        'calificado',
        asignadoA,
      ]
    );

    const leadId = leadResult.insertId;

    for (const r of respuestasEvaluadas) {
      await connection.execute(
        `INSERT INTO respuestas_quiz (lead_id, pregunta, respuesta, descalifica, detalle) VALUES (?, ?, ?, ?, ?)`,
        [leadId, r.pregunta, r.respuesta, r.descalifica, r.detalle ?? null]
      );
    }

    await connection.commit();
    enviarWebhookLead({
      formId: WEBHOOK_FORM_ID,
      contact: contactoWebhook,
      respuestas: respuestasEvaluadas,
      calificado,
      prioridad,
      utms,
    });
    // Meta CAPI — fire-and-forget (#24)
    sendMetaLeadEvent({ nombre, email, telefono, empresa, landing, utms });
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

// Solo estos 4 campos son editables desde el CRM vía PATCH /leads/:id —
// estado, prioridad, calificado, etc. los pone el sistema (quiz, agendamiento,
// PATCH /leads/:id/estado) y no se tocan desde aquí.
const CAMPOS_CONTACTO_EDITABLES = ['nombre', 'email', 'telefono', 'empresa'];

export async function updateLead(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'id inválido' });
  }

  const body = req.body ?? {};
  const fields = [];
  const values = [];

  for (const campo of CAMPOS_CONTACTO_EDITABLES) {
    if (!(campo in body)) continue;
    const valor = body[campo];
    if (typeof valor !== 'string' || !valor.trim()) {
      return res.status(400).json({ error: `${campo} no puede estar vacío` });
    }
    if (campo === 'email' && !EMAIL_RE.test(valor.trim())) {
      return res.status(400).json({ error: 'email es inválido' });
    }
    fields.push(`${campo} = ?`);
    values.push(valor.trim());
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'no hay campos para actualizar' });
  }

  try {
    const [result] = await pool.execute(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, [
      ...values,
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    const [[updated]] = await pool.query(
      'SELECT id, nombre, email, telefono, empresa FROM leads WHERE id = ?',
      [id]
    );
    res.json(updated);
  } catch (err) {
    console.error('[leads] error al actualizar datos de contacto:', err);
    res.status(500).json({ error: 'Error al actualizar el lead' });
  }
}

export async function getLeadDetalle(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'id inválido' });
  }

  try {
    const [leadRows] = await pool.execute(
      `SELECT id, nombre, email, telefono, empresa, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing,
              calificado, prioridad, estado, calendar_event_id, reunion_fecha_hora, created_at
       FROM leads
       WHERE id = ?`,
      [id]
    );
    if (leadRows.length === 0) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    const [respuestas] = await pool.execute(
      `SELECT pregunta, respuesta, detalle FROM respuestas_quiz WHERE lead_id = ? ORDER BY id`,
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
    const { landing } = req.query;
    let sql = `SELECT id, nombre, email, telefono, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing,
                      calificado, prioridad, estado, calendar_event_id, created_at
               FROM leads`;
    const params = [];
    if (landing) {
      sql += ' WHERE landing = ?';
      params.push(landing);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[leads] error al listar leads:', err);
    res.status(500).json({ error: 'Error al obtener los leads' });
  }
}
