-- Modelo de datos según la sección 4 del plan.
-- Ejecutar manualmente contra la base de datos definida en DB_NAME (backend/.env).

-- Nota (Fase 11): desde esta fase, un lead que descalifica en el quiz ya no
-- se guarda aquí — va a la tabla `contactos`. Por eso `calificado` en la
-- práctica siempre es TRUE para filas nuevas; se deja la columna (en vez de
-- quitarla) porque el dashboard (Fase 7) ya consulta `calificado = 1` y no
-- es parte del alcance de esta fase tocarlo.
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
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS respuestas_quiz (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  pregunta VARCHAR(100) NOT NULL,
  respuesta VARCHAR(150) NOT NULL,
  descalifica BOOLEAN NOT NULL,
  -- Texto libre opcional (ej. pregunta proveedor_nube, opción "Otros
  -- proveedores / Hosting tradicional"). Antes de esta fase solo viajaba al
  -- webhook y se perdía si no estaba configurado — ver ESTADO_ACTUAL.md.
  detalle TEXT NULL,
  CONSTRAINT fk_respuestas_quiz_lead
    FOREIGN KEY (lead_id) REFERENCES leads(id)
    ON DELETE CASCADE
);

-- Contactos (Fase 11): quienes responden el quiz pero descalifican en
-- cualquiera de las 4 preguntas. Misma info de contacto que leads, pero sin
-- el pipeline de ventas (`estado`) — en su lugar, por qué no calificó y si
-- el equipo ya lo llamó.
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
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Usuarios del CRM (Fase de sistema de usuarios con roles). El primer admin
-- se crea con backend/scripts/seed-admin.mjs, no manualmente.
-- password_hash es NULL para usuarios creados vía Google Sign-In
-- (no tienen password). Login normal usa bcrypt.compare contra este campo.
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  rol ENUM('admin', 'vendedor') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Historial del generador de URLs con UTMs preestablecidos (cualquier rol
-- del CRM puede generar). Sin ON DELETE en creado_por a propósito: no debe
-- ser posible borrar un usuario que ya generó URLs sin decidir antes qué
-- pasa con ese historial (el default de InnoDB, RESTRICT, lo bloquea).
CREATE TABLE IF NOT EXISTS utm_urls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url_completa VARCHAR(500) NOT NULL,
  utm_source VARCHAR(100) NOT NULL,
  utm_medium VARCHAR(100) NOT NULL,
  utm_campaign VARCHAR(150) NOT NULL,
  utm_content VARCHAR(150) NULL,
  utm_term VARCHAR(150) NULL,
  creado_por INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_utm_urls_usuario
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

-- Festivos de Colombia (Fase 13): tabla editable en vez de hardcodear fechas
-- en el código — el equipo puede agregar el año siguiente (o corregir una
-- fecha) directamente en la base de datos. `fecha` es UNIQUE para que el
-- INSERT IGNORE de abajo se pueda re-correr sin duplicar filas.
CREATE TABLE IF NOT EXISTS festivos_colombia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  descripcion VARCHAR(150) NOT NULL
);

-- Festivos 2026 confirmados. Pendiente: "Virgen de Chiquinquirá" — la fecha
-- exacta está en disputa entre fuentes (9 o 13 de julio); se agrega en un
-- INSERT aparte cuando se confirme, no adivinar aquí.
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
  ('2026-12-25', 'Navidad');

-- festivos_colombia es tabla nueva (no requiere ALTER TABLE como leads más
-- abajo): correr todo este schema.sql de nuevo contra vsl_macondo real es
-- seguro, tanto el CREATE TABLE IF NOT EXISTS como el INSERT IGNORE no
-- tocan nada si ya existen.

-- ---------------------------------------------------------------------------
-- Migración Fase 11 para bases de datos EXISTENTES (como vsl_macondo real):
-- `CREATE TABLE IF NOT EXISTS leads` de arriba no toca la tabla si ya existe,
-- así que las columnas nuevas hay que agregarlas a mano con ALTER TABLE.
-- `contactos` sí se crea sola con el CREATE TABLE de arriba (es nueva).
--
-- empresa/tratamiento_datos_aceptado quedan NOT NULL pero con DEFAULT
-- temporal para no romper las filas existentes; revisar esas filas viejas
-- a mano después si hace falta un valor real. prioridad usa 'en_revision'
-- como default de backfill por la misma razón (leads viejos no pasaron por
-- la lógica nueva de la Pregunta 4).
-- ---------------------------------------------------------------------------
-- ALTER TABLE leads
--   ADD COLUMN empresa VARCHAR(150) NOT NULL DEFAULT '' AFTER telefono,
--   ADD COLUMN prioridad ENUM('alta', 'media_alta', 'en_revision') NOT NULL DEFAULT 'en_revision' AFTER calificado,
--   ADD COLUMN tratamiento_datos_aceptado BOOLEAN NOT NULL DEFAULT FALSE AFTER prioridad,
--   ADD COLUMN tratamiento_datos_fecha DATETIME NULL AFTER tratamiento_datos_aceptado;

-- ---------------------------------------------------------------------------
-- Migración Fase 16 para bases de datos EXISTENTES (como vsl_macondo real):
-- corrección crítica de calificación (documento "Especificaciones Técnicas"
-- del PM) + columna utm_term nueva en leads/contactos/utm_urls.
--
-- El ENUM de `prioridad` cambia de ('alta', 'media_alta', 'en_revision') a
-- ('vip', 'alta', 'media_baja', 'en_revision'): 'media_alta' desaparece y
-- 'vip'/'media_baja' son nuevos. Como pueden existir filas reales con
-- 'media_alta', el cambio se hace en 3 pasos para no perder datos ni
-- depender de si sql_mode es estricto:
--   1) ampliar el ENUM para que incluya TANTO los valores viejos como los
--      nuevos (ningún dato existente queda fuera del ENUM todavía),
--   2) migrar las filas 'media_alta' -> 'alta' (el documento nuevo del PM
--      sube FinTech/E-commerce/AdTech a prioridad alta, que es la industria
--      que antes generaba 'media_alta'),
--   3) recién ahí angostar el ENUM a los 4 valores finales, ya sin ninguna
--      fila que dependa del valor viejo.
-- Ejecutar los 3 pasos en orden, uno detrás de otro:
--
-- ALTER TABLE leads
--   MODIFY COLUMN prioridad ENUM('alta', 'media_alta', 'en_revision', 'vip', 'media_baja') NOT NULL;
--
-- UPDATE leads SET prioridad = 'alta' WHERE prioridad = 'media_alta';
--
-- ALTER TABLE leads
--   MODIFY COLUMN prioridad ENUM('vip', 'alta', 'media_baja', 'en_revision') NOT NULL;
--
-- Columna utm_term nueva (nullable, no rompe filas existentes) en las 3
-- tablas que ya existían antes de esta fase:
--
-- ALTER TABLE leads ADD COLUMN utm_term VARCHAR(150) NULL AFTER utm_content;
-- ALTER TABLE contactos ADD COLUMN utm_term VARCHAR(150) NULL AFTER utm_content;
-- ALTER TABLE utm_urls ADD COLUMN utm_term VARCHAR(150) NULL AFTER utm_content;

-- ---------------------------------------------------------------------------
-- Migración: columna reunion_fecha_hora nueva en leads (fecha/hora exacta de
-- la reunión agendada, la guarda POST /calendar/agendar al mismo tiempo que
-- calendar_event_id). Nullable, no rompe filas existentes — los leads ya
-- agendados antes de esta columna simplemente quedan sin ese dato hasta que
-- se reagenden.
--
-- ALTER TABLE leads ADD COLUMN reunion_fecha_hora DATETIME NULL AFTER calendar_event_id;

-- ---------------------------------------------------------------------------
-- Migración: columna detalle nueva en respuestas_quiz (texto libre opcional,
-- ej. proveedor "Otros / Hosting tradicional"). Antes de esta fase ese texto
-- solo viajaba al webhook del CRM externo y se perdía si no estaba
-- configurado — ver ESTADO_ACTUAL.md. Nullable, no rompe filas existentes.
--
-- ALTER TABLE respuestas_quiz ADD COLUMN detalle TEXT NULL AFTER descalifica;
