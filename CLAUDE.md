# Bitácora de estado — Proyecto VSL Macondo

Última actualización: 2026-08-12.

Este archivo es un resumen del estado real del código para retomar el trabajo
sin tener que releer toda la conversación. La fuente de verdad del **diseño
del producto** sigue siendo `plan-proyecto-vsl.md` (mismo directorio); este
archivo es solo la bitácora de **qué se construyó, qué falta y qué quedó a
medias**.

**Nota sobre nombres de carpetas:** `plan-proyecto-vsl.md` (sección 5) usa
`front/` y `back/` en los diagramas, pero el proyecto real usa
`frontend/` y `backend/`. Todo lo construido está en esas dos carpetas.

---

## 1. Completado por fase

### Fase 1 — Landing convertida a React
- `reference/landing-original.html` no era HTML plano: era un "bundle"
  autoextraíble (assets en base64 + plantilla JSON). Se desempaquetó con un
  script Node (gzip + base64 decode, no quedó guardado en el repo) para
  extraer el markup real, los estilos y 8 imágenes reales.
- Scaffold Vite + React creado desde cero en `frontend/` (no existía
  `package.json`): `package.json`, `vite.config.js`, `index.html`,
  `src/main.jsx`, `src/App.jsx`, `src/index.css`.
- Componentes en `frontend/src/components/`: `Header.jsx`, `Hero.jsx`,
  `VideoSection.jsx`, `VturbPlayer.jsx` (placeholder), `ClientsSection.jsx`,
  `Footer.jsx`.
- Página `frontend/src/pages/LandingVSL.jsx`: ensambla las secciones y
  dispara `captureUtms()` en un `useEffect` al montar.
- `frontend/src/utils/utm.js`: `captureUtms()` / `getStoredUtms()`. Lee
  `utm_source/medium/campaign/content` de la URL y los guarda en
  `localStorage` bajo la key `vsl_utms`. Si la URL trae UTMs nuevos,
  **reemplaza** el set completo (no mezcla campos de dos campañas distintas).
- Assets reales en `frontend/src/assets/`: `macondo-logo.png`,
  `alibaba-logo.png`, `cliente-1.png` … `cliente-6.png`.
- Decisión de diseño: estilos **inline como objetos React** (1:1 con el HTML
  original) en vez de CSS/Tailwind, para preservar el diseño exacto sin
  reinterpretarlo. Tipografías (Montserrat 500/600/700/800, Source Sans 3
  400/600) cargadas desde Google Fonts CDN en `index.html`.

### Fase 2 — Popup del quiz (`QuizPopup.jsx`)
- Un solo componente `frontend/src/components/QuizPopup.jsx`, controlado
  desde `LandingVSL.jsx` (estado `isQuizOpen`), que se abre al hacer clic en
  `VturbPlayer`.
- Flujo interno por `step`: `0` = datos de contacto (nombre, email, teléfono,
  con validación básica), `1..4` = las 4 preguntas del quiz (sección 3 del
  plan: `inversion_nube`, `proveedor_nube`, `cargo`, `industria`), `5` =
  resultado.
- Lógica de descalificación en frontend: cada opción tiene un flag
  `descalifica` fiel a las tablas de la sección 3. `calificado` global =
  ninguna respuesta descalifica.
- Botón "Atrás" conserva tanto los datos de contacto como la respuesta
  previamente elegida al retroceder entre preguntas.
- Pantalla de resultado: si descalifica, mensaje de cierre simple; si
  califica, **placeholder** de texto ("Aquí va el selector de horario") — el
  `ScheduleSlots.jsx` real todavía no existe.
- El payload final se arma como
  `{ nombre, email, telefono, utms, calificado, respuestas: [{pregunta, respuesta, descalifica}, ...] }`
  y **solo se imprime por `console.log`** — no hay ningún `fetch`/`POST`
  real todavía (esto se resolvió en la Fase 5, ver sección 1).

### Fase 3 — Backend + MySQL
- Scaffold Node creado desde cero en `backend/` (no existía `package.json`):
  Express + `cors` + `dotenv` + `mysql2`, ESM (`"type": "module"`).
- `backend/src/db/connection.js`: pool `mysql2/promise` leyendo credenciales
  de variables de entorno.
- `backend/src/db/schema.sql`: `CREATE TABLE leads` y `CREATE TABLE
  respuestas_quiz` según sección 4 del plan, con FK `ON DELETE CASCADE`.
  **No se ejecuta automáticamente** — lo corre el usuario manualmente.
- `backend/src/services/qualification.service.js`: reevalúa la calificación
  en servidor (no confía en el flag `descalifica` que mande el cliente),
  comparando `pregunta` + `respuesta` contra las mismas opciones
  descalificantes del frontend.
- `POST /leads` y `GET /leads` en `backend/src/controllers/leads.controller.js`
  + `backend/src/routes/leads.routes.js`. `POST /leads` valida
  nombre/email/teléfono, evalúa calificación, inserta `leads` +
  `respuestas_quiz` en una transacción, responde `{ calificado, leadId }`.
- Bug encontrado y corregido durante las pruebas: `pool.getConnection()`
  estaba fuera del `try/catch` en el controller — si fallaba, tumbaba **todo
  el proceso Node**, no solo la request. Ya está corregido (conexión
  obtenida dentro del `try`, `rollback`/`release` protegidos con `if
  (connection)`).
- Se probó el flujo completo (`INSERT`/`SELECT`/`DELETE` con cascada por FK)
  contra una base de datos **descartable**, nunca contra `vsl_macondo`
  directamente desde Claude.
- Ajuste posterior: el `ENUM estado` de `leads` ahora incluye
  `'calificado'` (entre `'descalificado'` y `'agendado'`) y es `NOT NULL`.
  El controller guarda `'calificado'` en vez de `NULL` cuando el lead
  califica pero aún no agenda.

### Fase 4 — Google Calendar (disponibilidad + agendar)
- `backend/src/services/googleCalendar.service.js`: cliente OAuth2 desde
  `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN`.
  Calcula slots de 30 min, L-V 9:00-17:00, próximos 7 días hábiles, cruzados
  contra `freebusy.query` real de Google Calendar.
  - **America/Bogota se trata como offset fijo UTC-5** (Colombia no tiene
    horario de verano) con matemática de fechas manual — no se agregó
    ninguna librería de zonas horarias (`luxon`, `date-fns-tz`, etc.).
- `GET /calendar/disponibilidad` y `POST /calendar/agendar` en
  `backend/src/controllers/calendar.controller.js` +
  `backend/src/routes/calendar.routes.js`, montadas en `/calendar` desde
  `app.js`.
- `POST /calendar/agendar` recibe `{ leadId, slot: { start, end } }`:
  1. Valida `leadId` y `slot`.
  2. Busca el lead (`nombre`, `email`, `estado`, `calendar_event_id`).
  3. **Validación de estado (agregada al final de la Fase 4):** si
     `estado === 'descalificado'` → `400`; si ya tiene `calendar_event_id`
     → `400` (evita duplicar o sobrescribir un agendamiento existente).
  4. Revalida el slot puntual contra `freebusy` (`isSlotFree`) justo antes
     de crear el evento → `409` si alguien más lo tomó primero (evita doble
     reserva por condición de carrera).
  5. Crea el evento con Google Meet automático (`conferenceData`), invita al
     email del lead, guarda `calendar_event_id` y pone `estado = 'agendado'`.
- `backend/scripts/get-refresh-token.mjs`: script de un solo uso para
  obtener el `GOOGLE_REFRESH_TOKEN` (flujo OAuth2 loopback local). Se corre
  con `pnpm get-google-token` desde `backend/`. Ya se usó exitosamente; el
  `GOOGLE_REFRESH_TOKEN` vigente en `backend/.env` salió de ahí.
- **Verificado de punta a punta el 2026-08-12 con credenciales y calendario
  reales** (cuenta `social@macondosoftwares.com`, calendario secundario
  "Landing-vsl"): `GET /calendar/disponibilidad` lee correctamente los
  eventos reales del calendario; `POST /calendar/agendar` creó un evento
  real con Meet, la invitación llegó por correo, y `leads` quedó consistente
  (`estado='agendado'`, `calendar_event_id` guardado). También se confirmó
  que reintentar agendar el mismo lead responde `400` sin tocar Google
  (anti-duplicado). En el camino se encontró y corrigió un bug en
  `GOOGLE_CALENDAR_ID` — ver sección 2.

### Fase 5 — Frontend conectado al backend real
- `frontend/src/services/api.js` (nuevo): cliente HTTP (`createLead`,
  `getDisponibilidad`, `agendarReunion`). Usa `VITE_API_URL` con fallback a
  `http://localhost:3099`; normaliza errores de red y de respuesta HTTP en
  mensajes legibles para la UI.
- `QuizPopup.jsx`: el paso de resultado ahora llama `POST /leads` de verdad
  (antes solo hacía `console.log`, TODO ya resuelto). El payload se envía
  siempre (califique o no según el cálculo del frontend); la pantalla que se
  muestra después depende del `calificado` que devuelve la **respuesta del
  backend**, no del cálculo del frontend. Estados de "Enviando…" / error con
  botón "Reintentar". Guard con `useRef` para que el envío no se dispare dos
  veces por `React.StrictMode` en desarrollo.
- `frontend/src/components/ScheduleSlots.jsx` (nuevo, reemplaza el
  placeholder de texto): carga `GET /calendar/disponibilidad` al montarse,
  agrupa los horarios por día ("Lunes 17 de agosto") en hora Bogotá, permite
  elegir y confirmar con `POST /calendar/agendar`. Si el backend responde
  `409` (alguien más tomó ese horario), recarga la disponibilidad
  automáticamente y avisa. Pantalla final con el link de Google Meet.
- Verificado por el usuario probando el flujo completo en el navegador
  (contacto → quiz → selector de horario → evento real agendado).

### Fase 6 — CRM básico con login (`/crm`)
- **Backend:**
  - `POST /auth/login` (`controllers/auth.controller.js` +
    `routes/auth.routes.js`): compara `usuario`/`password` contra
    `ADMIN_USER`/`ADMIN_PASSWORD` con `crypto.timingSafeEqual` (comparación
    de tiempo constante), firma un JWT (`jsonwebtoken`) con expiración de 8h.
    Un solo usuario administrador — no es un sistema de usuarios completo.
  - `backend/src/middleware/auth.js` (`requireAuth`): valida
    `Authorization: Bearer <token>`; `401` si falta o es inválido/expirado.
  - `PATCH /leads/:id/estado` (nuevo, protegido): solo permite mover el
    lead a `con_requisitos | sin_requisitos_reunion | reunion_cierre |
    venta_servicio` (`400` si se intenta poner manualmente `descalificado`,
    `calificado` o `agendado` — esos los pone el sistema); `404` si el lead
    no existe.
  - `GET /leads` ahora también requiere `requireAuth` (antes estaba
    abierto). `POST /leads` sigue público, lo sigue usando el quiz.
- **Frontend:**
  - `frontend/src/context/AuthContext.jsx` (nuevo): token guardado en
    memoria (React Context), **no** en `localStorage`, a propósito.
  - `frontend/src/pages/Login.jsx` y `frontend/src/pages/CRM.jsx` (nuevo,
    ruta `/crm` agregada con `react-router-dom`): tabla de leads (nombre,
    email, teléfono, origen/`utm_source`, estado con badge de color, fecha)
    con un selector por fila para cambiar `estado` hacia los 4 valores del
    pipeline manual. `descalificado` se muestra como badge fijo, sin
    selector (no editable desde el CRM).
  - `frontend/src/App.jsx`: rutas `/` (landing, sin cambios) y `/crm`
    (envuelta en `AuthProvider`); si no hay token en memoria, `/crm` muestra
    el formulario de login directamente (sin ruta `/crm/login` separada).
- **Verificado de punta a punta el 2026-08-12:** login con credenciales
  correctas/incorrectas, `GET /leads` sin token (`401`) y con token (`200`),
  `PATCH /leads/:id/estado` a un valor no permitido (`400`) y a uno válido
  (`200`, persistido en la base de datos), lead inexistente (`404`).
  Probado primero con una instancia temporal aislada (puerto `3098`,
  credenciales de prueba) para no tocar el servidor ni los datos reales del
  usuario, revirtiendo cualquier cambio antes de apagarla; confirmado
  después por el usuario en su propio entorno (login, tabla de leads,
  cambio de estado persistiendo).

### Fase 7 — Dashboard (`/crm/dashboard`)
- **Backend:** `GET /dashboard` (protegido con `requireAuth`) en
  `backend/src/controllers/dashboard.controller.js` +
  `routes/dashboard.routes.js`. Agrupa `respuestas_quiz` por
  `pregunta`/`respuesta`; el `%` de cada respuesta se calcula sobre el total
  de leads que respondieron **esa pregunta específica**, no el total general
  de leads. También devuelve un `resumen`: `totalLeads`, `calificados`,
  `descalificados`, `agendadosOSuperior` (estado `agendado` o cualquiera de
  los 4 del pipeline manual) con sus porcentajes.
- **Frontend:** `frontend/src/pages/Dashboard.jsx` (nuevo, ruta
  `/crm/dashboard`), consume `GET /dashboard`. Tiles de resumen arriba + una
  tarjeta por pregunta con barras horizontales — **CSS plano, sin agregar
  ninguna librería de gráficos** (se evaluó `recharts` y se descartó para no
  sumar una dependencia nueva) — ordenadas de mayor a menor, con la
  respuesta y el `%` como texto directo (no solo al pasar el mouse).
  `frontend/src/App.jsx` se reestructuró (rutas anidadas) para que `/crm` y
  `/crm/dashboard` compartan el mismo `AuthProvider` — si no, cambiar de
  página habría forzado un login nuevo, porque el token vive solo en
  memoria. `frontend/src/pages/CRM.jsx` solo recibió el link "Ver
  dashboard" (única modificación a ese archivo).
- Verificado con una instancia aislada (backend: `401`/`200`, cálculos
  correctos) y con el flujo visual completo en navegador (login → tabla de
  leads → dashboard → tarjetas y barras → volver a leads).
- **Nota de datos, no de código:** se encontraron 2 respuestas con texto
  corrupto en un lead viejo (`lead_id=1`, anterior a esta conversación).
  Diagnóstico confirmado: **no fue un bug de collation/charset** (tabla,
  columna y conexión activa ya estaban consistentemente en `utf8mb4` — se
  verificó con `information_schema` y `SHOW VARIABLES`); el texto ya llegaba
  roto antes de tocar MySQL. Un caso (`"$3,000 - $5,000 USD/mes"` guardado
  como `",000 USD - ,000 USD / mes"`) fue interpolación de Bash (`$3`/`$5`
  como parámetros posicionales dentro de comillas dobles) durante una
  prueba manual vieja por terminal. El otro (`"Ingenier�a"`, con el
  carácter de reemplazo Unicode U+FFFD) confirmó que el texto ya venía
  corrupto antes del `INSERT`. Ese lead (`id=1`) se borró de la base
  (`DELETE` en `leads`, con cascada automática en `respuestas_quiz` por el
  FK `ON DELETE CASCADE`) — los leads reales (2 y 3) están limpios.

### Fase 8 — Hardening de seguridad (backend)
- `helmet()` agregado en `app.js` — headers de seguridad por defecto de
  Express, sin personalizar todavía.
- CORS ya no está abierto a cualquier origen: `cors({ origin:
  allowedOrigins })`, leyendo `ALLOWED_ORIGINS` (separado por comas) con
  fallback a `http://localhost:5173` si la variable no está seteada.
- Rate limiting con `express-rate-limit`
  (`backend/src/middleware/rateLimit.js`): `POST /auth/login` máximo 5
  intentos / 15 min por IP (cuenta **todos** los intentos, no solo los
  fallidos — si pruebas el login varias veces seguidas y fallas, te vas a
  quedar bloqueado incluso con la clave correcta hasta que pase la
  ventana); `POST /leads` máximo 20 / 15 min por IP.
- Se revisaron todos los controllers (`leads`, `calendar`, `dashboard`,
  `auth`) + `middleware/auth.js`: ya todos devolvían mensajes genéricos al
  cliente y loguean el detalle real solo con `console.error` — no hizo
  falta cambiar nada ahí. La única excepción intencional es
  `qualification.service.js`, cuyos mensajes de validación del quiz sí se
  reenvían tal cual al cliente porque están escritos a propósito para
  mostrarse al usuario (no son errores internos).
- Verificado con una instancia aislada: headers de `helmet` presentes,
  CORS permite `localhost:5173` y bloquea un origen no listado, rate limit
  de login bloquea con `429` en el intento 6, `POST /leads` sigue
  funcionando normal.

---

## 2. Verificaciones recientes y lecciones aprendidas

- **Base de datos `vsl_macondo` confirmada al día (2026-08-12).** Se
  consultó directamente la base real (no una de prueba): las tablas `leads`
  y `respuestas_quiz` existen, y la columna `estado` de `leads` ya es el
  ENUM completo y `NOT NULL` incluyendo `'calificado'`. `schema.sql` ya está
  aplicado, no hace falta ningún `ALTER TABLE`.
- **Fase 4 (Google Calendar) verificada de punta a punta el 2026-08-12**
  con credenciales y calendario reales. Ver el resumen en la sección 1
  (Fase 4).

### Bug encontrado y corregido: `GOOGLE_CALENDAR_ID` pegado en base64

- **Qué pasó:** al configurar `backend/.env`, el valor de
  `GOOGLE_CALENDAR_ID` se pegó codificado en base64 en vez de texto plano
  (terminaba en algo como `...bmRhci5nb29nbGUuY29t` en vez de
  `...@group.calendar.google.com`).
- **Cómo se manifestó (nada obvio):** `GET /calendar/disponibilidad`
  **no falló** — `freebusy.query` de Google, cuando el `calendarId` no
  existe o es inaccesible, no devuelve error: simplemente responde sin
  datos de "busy" para ese id (en `googleCalendar.service.js`,
  `response.data.calendars?.[calendarId]?.busy` queda `undefined` y el
  código lo trata como `[]`, es decir "todo libre"). El endpoint devolvía
  slots "disponibles" con total normalidad, pero era un falso positivo:
  nunca estaba leyendo el calendario real. El bug solo se hizo visible al
  probar `POST /calendar/agendar`, porque `events.insert` sí valida el
  `calendarId` y respondió `404 Not Found`.
- **Corrección:** decodificar el valor real de base64 y pegarlo en texto
  plano en `GOOGLE_CALENDAR_ID`. El valor correcto en este proyecto es un
  calendario **secundario** llamado "Landing-vsl" (no el calendario
  principal de la cuenta autorizada, `social@macondosoftwares.com`).
- **Lección para el futuro:** si `GET /calendar/disponibilidad` devuelve
  slots que no cuadran con lo que realmente hay en el calendario, sospechar
  primero de `GOOGLE_CALENDAR_ID` (typo, base64, o calendario equivocado)
  antes que de la lógica de horarios — `freebusy.query` falla en silencio
  para un `calendarId` inválido, no lanza excepción.

`reference/vturb-embed.txt` y `reference/google-calendar-setup.md` siguen
vacíos (0 bytes) — nadie ha pegado contenido ahí todavía.

---

## 3. Próximas fases (en orden)

1. **Integración real de Vturb** en `VturbPlayer.jsx` — **bloqueada,
   pendiente de que el PM entregue el código de embed** en
   `reference/vturb-embed.txt` (hoy vacío, 0 bytes). No hay nada que
   construir de este lado hasta que llegue ese contenido.
2. **Deploy** de `frontend/` y `backend/` a producción, por separado — sin
   definir ni probar todavía. Con el hardening de la Fase 8 (helmet, rate
   limiting, CORS restringido) ya es un mejor punto de partida para esto.

---

## 4. Próximas fases solicitadas (sin implementar, para retomar)

Pedidas por el usuario el 2026-08-12 para retomar en una sesión futura —
documentadas tal cual se pidieron, sin diseñar la implementación ni el
alcance exacto todavía. No confundir con la sección 3 (esas sí están listas
para construirse ya; estas necesitan más definición primero).

1. **Generador de URLs con UTMs preestablecidos** — herramienta dentro del
   CRM (`/crm`) para armar la URL de la landing con
   `utm_source`/`utm_medium`/`utm_campaign`/`utm_content` ya seleccionados
   desde un formulario, en vez de escribirlos a mano en Meta/LinkedIn Ads
   Manager.
2. **Vista de detalle de lead** — al hacer clic en un lead desde la tabla
   del CRM, ver más información y poder ir agregando datos adicionales
   (notas de seguimiento, historial de contacto, etc.). **Alcance exacto
   pendiente de definir.**
3. **Sistema de usuarios completo** — hoy el login es un solo admin
   hardcodeado en `ADMIN_USER`/`ADMIN_PASSWORD` (`.env`, Fase 6).
   Evolucionar a una tabla de usuarios en MySQL con roles (`admin`,
   `vendedor`), donde el admin pueda crear/gestionar cuentas de vendedores.
   **Pendiente definir** si cada vendedor debe ver solo sus leads asignados
   o todos.

---

## 5. Detalles técnicos para recordar

### Variables de entorno (`backend/.env`, plantilla en `.env.example`)
| Variable | Estado actual | Notas |
|---|---|---|
| `DB_HOST` | `localhost` | |
| `DB_PORT` | `3306` | |
| `DB_USER` | `root` | |
| `DB_PASSWORD` | vacío | MySQL local del usuario |
| `DB_NAME` | `vsl_macondo` | base real del proyecto, confirmada al día en sección 2 |
| `PORT` | `3099` | puerto del backend Express |
| `GOOGLE_CLIENT_ID` | configurada | credencial OAuth 2.0 tipo "Desktop app" |
| `GOOGLE_CLIENT_SECRET` | configurada | |
| `GOOGLE_REFRESH_TOKEN` | configurada | obtenida con `pnpm get-google-token` |
| `GOOGLE_CALENDAR_ID` | configurada | calendario secundario "Landing-vsl" de `social@macondosoftwares.com` (no `'primary'`) — ver el bug del valor en base64 en la sección 2 |
| `ADMIN_USER` | configurada | usuario único para entrar a `/crm` (Fase 6) |
| `ADMIN_PASSWORD` | configurada | contraseña de ese mismo usuario |
| `JWT_SECRET` | configurada | firma los JWT de sesión del CRM (expiran a las 8h) |
| `ALLOWED_ORIGINS` | no configurada (opcional) | orígenes permitidos por CORS, separados por coma; si se omite cae a `http://localhost:5173` (Fase 8) |

Frontend usa `VITE_API_URL` (opcional, `frontend/.env` / plantilla en
`frontend/.env.example`) para apuntar al backend; si no está definida, cae a
`http://localhost:3099` (ver fallback en `frontend/src/services/api.js`).

### Reglas de negocio hardcodeadas a tener en cuenta
- Horario de atención para disponibilidad: **lunes a viernes, 9:00-17:00,
  America/Bogota (offset fijo UTC-5), slots de 30 min, próximos 7 días
  hábiles.** Está en `backend/src/services/googleCalendar.service.js` como
  constantes (`BUSINESS_START_HOUR`, `BUSINESS_END_HOUR`, `SLOT_MINUTES`,
  `BUSINESS_DAYS_AHEAD`) — si el horario real de atención cambia, se edita
  ahí.
- `estado` de `leads` es un ENUM con 7 valores: `descalificado`,
  `calificado`, `agendado`, `con_requisitos`, `sin_requisitos_reunion`,
  `reunion_cierre`, `venta_servicio`. Los primeros 3 los pone el sistema
  (quiz, agendamiento); los últimos 4 se ponen manualmente desde el CRM
  (`/crm`, Fase 6) vía `PATCH /leads/:id/estado` — ese endpoint rechaza con
  `400` cualquier intento de poner los primeros 3 manualmente.
- `POST /leads` y `POST /calendar/agendar` recalculan/revalidan en servidor
  en vez de confiar en lo que manda el cliente (calificación del quiz,
  disponibilidad del slot) — decisión intencional de seguridad, no tocar sin
  razón.
- El CRM (`/crm`) tiene un solo usuario administrador (`ADMIN_USER` /
  `ADMIN_PASSWORD` en `.env`), no un sistema de usuarios — decisión
  intencional para mantenerlo simple. El token JWT se guarda solo en
  memoria (React Context), no en `localStorage`: si se recarga la página,
  hay que iniciar sesión de nuevo.

### Configuración de seguridad hardcodeada (Fase 8)
- Rate limits en `backend/src/middleware/rateLimit.js`: login 5 intentos /
  15 min por IP, `POST /leads` 20 / 15 min por IP — si hace falta ajustar
  los números, se edita ahí.
- CORS: orígenes permitidos vienen de `ALLOWED_ORIGINS` (`app.js`), coma-
  separado, default `http://localhost:5173` si no está seteada.
- `helmet()` con configuración por defecto, sin personalizar todavía.

### Puertos usados durante desarrollo (no fijos, solo referencia)
- Backend: `PORT=3099` en `.env` real del usuario. Durante las pruebas de
  Claude se usaron puertos alternos temporales (3097, 3098, etc., este
  último para probar el login de la Fase 6 con credenciales de prueba) para
  no chocar con el proceso que el usuario tenía corriendo — no quedó nada
  corriendo en segundo plano al cierre de cada fase.
- Frontend: sin puerto fijo, Vite por defecto (`5173`, o el siguiente libre
  si está ocupado).
