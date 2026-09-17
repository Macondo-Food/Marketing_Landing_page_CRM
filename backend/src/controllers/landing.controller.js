import pool from '../db/connection.js';
import fs from 'fs';
import path from 'path';

// Rutas reservadas del sistema que no pueden usarse como slug (#11).
const RESERVED_SLUGS = [
  'crm', 'leads', 'calendar', 'auth', 'dashboard', 'usuarios',
  'utm-urls', 'contactos', 'pixels', 'health', 'uploads', 'landings',
  // Landings manuales existentes
  'vsl', 'formvsl', 'graciasvsl', 'lp1',
];

const SLUG_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  if (slug.length < 3 || slug.length > 100) return false;
  if (!SLUG_RE.test(slug)) return false;
  if (RESERVED_SLUGS.includes(slug)) return false;
  return true;
}

// GET /landings — lista todas (sin editor_json para no inflar la respuesta)
export async function listLandings(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.slug, l.nombre, l.estado, l.meta_title,
              l.published_at, l.created_at, l.updated_at,
              u.nombre AS creado_por_nombre
       FROM landings l
       JOIN usuarios u ON u.id = l.creado_por
       ORDER BY l.updated_at DESC, l.id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[landings] error al listar:', err);
    res.status(500).json({ error: 'Error al obtener landings' });
  }
}

// POST /landings — crea landing nueva en borrador (#10, #12)
export async function createLanding(req, res) {
  const { slug, nombre } = req.body ?? {};

  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'nombre es requerido' });
  }
  if (!isValidSlug(slug)) {
    return res.status(400).json({
      error: `slug inválido: debe tener 3-100 caracteres, solo minúsculas/números/guiones, y no puede ser una ruta reservada`,
    });
  }

  try {
    // Verificar unicidad del slug
    const [existing] = await pool.query('SELECT id FROM landings WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      return res.status(409).json({ error: `El slug "${slug}" ya está en uso` });
    }

    const [result] = await pool.query(
      `INSERT INTO landings (slug, nombre, creado_por) VALUES (?, ?, ?)`,
      [slug, nombre.trim(), req.user.userId]
    );

    const [rows] = await pool.query('SELECT * FROM landings WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[landings] error al crear:', err);
    res.status(500).json({ error: 'Error al crear landing' });
  }
}

// GET /landings/:id — landing completa (incluye editor_json para el editor)
export async function getLanding(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM landings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Landing no encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[landings] error al obtener:', err);
    res.status(500).json({ error: 'Error al obtener landing' });
  }
}

// PATCH /landings/:id — actualiza campos editables en borrador (#10)
export async function updateLanding(req, res) {
  const { id } = req.params;
  const { slug, nombre, editor_json, meta_title, meta_description, redirect_url } = req.body ?? {};

  try {
    const [existing] = await pool.query('SELECT id, slug FROM landings WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Landing no encontrada' });
    }

    // Si cambia el slug, validar
    if (slug !== undefined) {
      if (!isValidSlug(slug)) {
        return res.status(400).json({ error: 'slug inválido' });
      }
      if (slug !== existing[0].slug) {
        const [dup] = await pool.query('SELECT id FROM landings WHERE slug = ? AND id != ?', [slug, id]);
        if (dup.length > 0) {
          return res.status(409).json({ error: `El slug "${slug}" ya está en uso` });
        }
      }
    }

    const fields = [];
    const values = [];

    if (slug !== undefined) { fields.push('slug = ?'); values.push(slug); }
    if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre.trim()); }
    if (editor_json !== undefined) { fields.push('editor_json = ?'); values.push(editor_json); }
    if (meta_title !== undefined) { fields.push('meta_title = ?'); values.push(meta_title); }
    if (meta_description !== undefined) { fields.push('meta_description = ?'); values.push(meta_description); }
    if (redirect_url !== undefined) { fields.push('redirect_url = ?'); values.push(redirect_url); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE landings SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const [rows] = await pool.query('SELECT * FROM landings WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('[landings] error al actualizar:', err);
    res.status(500).json({ error: 'Error al actualizar landing' });
  }
}

// POST /landings/:id/publish — publica la landing (solo admin) (#12)
export async function publishLanding(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT editor_json FROM landings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Landing no encontrada' });
    }
    if (!rows[0].editor_json) {
      return res.status(400).json({ error: 'No hay contenido para publicar (editor vacío)' });
    }

    // Por ahora el HTML se almacena tal cual — la sanitización completa
    // con DOMPurify se agrega en Fase 5 (#25).
    // El frontend envía { html, css } ya exportados por GrapesJS.
    const { html, css } = req.body ?? {};
    if (!html) {
      return res.status(400).json({ error: 'HTML exportado es requerido para publicar' });
    }

    await pool.query(
      `UPDATE landings
       SET estado = 'publicada', html_publicado = ?, css_publicado = ?,
           publicado_por = ?, published_at = NOW()
       WHERE id = ?`,
      [html, css || '', req.user.userId, id]
    );

    const [updated] = await pool.query('SELECT * FROM landings WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('[landings] error al publicar:', err);
    res.status(500).json({ error: 'Error al publicar landing' });
  }
}

// PATCH /landings/:id/status — cambia estado (solo admin) (#12)
export async function updateStatus(req, res) {
  const { id } = req.params;
  const { estado } = req.body ?? {};
  const VALID = ['borrador', 'publicada', 'desactivada'];

  if (!VALID.includes(estado)) {
    return res.status(400).json({ error: `estado debe ser uno de: ${VALID.join(', ')}` });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM landings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Landing no encontrada' });
    }

    const updates = { estado };
    if (estado === 'borrador') {
      // Volver a borrador limpia el HTML publicado
      await pool.query(
        `UPDATE landings SET estado = ?, html_publicado = NULL, css_publicado = NULL, published_at = NULL WHERE id = ?`,
        [estado, id]
      );
    } else {
      await pool.query('UPDATE landings SET estado = ? WHERE id = ?', [estado, id]);
    }

    const [updated] = await pool.query('SELECT * FROM landings WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('[landings] error al cambiar estado:', err);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
}

// DELETE /landings/:id — elimina landing + assets en disco (solo admin)
export async function deleteLanding(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id FROM landings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Landing no encontrada' });
    }

    // Eliminar assets del disco
    const assetsDir = path.join(process.cwd(), 'uploads', 'landings', id);
    if (fs.existsSync(assetsDir)) {
      fs.rmSync(assetsDir, { recursive: true, force: true });
    }

    // FK ON DELETE CASCADE se encarga de landing_assets
    await pool.query('DELETE FROM landings WHERE id = ?', [id]);
    res.json({ id: Number(id) });
  } catch (err) {
    console.error('[landings] error al eliminar:', err);
    res.status(500).json({ error: 'Error al eliminar landing' });
  }
}

// GET /landings/slug/:slug/available — verifica si un slug está disponible (#11)
export async function checkSlugAvailable(req, res) {
  const { slug } = req.params;

  if (!isValidSlug(slug)) {
    return res.json({ available: false, reason: 'slug inválido' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM landings WHERE slug = ?', [slug]);
    res.json({ available: rows.length === 0, slug });
  } catch (err) {
    console.error('[landings] error al verificar slug:', err);
    res.status(500).json({ error: 'Error al verificar slug' });
  }
}
