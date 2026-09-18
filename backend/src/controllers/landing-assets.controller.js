import pool from '../db/connection.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { IMAGE_TYPES } from '../middleware/upload.js';

const MAX_ASSETS_PER_LANDING = 20;

// POST /landings/:id/assets — sube archivo + convierte a WebP si es imagen (#7)
export async function uploadAsset(req, res) {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Archivo requerido' });
  }

  try {
    // Verificar que la landing existe
    const [landings] = await pool.query('SELECT id FROM landings WHERE id = ?', [id]);
    if (landings.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Landing no encontrada' });
    }

    // Contar assets existentes
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as total FROM landing_assets WHERE landing_id = ?', [id]
    );
    if (countRows[0].total >= MAX_ASSETS_PER_LANDING) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: `Límite de ${MAX_ASSETS_PER_LANDING} archivos por landing alcanzado`,
      });
    }

    let finalPath = req.file.path;
    let finalMime = req.file.mimetype;
    let finalSize = req.file.size;

    // Convertir imágenes a WebP (excepto SVG y GIF animado)
    const isImage = IMAGE_TYPES.includes(req.file.mimetype);
    const isSvgOrGif = req.file.mimetype === 'image/svg+xml' || req.file.mimetype === 'image/gif';

    if (isImage && !isSvgOrGif) {
      const webpPath = req.file.path.replace(/\.[^.]+$/, '.webp');
      await sharp(req.file.path).webp({ quality: 80 }).toFile(webpPath);
      fs.unlinkSync(req.file.path);
      finalPath = webpPath;
      finalMime = 'image/webp';
      finalSize = fs.statSync(webpPath).size;
    }

    // Ruta relativa al directorio uploads/ (para servir como estático)
    const storagePath = path.relative(path.join(process.cwd(), 'uploads'), finalPath).replace(/\\/g, '/');

    const [result] = await pool.query(
      `INSERT INTO landing_assets (landing_id, filename, storage_path, mime_type, size_bytes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, req.file.originalname, storagePath, finalMime, finalSize]
    );

    res.status(201).json({
      id: result.insertId,
      landing_id: Number(id),
      filename: req.file.originalname,
      storage_path: storagePath,
      mime_type: finalMime,
      size_bytes: finalSize,
      url: `/uploads/${storagePath}`,
    });
  } catch (err) {
    // Limpiar archivo subido si algo falla
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('[landing-assets] error al subir asset:', err);
    res.status(500).json({ error: 'Error al subir archivo' });
  }
}

// GET /landings/:id/assets — lista assets de una landing
export async function listAssets(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT id, landing_id, filename, storage_path, mime_type, size_bytes, created_at
       FROM landing_assets WHERE landing_id = ? ORDER BY created_at DESC`,
      [id]
    );
    res.json(rows.map((r) => ({ ...r, url: `/uploads/${r.storage_path}` })));
  } catch (err) {
    console.error('[landing-assets] error al listar assets:', err);
    res.status(500).json({ error: 'Error al obtener archivos' });
  }
}

// DELETE /landings/:id/assets/:assetId — elimina asset + archivo en disco
export async function deleteAsset(req, res) {
  const { id, assetId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT storage_path FROM landing_assets WHERE id = ? AND landing_id = ?',
      [assetId, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Asset no encontrado' });
    }

    const filePath = path.join(process.cwd(), 'uploads', rows[0].storage_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM landing_assets WHERE id = ?', [assetId]);
    res.json({ id: Number(assetId) });
  } catch (err) {
    console.error('[landing-assets] error al eliminar asset:', err);
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
}
