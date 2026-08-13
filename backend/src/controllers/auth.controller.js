import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

function safeEquals(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function login(req, res) {
  const { usuario, password } = req.body ?? {};

  if (typeof usuario !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'usuario y password son requeridos' });
  }

  const validUser = safeEquals(usuario, process.env.ADMIN_USER ?? '');
  const validPassword = safeEquals(password, process.env.ADMIN_PASSWORD ?? '');

  if (!validUser || !validPassword) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const token = jwt.sign({ sub: usuario }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
}
