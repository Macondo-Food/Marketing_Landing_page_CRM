// Script de un solo uso: crea el primer usuario admin en la tabla `usuarios`
// a partir de ADMIN_USER (email) y ADMIN_PASSWORD (backend/.env). Correr
// manualmente con: pnpm seed-admin
//
// Si ya existe un usuario con ese email, no hace nada (seguro de re-correr).
import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../src/db/connection.js';

const { ADMIN_USER, ADMIN_PASSWORD } = process.env;

if (!ADMIN_USER || !ADMIN_PASSWORD) {
  console.error('Faltan ADMIN_USER y/o ADMIN_PASSWORD en backend/.env.');
  process.exit(1);
}

try {
  const [existing] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [ADMIN_USER]);

  if (existing.length > 0) {
    console.log(`Ya existe un usuario con el email ${ADMIN_USER}. No se creó nada.`);
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.execute(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      ['Administrador', ADMIN_USER, passwordHash, 'admin']
    );
    console.log(`Usuario admin creado: ${ADMIN_USER}`);
  }
} catch (err) {
  console.error('Error al crear el usuario admin:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
