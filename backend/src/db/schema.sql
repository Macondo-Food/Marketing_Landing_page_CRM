-- Modelo de datos según la sección 4 del plan.
-- Ejecutar manualmente contra la base de datos definida en DB_NAME (backend/.env).

CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  utm_source VARCHAR(100) NULL,
  utm_medium VARCHAR(100) NULL,
  utm_campaign VARCHAR(150) NULL,
  utm_content VARCHAR(150) NULL,
  calificado BOOLEAN NOT NULL,
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
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS respuestas_quiz (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  pregunta VARCHAR(100) NOT NULL,
  respuesta VARCHAR(150) NOT NULL,
  descalifica BOOLEAN NOT NULL,
  CONSTRAINT fk_respuestas_quiz_lead
    FOREIGN KEY (lead_id) REFERENCES leads(id)
    ON DELETE CASCADE
);

-- Usuarios del CRM (Fase de sistema de usuarios con roles). El primer admin
-- se crea con backend/scripts/seed-admin.mjs, no manualmente.
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
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
  creado_por INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_utm_urls_usuario
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);
