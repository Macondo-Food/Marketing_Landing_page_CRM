# Estado actual del proyecto — VSL Macondo

Última actualización: 2026-09-08.

Este documento resume el estado real del código. La bitácora detallada
fase por fase vive en `CLAUDE.md`; este archivo es solo la foto actual
de qué está completo, qué falta y qué está bloqueado.

---

## Resumen ejecutivo

VSL Macondo es un embudo de captación de leads en dos apps independientes:
una landing tipo VSL con quiz de calificación y agendamiento automático en
Google Calendar (`frontend/`), y un mini CRM con login por roles (password
o Google), pipeline manual, dashboard, vista de contactos, generador UTM
multi-landing y webhook al CRM externo (`backend/` + rutas `/crm/*`).

El flujo de negocio de punta a punta (landing → quiz → calificación en
servidor → agendar/descartar → CRM) está completo y funciona con
integraciones reales (MySQL, Google Calendar, Google OAuth). La
arquitectura soporta múltiples landings autocontenidas con filtro por
landing en el CRM.

---

## Funcionalidades completadas

### Landing y video
- Landing reconstruida en React (Vite) desde el HTML original del PM.
  Estilos inline como objetos React (diseño 1:1 preservado).
- Video real de Vturb integrado (`VturbPlayer.jsx`): script de Converte
  AI, `<vturb-smartplayer>` real, patrón señuelo + `MutationObserver`
  para el CTA del video, botón persistente "Reservar mi llamada".
- Favicon, marquee de logos de clientes reales (6 logos), slider animado
  con `prefers-reduced-motion`.
- Meta Pixel y LinkedIn Insight Tag cargados solo en la landing (no en
  el CRM).

### Quiz y calificación
- `QuizPopup.jsx`: datos de contacto (nombre, email, teléfono, empresa,
  checkbox de tratamiento de datos) + 4 preguntas del quiz.
- Solo presupuesto (`inversion_nube`) y cargo (`cargo`) pueden
  descalificar — proveedor de nube e industria ya no descalifican.
- Prioridad de 4 niveles: `vip` / `alta` / `media_baja` / `en_revision`.
- Frontend y backend (`qualification.service.js`) verificados línea por
  línea como coincidentes.
- Campo `detalle` de texto libre para "Otros proveedores" persistido en
  `respuestas_quiz`.

### Calendario
- Slots de 30 min, L-V 10:00-12:00 y 14:00-16:00, America/Bogota.
- Colchón de 1 día hábil, 4 días hábiles exhibidos, festivos de Colombia
  en tabla `festivos_colombia` (17 festivos de 2026).
- `GET /calendar/disponibilidad` cruza con `freebusy.query` real de
  Google. `POST /calendar/agendar` revalida el slot antes de crear
  (`409` si condición de carrera), crea evento con Google Meet.
- Botón "Agregar a mi calendario" (link pre-rellenado de Google Calendar)
  en vez del link directo de Meet.

### CRM — autenticación y usuarios
- Login con email/password (`bcrypt.compare`, hash dummy para timing
  seguro) o con Google Sign-In (dominio `@macondosoftwares.com`,
  auto-crea como `vendedor`).
- JWT de 8h guardado solo en memoria (React Context, no localStorage).
- Roles `admin`/`vendedor`: ambos ven y editan todos los leads; solo
  `admin` accede a `/crm/usuarios`.
- CRUD de usuarios con protección de "no dejar sin admin".

### CRM — leads, contactos, dashboard, UTM
- Tabla de leads con prioridad (badge de color), estado editable
  (4 estados manuales del pipeline), modal de detalle editable.
- Vista de contactos (descalificados) con toggle de `contactado`.
- Dashboard: resumen (total, % calificados, % agendados) + barras por
  pregunta + reporte "Rendimiento por campaña".
- Generador UTM: selector de plataforma + landing, URL derivada, campo
  `utm_term`, historial con nombre del creador.
- **Filtro por landing** en las 4 vistas del CRM (leads, contactos,
  dashboard, generador UTM) — dropdown + columna "Landing" en tablas.

### Webhook al CRM externo
- `webhook.service.js`: arma JSON del documento del PM (`event`,
  `form_id`, `contact`, `qualification_data` con códigos en inglés,
  `priority_tier`, `attribution`).
- Fire-and-forget en `POST /leads` (ambas ramas: lead y contacto).
- Sin URL real configurada → `console.log` del payload (comportamiento
  esperado por ahora, confirmado por el PM).

### Notificaciones (correo + Google Chat)
- `notificaciones.service.js`: `enviarCorreoAgendamiento` (nodemailer) y
  `enviarGoogleChatAgendamiento` (webhook de Google Chat).
- Se disparan solo al agendar reunión. Fire-and-forget.
- Variables de entorno sin configurar → `console.log` (código listo,
  esperando configuración real).

### Multi-landing
- Arquitectura autocontenida: cada landing es un archivo en `pages/`
  con su propio markup, estilos y quiz inline.
- Campo `landing` en `leads`, `contactos` y `utm_urls`.
- Convención documentada en `CONVENCION_LANDINGS.md`.
- Lista de landings en `frontend/src/utils/landings.js` (frontend) y
  `backend/src/controllers/utm.controller.js` (backend), sincronizadas.

### Hardening de seguridad
- `helmet()`, CORS restringido por `ALLOWED_ORIGINS`, rate limiting
  (login: 5/15 min, leads: 20/15 min).
- `bcrypt` con compilación nativa aprobada (`pnpm-workspace.yaml`).

### Auto-migración de base de datos
- `backend/src/db/migrate.js`: corre en cada arranque del servidor
  (antes de `app.listen`). Idempotente, seguro de re-ejecutar.
- Tablas con `CREATE TABLE IF NOT EXISTS`, columnas con verificación
  contra `information_schema`, ENUM de prioridad con migración de 3
  pasos (ampliar → migrar → angostar).

---

## Funcionalidades con pendientes menores

- **Notificaciones sin configurar en producción.** El código está listo
  y probado en modo "sin configurar", pero las variables de entorno
  (`NOTIF_EMAIL_USER`, `NOTIF_EMAIL_APP_PASSWORD`, `NOTIF_EMAIL_DESTINO`,
  `GOOGLE_CHAT_WEBHOOK_URL`) siguen vacías. No es un bug — el sistema
  funciona normal, simplemente no envía correos/mensajes hasta que se
  configuren.
- **Webhook sin URL real.** Mismo caso: `WEBHOOK_CRM_URL` vacía → solo
  `console.log`. El PM confirmó que no es una integración pendiente por
  ahora.

---

## Sin iniciar

1. **Filtro de preguntas en descalificados/contactos.** Pendiente de
   definir el alcance exacto.
2. **Deploy a producción.** Sin `Dockerfile`, CI/CD, ni configuración de
   hosting definida para ninguna de las dos apps.

---

## Bloqueados por terceros

- **Festivo "Virgen de Chiquinquirá":** fecha en disputa (9 o 13 de
  julio). El usuario verificaría y pasaría el `INSERT` exacto.
- **`reference/vturb-embed.txt` y `reference/google-calendar-setup.md`:**
  siguen en 0 bytes. No bloquean nada funcional pero no hay
  documentación de respaldo en esos archivos.

---

## Decisiones técnicas sin confirmar por el PM

- `WEBHOOK_FORM_ID = 'quiz_vsl_macondo'` y los nombres de campo del
  webhook (`priority_tier`, `current_cloud_provider_other`) son
  elecciones por analogía, no confirmados contra el documento del PM.
  No urgente mientras no se conecte contra un CRM externo real.
- `.env.example` tiene `GOOGLE_CALENDAR_ID = primary` y
  `DB_NAME = vsl_crm` como ejemplos genéricos, pero los valores reales
  del proyecto son un calendario secundario ("Landing-vsl") y
  `vsl_macondo`. Solo la plantilla, no el `.env` real.

---

## Sin tests automatizados

No hay archivos de test (`*.test.js`, `__tests__/`) en `backend/` ni
`frontend/`. Toda verificación se hizo manualmente contra bases de datos
descartables o con `curl`/navegador.
