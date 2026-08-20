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

export async function updateContactado(req, res) {
  const id = Number(req.params.id);
  const { contactado } = req.body ?? {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'id inválido' });
  }
  if (typeof contactado !== 'boolean') {
    return res.status(400).json({ error: 'contactado debe ser booleano' });
  }

  try {
    const [result] = await pool.execute('UPDATE contactos SET contactado = ? WHERE id = ?', [contactado, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    res.json({ id, contactado });
  } catch (err) {
    console.error('[contactos] error al actualizar contactado:', err);
    res.status(500).json({ error: 'Error al actualizar el contacto' });
  }
}
