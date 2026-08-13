import bcrypt from 'bcrypt';
import pool from '../db/connection.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['admin', 'vendedor'];

export async function listUsuarios(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, email, rol, created_at FROM usuarios ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[usuarios] error al listar usuarios:', err);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
}

export async function createUsuario(req, res) {
  const { nombre, email, password, rol } = req.body ?? {};

  if (typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'nombre es requerido' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'email es inválido' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'password debe tener al menos 8 caracteres' });
  }
  if (!ROLES.includes(rol)) {
    return res.status(400).json({ error: `rol debe ser uno de: ${ROLES.join(', ')}` });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre.trim(), email.trim(), passwordHash, rol]
    );
    res.status(201).json({ id: result.insertId, nombre: nombre.trim(), email: email.trim(), rol });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }
    console.error('[usuarios] error al crear usuario:', err);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
}

export async function updateUsuario(req, res) {
  const id = Number(req.params.id);
  const { nombre, rol, password } = req.body ?? {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'id inválido' });
  }

  const fields = [];
  const values = [];

  if (nombre !== undefined) {
    if (typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({ error: 'nombre inválido' });
    }
    fields.push('nombre = ?');
    values.push(nombre.trim());
  }

  if (rol !== undefined) {
    if (!ROLES.includes(rol)) {
      return res.status(400).json({ error: `rol debe ser uno de: ${ROLES.join(', ')}` });
    }
    fields.push('rol = ?');
    values.push(rol);
  }

  if (password !== undefined) {
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'password debe tener al menos 8 caracteres' });
    }
    fields.push('password_hash = ?');
    values.push(await bcrypt.hash(password, 10));
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'no hay campos para actualizar' });
  }

  try {
    if (rol !== undefined && rol !== 'admin') {
      const [[current]] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [id]);
      if (!current) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      if (current.rol === 'admin' && (await isLastAdmin(id))) {
        return res.status(400).json({ error: 'No se puede quitar el rol admin al único administrador' });
      }
    }

    const [result] = await pool.execute(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
      [...values, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const [[updated]] = await pool.query(
      'SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = ?',
      [id]
    );
    res.json(updated);
  } catch (err) {
    console.error('[usuarios] error al actualizar usuario:', err);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
}

async function isLastAdmin(id) {
  const [[{ totalAdmins }]] = await pool.query(
    "SELECT COUNT(*) AS totalAdmins FROM usuarios WHERE rol = 'admin' AND id != ?",
    [id]
  );
  return Number(totalAdmins) === 0;
}

export async function deleteUsuario(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'id inválido' });
  }

  try {
    const [[user]] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.rol === 'admin' && (await isLastAdmin(id))) {
      return res.status(400).json({ error: 'No se puede eliminar al único administrador' });
    }

    await pool.execute('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ id });
  } catch (err) {
    console.error('[usuarios] error al eliminar usuario:', err);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
}
