import pool from '../db/connection.js';

const TIPOS_VALIDOS = ['meta_pixel', 'linkedin_insight', 'google_analytics', 'custom_script'];

// GET /pixels?landing=vsl-macondo — público, lo usan las landings al cargar
export async function getPixelsPublicos(req, res) {
  try {
    const { landing } = req.query;
    if (!landing) {
      return res.status(400).json({ error: 'landing es requerido' });
    }

    const [rows] = await pool.query(
      `SELECT tipo, pixel_id FROM pixel_configs WHERE landing = ? AND activo = 1 ORDER BY tipo`,
      [landing]
    );
    res.json(rows);
  } catch (err) {
    console.error('[pixels] error al obtener pixels públicos:', err);
    res.status(500).json({ error: 'Error al obtener pixels' });
  }
}

// GET /pixels/admin — requiere auth, lista todos los pixels configurados
export async function listPixels(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, landing, tipo, pixel_id, activo, created_at FROM pixel_configs ORDER BY landing, tipo`
    );
    res.json(rows);
  } catch (err) {
    console.error('[pixels] error al listar pixels:', err);
    res.status(500).json({ error: 'Error al obtener pixels' });
  }
}

// POST /pixels — crea o actualiza un pixel (upsert por landing+tipo)
export async function upsertPixel(req, res) {
  const { landing, tipo, pixel_id: pixelId } = req.body ?? {};

  if (!landing || typeof landing !== 'string') {
    return res.status(400).json({ error: 'landing es requerido' });
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ error: `tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` });
  }
  if (!pixelId || typeof pixelId !== 'string' || !pixelId.trim()) {
    return res.status(400).json({ error: 'pixel_id es requerido' });
  }

  try {
    await pool.query(
      `INSERT INTO pixel_configs (landing, tipo, pixel_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE pixel_id = VALUES(pixel_id), activo = 1`,
      [landing, tipo, pixelId.trim()]
    );

    const [rows] = await pool.query(
      `SELECT id, landing, tipo, pixel_id, activo, created_at FROM pixel_configs WHERE landing = ? AND tipo = ?`,
      [landing, tipo]
    );
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('[pixels] error al guardar pixel:', err);
    res.status(500).json({ error: 'Error al guardar pixel' });
  }
}

// PATCH /pixels/:id/toggle — activa/desactiva un pixel
export async function togglePixel(req, res) {
  const { id } = req.params;
  const { activo } = req.body ?? {};

  if (typeof activo !== 'boolean') {
    return res.status(400).json({ error: 'activo debe ser booleano' });
  }

  try {
    await pool.query('UPDATE pixel_configs SET activo = ? WHERE id = ?', [activo, id]);
    res.json({ id: Number(id), activo });
  } catch (err) {
    console.error('[pixels] error al actualizar pixel:', err);
    res.status(500).json({ error: 'Error al actualizar pixel' });
  }
}

// DELETE /pixels/:id
export async function deletePixel(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM pixel_configs WHERE id = ?', [id]);
    res.json({ id: Number(id) });
  } catch (err) {
    console.error('[pixels] error al eliminar pixel:', err);
    res.status(500).json({ error: 'Error al eliminar pixel' });
  }
}
