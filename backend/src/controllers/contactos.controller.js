import pool from '../db/connection.js';

export async function listContactos(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, nombre, email, telefono, empresa, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
              motivo_descalificacion, contactado, created_at
       FROM contactos
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[contactos] error al listar contactos:', err);
    res.status(500).json({ error: 'Error al obtener los contactos' });
  }
}
