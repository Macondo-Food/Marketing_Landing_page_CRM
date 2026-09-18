import pool from './connection.js';

// Refleja fielmente la estructura final de backend/src/db/schema.sql —
// confirmado contra la base de datos real (vsl_macondo) por auditoría directa
// de information_schema antes de escribir este archivo. Cada CREATE TABLE ya
// es idempotente (IF NOT EXISTS) y usa la forma FINAL de cada columna, así
// que una base de datos nueva queda igual a una ya migrada sin pasar por
// ningún ALTER TABLE intermedio. El orden importa por las FK: leads antes de
// respuestas_quiz, usuarios antes de utm_urls.
const TABLES = [
  {
    name: 'leads',
    createSql: `
      CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        telefono VARCHAR(30) NOT NULL,
        empresa VARCHAR(150) NOT NULL DEFAULT '',
        utm_source VARCHAR(100) NULL,
        utm_medium VARCHAR(100) NULL,
        utm_campaign VARCHAR(150) NULL,
        utm_content VARCHAR(150) NULL,
        utm_term VARCHAR(150) NULL,
        calificado BOOLEAN NOT NULL,
        prioridad ENUM('vip', 'alta', 'media_baja', 'en_revision') NOT NULL,
        tratamiento_datos_aceptado BOOLEAN NOT NULL DEFAULT FALSE,
        tratamiento_datos_fecha DATETIME NULL,
        estado ENUM(
          'descalificado',
          'calificado',
          'agendado',
          'con_requisitos',
          'sin_requisitos_reunion',
          'reunion_cierre',
          'venta_servicio'
        ) NOT NULL,
        calendar_event_id VARCHAR(255) NULL,
        reunion_fecha_hora DATETIME NULL,
        landing VARCHAR(100) NOT NULL DEFAULT 'vsl-macondo',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `,
  },
  {
    name: 'respuestas_quiz',
    createSql: `
      CREATE TABLE IF NOT EXISTS respuestas_quiz (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT NOT NULL,
        pregunta VARCHAR(100) NOT NULL,
        respuesta VARCHAR(150) NOT NULL,
        descalifica BOOLEAN NOT NULL,
        detalle TEXT NULL,
        CONSTRAINT fk_respuestas_quiz_lead
          FOREIGN KEY (lead_id) REFERENCES leads(id)
          ON DELETE CASCADE
      )
    `,
  },
  {
    name: 'contactos',
    createSql: `
      CREATE TABLE IF NOT EXISTS contactos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        telefono VARCHAR(30) NOT NULL,
        empresa VARCHAR(150) NOT NULL,
        utm_source VARCHAR(100) NULL,
        utm_medium VARCHAR(100) NULL,
        utm_campaign VARCHAR(150) NULL,
        utm_content VARCHAR(150) NULL,
        utm_term VARCHAR(150) NULL,
        motivo_descalificacion TEXT NULL,
        contactado BOOLEAN NOT NULL DEFAULT FALSE,
        tratamiento_datos_aceptado BOOLEAN NOT NULL DEFAULT FALSE,
        tratamiento_datos_fecha DATETIME NULL,
        landing VARCHAR(100) NOT NULL DEFAULT 'vsl-macondo',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `,
  },
  {
    name: 'usuarios',
    createSql: `
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NULL,
        rol ENUM('admin', 'vendedor') NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `,
  },
  {
    name: 'utm_urls',
    createSql: `
      CREATE TABLE IF NOT EXISTS utm_urls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        url_completa VARCHAR(500) NOT NULL,
        utm_source VARCHAR(100) NOT NULL,
        utm_medium VARCHAR(100) NOT NULL,
        utm_campaign VARCHAR(150) NOT NULL,
        utm_content VARCHAR(150) NULL,
        utm_term VARCHAR(150) NULL,
        landing VARCHAR(100) NOT NULL DEFAULT 'vsl-macondo',
        creado_por INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_utm_urls_usuario
          FOREIGN KEY (creado_por) REFERENCES usuarios(id)
      )
    `,
  },
  {
    name: 'festivos_colombia',
    createSql: `
      CREATE TABLE IF NOT EXISTS festivos_colombia (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha DATE NOT NULL UNIQUE,
        descripcion VARCHAR(150) NOT NULL
      )
    `,
  },
  {
    name: 'pixel_configs',
    createSql: `
      CREATE TABLE IF NOT EXISTS pixel_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        landing VARCHAR(100) NOT NULL,
        tipo ENUM('meta_pixel', 'linkedin_insight', 'google_analytics', 'custom_script') NOT NULL,
        pixel_id VARCHAR(255) NOT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_landing_tipo (landing, tipo)
      )
    `,
  },
  // Fase 3 — Constructor de landings no-code (#7, #8, #10, #11, #12).
  // El orden importa: landing_forms antes que landings (FK form_id),
  // landings antes que landing_assets (FK landing_id).
  {
    name: 'landing_forms',
    createSql: `
      CREATE TABLE IF NOT EXISTS landing_forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        config_json TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `,
  },
  {
    name: 'landings',
    createSql: `
      CREATE TABLE IF NOT EXISTS landings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        nombre VARCHAR(200) NOT NULL,
        estado ENUM('borrador', 'publicada', 'desactivada') NOT NULL DEFAULT 'borrador',
        editor_json LONGTEXT NULL,
        html_publicado LONGTEXT NULL,
        css_publicado LONGTEXT NULL,
        form_id INT NULL,
        redirect_url VARCHAR(500) NULL,
        meta_title VARCHAR(200) NULL,
        meta_description VARCHAR(300) NULL,
        creado_por INT NOT NULL,
        publicado_por INT NULL,
        published_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_landings_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id),
        CONSTRAINT fk_landings_publicado_por FOREIGN KEY (publicado_por) REFERENCES usuarios(id),
        CONSTRAINT fk_landings_form FOREIGN KEY (form_id) REFERENCES landing_forms(id) ON DELETE SET NULL
      )
    `,
  },
  {
    name: 'landing_assets',
    createSql: `
      CREATE TABLE IF NOT EXISTS landing_assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        landing_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        storage_path VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size_bytes INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_assets_landing FOREIGN KEY (landing_id) REFERENCES landings(id) ON DELETE CASCADE
      )
    `,
  },
];

// Solo entran en juego si la tabla ya existía de una sesión anterior a que
// se agregara la columna (p.ej. vsl_macondo antes de la Fase 16/17). Para una
// tabla recién creada por el CREATE TABLE de arriba, columnExists() ya da
// true y cada paso de este arreglo es un no-op.
//
// El valor de `prioridad` que agrega este paso es el ENUM viejo de 3
// valores (Fase 11) a propósito, igual que el ALTER TABLE original
// documentado en schema.sql — ensurePrioridadEnum() de abajo se encarga de
// normalizarlo al ENUM final de 4 valores en el mismo run, exista una tabla
// vieja que apenas gana la columna aquí o una que ya la tenía.
const COLUMN_MIGRATIONS = [
  {
    table: 'leads',
    column: 'empresa',
    addSql: `ALTER TABLE leads ADD COLUMN empresa VARCHAR(150) NOT NULL DEFAULT '' AFTER telefono`,
  },
  {
    table: 'leads',
    column: 'prioridad',
    addSql: `ALTER TABLE leads ADD COLUMN prioridad ENUM('alta', 'media_alta', 'en_revision') NOT NULL DEFAULT 'en_revision' AFTER calificado`,
  },
  {
    table: 'leads',
    column: 'tratamiento_datos_aceptado',
    addSql: `ALTER TABLE leads ADD COLUMN tratamiento_datos_aceptado BOOLEAN NOT NULL DEFAULT FALSE AFTER prioridad`,
  },
  {
    table: 'leads',
    column: 'tratamiento_datos_fecha',
    addSql: `ALTER TABLE leads ADD COLUMN tratamiento_datos_fecha DATETIME NULL AFTER tratamiento_datos_aceptado`,
  },
  {
    table: 'leads',
    column: 'utm_term',
    addSql: `ALTER TABLE leads ADD COLUMN utm_term VARCHAR(150) NULL AFTER utm_content`,
  },
  {
    table: 'leads',
    column: 'reunion_fecha_hora',
    addSql: `ALTER TABLE leads ADD COLUMN reunion_fecha_hora DATETIME NULL AFTER calendar_event_id`,
  },
  {
    table: 'contactos',
    column: 'utm_term',
    addSql: `ALTER TABLE contactos ADD COLUMN utm_term VARCHAR(150) NULL AFTER utm_content`,
  },
  {
    table: 'utm_urls',
    column: 'utm_term',
    addSql: `ALTER TABLE utm_urls ADD COLUMN utm_term VARCHAR(150) NULL AFTER utm_content`,
  },
  {
    table: 'respuestas_quiz',
    column: 'detalle',
    addSql: `ALTER TABLE respuestas_quiz ADD COLUMN detalle TEXT NULL AFTER descalifica`,
  },
  {
    table: 'leads',
    column: 'landing',
    addSql: `ALTER TABLE leads ADD COLUMN landing VARCHAR(100) NOT NULL DEFAULT 'vsl-macondo' AFTER reunion_fecha_hora`,
  },
  {
    table: 'contactos',
    column: 'landing',
    addSql: `ALTER TABLE contactos ADD COLUMN landing VARCHAR(100) NOT NULL DEFAULT 'vsl-macondo' AFTER tratamiento_datos_fecha`,
  },
  {
    table: 'utm_urls',
    column: 'landing',
    addSql: `ALTER TABLE utm_urls ADD COLUMN landing VARCHAR(100) NOT NULL DEFAULT 'vsl-macondo' AFTER utm_term`,
  },
  // Fase 5 — Asignación automática de leads por landing (#20)
  {
    table: 'landings',
    column: 'asignado_a',
    addSql: `ALTER TABLE landings ADD COLUMN asignado_a INT NULL AFTER redirect_url, ADD CONSTRAINT fk_landings_asignado FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL`,
  },
  {
    table: 'leads',
    column: 'asignado_a',
    addSql: `ALTER TABLE leads ADD COLUMN asignado_a INT NULL AFTER landing, ADD CONSTRAINT fk_leads_asignado FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL`,
  },
  {
    table: 'contactos',
    column: 'asignado_a',
    addSql: `ALTER TABLE contactos ADD COLUMN asignado_a INT NULL AFTER landing, ADD CONSTRAINT fk_contactos_asignado FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL`,
  },
];

const PRIORIDAD_ENUM_FINAL = "enum('vip','alta','media_baja','en_revision')";

// 17 festivos de 2026 confirmados (ver schema.sql). INSERT IGNORE ya es
// idempotente por la UNIQUE en `fecha`, no hace falta chequear antes.
const FESTIVOS_SEED_SQL = `
  INSERT IGNORE INTO festivos_colombia (fecha, descripcion) VALUES
    ('2026-01-01', 'Año Nuevo'),
    ('2026-01-12', 'Reyes Magos'),
    ('2026-03-23', 'San José'),
    ('2026-04-02', 'Jueves Santo'),
    ('2026-04-03', 'Viernes Santo'),
    ('2026-05-01', 'Día del Trabajo'),
    ('2026-05-18', 'Ascensión del Señor'),
    ('2026-06-08', 'Corpus Christi'),
    ('2026-06-15', 'Sagrado Corazón'),
    ('2026-06-29', 'San Pedro y San Pablo'),
    ('2026-07-20', 'Independencia de Colombia'),
    ('2026-08-07', 'Batalla de Boyacá'),
    ('2026-08-17', 'Asunción de la Virgen'),
    ('2026-10-12', 'Día de la Raza'),
    ('2026-11-16', 'Independencia de Cartagena'),
    ('2026-12-08', 'Inmaculada Concepción'),
    ('2026-12-25', 'Navidad')
`;

// Pixels actuales hardcodeados en marketingPixels.js — se migran a DB
// para que sean configurables desde el CRM (#22).
const PIXELS_SEED_SQL = `
  INSERT IGNORE INTO pixel_configs (landing, tipo, pixel_id) VALUES
    ('vsl-macondo', 'meta_pixel', '3042201516085954'),
    ('vsl-macondo', 'linkedin_insight', '9632482'),
    ('lp1', 'meta_pixel', '3042201516085954'),
    ('lp1', 'linkedin_insight', '9632482')
`;

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

// Migración de 3 pasos documentada en schema.sql (Fase 16): 'media_alta' no
// es un valor válido del ENUM final, así que hay que ampliar el ENUM antes
// de poder migrar esas filas, y solo angostarlo después de que ya no quede
// ninguna fila que dependa del valor viejo.
async function ensurePasswordHashNullable() {
  const [rows] = await pool.query(
    `SELECT IS_NULLABLE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'password_hash'`
  );
  if (rows[0]?.IS_NULLABLE === 'YES') return;

  console.log('[migrate] usuarios.password_hash es NOT NULL, cambiando a NULL (login con Google)...');
  await pool.query('ALTER TABLE usuarios MODIFY COLUMN password_hash VARCHAR(255) NULL');
  console.log('[migrate] usuarios.password_hash ahora es NULL');
}

async function ensurePrioridadEnum() {
  const [rows] = await pool.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads' AND COLUMN_NAME = 'prioridad'`
  );
  const currentType = rows[0]?.COLUMN_TYPE;
  if (!currentType || currentType === PRIORIDAD_ENUM_FINAL) return;

  console.log(`[migrate] leads.prioridad tiene un ENUM desactualizado (${currentType}), migrando al final...`);
  await pool.query(
    `ALTER TABLE leads MODIFY COLUMN prioridad ENUM('alta', 'media_alta', 'en_revision', 'vip', 'media_baja') NOT NULL`
  );
  await pool.query(`UPDATE leads SET prioridad = 'alta' WHERE prioridad = 'media_alta'`);
  await pool.query(
    `ALTER TABLE leads MODIFY COLUMN prioridad ENUM('vip', 'alta', 'media_baja', 'en_revision') NOT NULL`
  );
  console.log('[migrate] leads.prioridad migrado a ' + PRIORIDAD_ENUM_FINAL);
}

export default async function migrate() {
  console.log('[migrate] verificando estructura de la base de datos...');

  for (const table of TABLES) {
    await pool.query(table.createSql);
  }

  for (const { table, column, addSql } of COLUMN_MIGRATIONS) {
    if (await columnExists(table, column)) continue;
    console.log(`[migrate] agregando columna faltante ${table}.${column}...`);
    await pool.query(addSql);
  }

  await ensurePrioridadEnum();
  await ensurePasswordHashNullable();

  await pool.query(FESTIVOS_SEED_SQL);
  await pool.query(PIXELS_SEED_SQL);

  console.log('[migrate] estructura de la base de datos al día.');
}
