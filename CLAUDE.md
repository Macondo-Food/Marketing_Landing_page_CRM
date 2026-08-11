# Bitácora de estado — Proyecto VSL Macondo

Última actualización: 2026-08-10.

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
  real todavía. Ver TODO exacto abajo (sección 4).

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
  con `pnpm get-google-token` desde `backend/`. Detalle completo en la
  sección 2.

---

## 2. Pendiente de verificación / a medias

- **`GOOGLE_REFRESH_TOKEN` aún no generado.** `backend/.env` todavía no
  tiene ninguna variable `GOOGLE_*` (confirmado al revisar el archivo hoy).
  Pasos manuales pendientes en Google Cloud Console:
  1. Crear/seleccionar un proyecto y habilitar la **Google Calendar API**.
  2. Configurar la pantalla de consentimiento OAuth (modo "Testing" alcanza;
     agregar la cuenta de Google que recibirá las reuniones como test user).
  3. Crear credenciales **OAuth 2.0 Client ID → tipo "Desktop app"** (permite
     redirects a `localhost:<cualquier puerto>` sin whitelistear la URI
     exacta).
  4. Poner `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `backend/.env`.
  5. Correr `cd backend && pnpm get-google-token`, abrir la URL impresa,
     autorizar, copiar el `GOOGLE_REFRESH_TOKEN` que imprime la terminal a
     `backend/.env`.
- **Por lo anterior, `GET /calendar/disponibilidad` y `POST
  /calendar/agendar` nunca se probaron con credenciales reales de Google.**
  Solo se verificó que:
  - la lógica de cálculo de slots (fechas/horario) es correcta, de forma
    aislada;
  - ambos endpoints fallan de forma controlada (400/401/500), sin tumbar el
    servidor, cuando las credenciales de Google faltan o son inválidas;
  - la validación de estado del lead (descalificado / ya agendado) sí se
    probó de punta a punta contra una base de datos descartable.
- **No confirmado si `schema.sql` ya corrió contra `vsl_macondo`** (la base
  real, según `backend/.env`). Se le pidió al usuario correrlo manualmente
  al cierre de la Fase 3, pero no hubo confirmación explícita en la
  conversación. **Importante:** el `schema.sql` actual incluye el ajuste del
  `ENUM estado` con `'calificado'` (agregado después del pedido inicial de
  correrlo). Si `vsl_macondo` ya tiene la tabla `leads` creada con una
  versión **anterior** del ENUM (sin `'calificado'`, con `estado` nullable),
  hay que correr un `ALTER TABLE` para actualizarla — insertar un lead
  calificado fallaría con esa tabla desactualizada. Verificar esto antes de
  seguir.
- `reference/vturb-embed.txt` y `reference/google-calendar-setup.md` siguen
  vacíos (0 bytes) — nadie ha pegado contenido ahí todavía.

---

## 3. Próximas fases (en orden)

1. **Conectar `QuizPopup.jsx` con `POST /leads` real** — hoy solo hace
   `console.log` del payload (ver TODO exacto en sección 4). Es el paso
   lógico antes de tocar `ScheduleSlots`, porque ese componente va a
   necesitar el `leadId` que devuelve `POST /leads`.
2. **Construir `ScheduleSlots.jsx` real** y conectarlo a `GET
   /calendar/disponibilidad` (listar horarios) y `POST /calendar/agendar`
   (confirmar), reemplazando el placeholder de texto que hoy muestra
   `QuizPopup.jsx` en el paso de resultado calificado.
3. **CRM básico**: vista para listar leads (ya existe `GET /leads` en el
   backend) y cambiar `estado` manualmente entre `con_requisitos`,
   `sin_requisitos_reunion`, `reunion_cierre`, `venta_servicio`. Falta el
   endpoint de actualización de estado en el backend (no existe todavía,
   solo lectura) y toda la UI.
4. **Dashboard** con % de respuestas por pregunta, agregando la tabla
   `respuestas_quiz` (sección 7 del plan). No hay ningún endpoint de
   dashboard construido todavía.
5. **Integración real de Vturb** en `VturbPlayer.jsx`, en cuanto llegue el
   código de embed a `reference/vturb-embed.txt` (hoy vacío).
6. **Deploy** de `frontend/` y `backend/` por separado — sin definir ni
   probar todavía.

---

## 4. Detalles técnicos para recordar

### Variables de entorno (`backend/.env`, plantilla en `.env.example`)
| Variable | Estado actual | Notas |
|---|---|---|
| `DB_HOST` | `localhost` | |
| `DB_PORT` | `3306` | |
| `DB_USER` | `root` | |
| `DB_PASSWORD` | vacío | MySQL local del usuario |
| `DB_NAME` | `vsl_macondo` | ver pendiente de verificación arriba |
| `PORT` | `3099` | puerto del backend Express |
| `GOOGLE_CLIENT_ID` | **no configurada** | |
| `GOOGLE_CLIENT_SECRET` | **no configurada** | |
| `GOOGLE_REFRESH_TOKEN` | **no configurada** | ver sección 2 |
| `GOOGLE_CALENDAR_ID` | no configurada (default `'primary'` si se omite) | |

Frontend no usa variables de entorno todavía (no hay `services/api.js` ni
ninguna llamada real al backend — ver TODO abajo).

### TODOs explícitos en el código
- `frontend/src/components/QuizPopup.jsx:153` —
  `// TODO: enviar a POST /leads cuando exista el backend.` El payload ya
  tiene la forma correcta (`respuestas` como arreglo
  `[{ pregunta, respuesta }, ...]`, confirmado compatible con lo que espera
  el controller). Falta reemplazar el `console.log` por un `fetch` real y
  manejar la respuesta `{ calificado, leadId }` (guardar `leadId` en estado
  para pasarlo a `ScheduleSlots` cuando exista).

### Reglas de negocio hardcodeadas a tener en cuenta
- Horario de atención para disponibilidad: **lunes a viernes, 9:00-17:00,
  America/Bogota (offset fijo UTC-5), slots de 30 min, próximos 7 días
  hábiles.** Está en `backend/src/services/googleCalendar.service.js` como
  constantes (`BUSINESS_START_HOUR`, `BUSINESS_END_HOUR`, `SLOT_MINUTES`,
  `BUSINESS_DAYS_AHEAD`) — si el horario real de atención cambia, se edita
  ahí.
- `estado` de `leads` es un ENUM con 7 valores: `descalificado`,
  `calificado`, `agendado`, `con_requisitos`, `sin_requisitos_reunion`,
  `reunion_cierre`, `venta_servicio` — sin la Fase 5 (CRM), los últimos 4 no
  los pone nadie todavía (no hay UI ni endpoint para eso).
- `POST /leads` y `POST /calendar/agendar` recalculan/revalidan en servidor
  en vez de confiar en lo que manda el cliente (calificación del quiz,
  disponibilidad del slot) — decisión intencional de seguridad, no tocar sin
  razón.

### Puertos usados durante desarrollo (no fijos, solo referencia)
- Backend: `PORT=3099` en `.env` real del usuario. Durante las pruebas de
  Claude se usaron puertos alternos temporales (3097, 3098, etc.) para no
  chocar con el proceso que el usuario tenía corriendo — no quedó nada
  corriendo en segundo plano al cierre de cada fase.
- Frontend: sin puerto fijo, Vite por defecto (`5173`, o el siguiente libre
  si está ocupado).
