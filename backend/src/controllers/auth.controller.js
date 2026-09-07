import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import pool from '../db/connection.js';

// Hash de un password que nadie usa: se compara contra él cuando el email no
// existe, para que login() tarde lo mismo con email inválido o con password
// incorrecto (evita que el tiempo de respuesta revele qué emails existen).
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8Q4c6b5kz0YV9OGxmWjS2LzBK0K1Vy';

const ALLOWED_DOMAIN = 'macondosoftwares.com';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function login(req, res) {
  const { usuario, password } = req.body ?? {};

  if (typeof usuario !== 'string' || typeof password !== 'string' || !usuario.trim() || !password) {
    return res.status(400).json({ error: 'usuario y password son requeridos' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = ?',
      [usuario.trim()]
    );

    const user = rows[0];
    const hash = user?.password_hash || DUMMY_HASH;
    const validPassword = await bcrypt.compare(password, hash);

    if (!user || !validPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { sub: user.id, userId: user.id, nombre: user.nombre, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, usuario: { id: user.id, nombre: user.nombre, rol: user.rol } });
  } catch (err) {
    console.error('[auth] error al iniciar sesión:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

export async function loginGoogle(req, res) {
  const { idToken } = req.body ?? {};

  if (typeof idToken !== 'string' || !idToken.trim()) {
    return res.status(400).json({ error: 'idToken es requerido' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, hd } = payload;

    if (hd !== ALLOWED_DOMAIN) {
      return res.status(403).json({
        error: `Solo se permite acceso con correo @${ALLOWED_DOMAIN}`,
      });
    }

    let [rows] = await pool.execute(
      'SELECT id, nombre, email, rol FROM usuarios WHERE email = ?',
      [email]
    );

    let user = rows[0];

    if (!user) {
      const [result] = await pool.execute(
        'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, NULL, ?)',
        [name, email, 'vendedor']
      );
      user = { id: result.insertId, nombre: name, rol: 'vendedor' };
    }

    const token = jwt.sign(
      { sub: user.id, userId: user.id, nombre: user.nombre, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, usuario: { id: user.id, nombre: user.nombre, rol: user.rol } });
  } catch (err) {
    console.error('[auth] error en login con Google:', err.message);
    res.status(401).json({ error: 'No se pudo verificar la identidad con Google' });
  }
}
