# Bitácora de estado — Proyecto VSL Macondo

Última actualización: 2026-08-17.

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

### Fase 9 — Sistema de usuarios con roles (`/crm/usuarios`)
- **Alcance definido por el usuario:** todos los usuarios (`admin` y
  `vendedor`) ven y editan todos los leads igual que antes, sin ninguna
  restricción por rol. La única diferencia entre roles es que **solo el
  admin puede crear/gestionar cuentas de usuario** — los vendedores no
  pueden crear otros usuarios. No hay leads asignados por vendedor; eso
  quedó explícitamente fuera de alcance (ver sección 4, ítem 3, ya
  marcado como resuelto).
- **Backend:**
  - Tabla `usuarios` agregada a `backend/src/db/schema.sql` (`CREATE TABLE
    IF NOT EXISTS`, no reemplazó nada existente): `id`, `nombre`, `email`
    (`UNIQUE`), `password_hash`, `rol` ENUM(`admin`, `vendedor`),
    `created_at`.
  - `bcrypt` agregado como dependencia nueva (`backend/package.json`).
    Necesitó `pnpm approve-builds bcrypt` porque compila un módulo nativo
    en su script `install` y pnpm 10+ bloquea esos scripts por defecto
    (protección de supply-chain). Quedó registrado en
    `backend/pnpm-workspace.yaml` (archivo nuevo, solo dos líneas:
    `allowBuilds: { bcrypt: true }`) — sin él, un `pnpm install` limpio en
    otra máquina volvería a bloquear la compilación de `bcrypt` y el login
    fallaría.
  - `backend/scripts/seed-admin.mjs` (nuevo, se corre una sola vez con
    `pnpm seed-admin` desde `backend/`): crea el primer usuario admin en
    la tabla `usuarios` a partir de `ADMIN_USER` (como email) y
    `ADMIN_PASSWORD` (`.env`), con `nombre = "Administrador"`. Seguro de
    re-correr: si ya existe un usuario con ese email, no hace nada.
  - `POST /auth/login` (`controllers/auth.controller.js`) reescrito por
    completo: ya no compara contra variables de entorno — busca el
    usuario por `email` en la tabla `usuarios` y compara el password con
    `bcrypt.compare`. Usa un hash "dummy" cuando el email no existe (se
    compara igual contra él) para que el tiempo de respuesta no delate
    qué emails están registrados. Firma el JWT con `{ sub, userId,
    nombre, rol }`; la respuesta ahora es `{ token, usuario: { id,
    nombre, rol } }`, no solo el token.
  - `backend/src/middleware/requireAdmin.js` (nuevo): reutiliza
    `requireAuth` y además exige `req.user.rol === 'admin'` (`403` si no).
  - CRUD `/usuarios` protegido con `requireAdmin`
    (`controllers/usuarios.controller.js` + `routes/usuarios.routes.js`,
    montado en `app.js`): `GET /usuarios` (nunca expone `password_hash`),
    `POST /usuarios` (hashea el password con bcrypt, `409` si el email ya
    existe), `PATCH /usuarios/:id` (nombre/rol/reset de password),
    `DELETE /usuarios/:id`. `PATCH` (al quitar el rol admin) y `DELETE`
    responden `400` si la operación dejaría la tabla sin ningún admin.
  - `GET`/`PATCH` de `leads` y `GET /dashboard` **sin cambios** — siguen
    protegidos con `requireAuth` genérico, no con `requireAdmin`:
    cualquier rol autenticado accede igual, según el alcance definido.
- **Frontend:**
  - `frontend/src/context/AuthContext.jsx`: ahora guarda también
    `usuario: { id, nombre, rol }` devuelto por el login, no solo el
    `token` (sigue en memoria, no en `localStorage`).
  - `frontend/src/pages/Usuarios.jsx` (nuevo, ruta `/crm/usuarios`):
    listado de usuarios con su rol, formulario de creación (nombre,
    email, password, rol), selector para cambiar rol y botón para
    eliminar. Protegida por rol: sin token muestra `Login`; si el usuario
    logueado es `vendedor`, redirige a `/crm` con un mensaje ("No tienes
    acceso a la sección de usuarios.") en vez de mostrar la página.
  - `frontend/src/pages/CRM.jsx`: agrega el saludo "Hola, [nombre]" y el
    link "Usuarios" en la navegación, visible **solo si**
    `usuario.rol === 'admin'`; muestra el mensaje de acceso denegado que
    llega por `location.state` al redirigir desde `/crm/usuarios`. No se
    tocó la lógica de leads de esta página.
  - `frontend/src/services/api.js`: `getUsuarios`, `createUsuario`,
    `updateUsuario`, `deleteUsuario` agregados (todas con el token en el
    header `Authorization`).
  - `frontend/src/App.jsx`: ruta `/crm/usuarios` agregada dentro del
    mismo `CrmLayout`/`AuthProvider` que `/crm` y `/crm/dashboard`.
- **Verificado el 2026-08-13 con una base de datos descartable** (creada,
  con el schema aplicado, y borrada al final del proceso — nunca se tocó
  `vsl_macondo` directamente): login con email/password correctos e
  incorrectos, login con email inexistente, `GET /usuarios` sin token
  (`401`), con token vendedor (`403`) y con token admin (`200`, sin
  `password_hash` en la respuesta), `POST /usuarios` con email duplicado
  (`409`), protección de "único admin" tanto en `DELETE` como al
  degradar el rol vía `PATCH`, que un vendedor sí puede seguir usando
  `GET /leads` y `GET /dashboard` sin restricción, y que un JWT emitido
  *antes* de una promoción de rol sigue actuando con el rol viejo hasta
  volver a iniciar sesión (comportamiento esperado de un JWT sin estado,
  no un bug).

### Fase 10 — Generador de URLs con UTMs preestablecidos (`/crm/generador-utm`)
- Herramienta dentro del CRM, accesible para **cualquier rol** (a
  diferencia de `/crm/usuarios`, que es solo admin) — arma la URL de la
  landing con UTMs ya seleccionados desde un formulario, en vez de
  escribirlos a mano en Meta/LinkedIn Ads Manager.
- **Backend:**
  - Tabla `utm_urls` agregada a `backend/src/db/schema.sql` (`CREATE
    TABLE IF NOT EXISTS`): `id`, `url_completa`, `utm_source`,
    `utm_medium`, `utm_campaign`, `utm_content` (nullable), `creado_por`
    (FK a `usuarios.id`), `created_at`. La FK **no tiene `ON DELETE`** a
    propósito — el default de InnoDB (`RESTRICT`) bloquea borrar un
    usuario que ya generó URLs en vez de decidir en silencio qué pasa
    con ese historial.
  - `GET /utm-urls` y `POST /utm-urls` (`controllers/utm.controller.js`
    + `routes/utm.routes.js`, montado en `app.js`), protegidos con
    `requireAuth` genérico (no `requireAdmin`): cualquier rol puede
    generar y ver el historial.
  - `GET /utm-urls` hace `JOIN` con `usuarios` para devolver el nombre
    de quien generó cada URL, ordenado por `created_at DESC, id DESC`
    (el `id` como desempate porque `created_at` es `DATETIME` —
    precisión de un segundo — y dos URLs generadas en el mismo segundo
    quedarían con orden ambiguo si solo se ordenara por fecha).
  - `POST /utm-urls` arma la URL completa contra el dominio base
    `https://www.macondosoftwares.com/vsl` (constante en el controller)
    y **deriva `utm_medium` de la plataforma** (`utm_source`), no lo
    recibe del cliente: `meta`, `linkedin`, `google_ads`, `tiktok_ads`
    → `cpc`; `organico` → `social` (ver la decisión abajo). Guarda
    `creado_por` con el usuario del token (`req.user.userId`).
- **Frontend:**
  - `frontend/src/pages/GeneradorUTM.jsx` (nuevo, ruta
    `/crm/generador-utm`): formulario (plataforma, campaña, content
    opcional) → `POST /utm-urls`, muestra la URL generada con botón
    "Copiar" (`navigator.clipboard`); debajo, tabla con el historial
    completo (`GET /utm-urls`) con su propio botón "Copiar" por fila.
  - `frontend/src/services/api.js`: `getUtmUrls`, `createUtmUrl`.
  - `frontend/src/App.jsx`: ruta `/crm/generador-utm`.
  - `frontend/src/pages/CRM.jsx`: link "Generar URL" en la navegación,
    visible para **cualquier rol** (a diferencia del link "Usuarios",
    que sigue condicionado a `rol === 'admin'`).
- **Decisión: `utm_medium=social` para `organico`, no `organic`.** Las 4
  plataformas de pauta (`meta`, `linkedin`, `google_ads`, `tiktok_ads`)
  usan `cpc`, la convención estándar de Google Analytics para tráfico
  pagado. Pero `utm_medium=organic` está reservado por convención para
  tráfico de buscador (Google/Bing) que GA ya detecta solo por el
  referrer — taguearlo a mano ahí puede pisar esa detección automática
  en vez de sumar información nueva. Como `organico` acá representa
  compartir el link **sin pauta** en redes (bio, post, story), `social`
  es la etiqueta que realmente lo describe, y es consistente con el
  mismo canal que las otras 4 opciones, solo que sin pago.
- **Verificado con una base de datos descartable** (creada, con el
  schema aplicado, y borrada al final — nunca se tocó `vsl_macondo`
  directamente): login, `GET /utm-urls` sin token (`401`) y con token
  (`200`), `POST /utm-urls` deriva `cpc`/`social` correctamente según la
  plataforma, arma la URL completa con y sin `utm_content`, incluye el
  nombre del creador en la respuesta, rechaza `utm_source` inválido y
  `utm_campaign` vacío (`400` en ambos), y el historial queda ordenado
  más reciente primero incluso con registros creados en el mismo
  segundo.

### Fase 11 — Ajustes al formulario de calificación y al modelo de datos
- Ajustes pedidos por el jefe/PM: campo `empresa`, checkbox de tratamiento
  de datos, tabla `contactos` separada para quienes descalifican en el
  quiz, y niveles de `prioridad` en vez de un simple booleano `calificado`.
- **Base de datos:**
  - Tabla nueva `contactos` en `schema.sql`: misma info de contacto que
    `leads` (nombre, email, telefono, empresa, utms) pero sin el pipeline
    de ventas (`estado`) — en su lugar `motivo_descalificacion` (texto) y
    `contactado` (boolean, default false, para que el equipo marque cuando
    ya lo llamaron).
  - `leads` gana `empresa` (VARCHAR NOT NULL), `prioridad` (ENUM:
    `alta`/`media_alta`/`en_revision`, NOT NULL), `tratamiento_datos_aceptado`
    (BOOLEAN NOT NULL) y `tratamiento_datos_fecha` (DATETIME). Los mismos
    dos últimos campos también en `contactos`.
  - Como `leads` ya existía en `vsl_macondo` real, `schema.sql` incluye un
    bloque de migración `ALTER TABLE` comentado al final (el `CREATE TABLE
    IF NOT EXISTS` no toca una tabla existente) — se probó contra una tabla
    simulando el esquema real antes de dejarlo documentado, para confirmar
    que corre limpio con datos existentes.
- **Backend (`qualification.service.js` reescrito):**
  - Pregunta 2 (proveedor de nube): se agregan IBM Cloud y Huawei Cloud
    como opciones que califican; "Otros proveedores / Hosting tradicional"
    pasa a descalificar, con un campo `detalle` de texto libre opcional que
    se incorpora al motivo de descalificación.
  - Pregunta 4 (industria): ya no es un simple sí/no — define `prioridad`
    cuando el lead califica: "Software/SaaS/Plataformas Digitales" y
    "Servicios de TI/BPO/Contact Centers" → `alta`; "FinTech/E-commerce/
    AdTech" → `media_alta`; "Comercio/Retail/Servicios Tradicionales" →
    descalifica; "Otro sector" → `en_revision` (sigue calificando, pero
    queda marcado para revisión manual).
  - `POST /leads` (`leads.controller.js`) ahora valida `empresa` y
    `tratamiento_datos_aceptado` como requeridos (`400` si faltan). Si el
    resultado descalifica (por cualquiera de las 4 preguntas), inserta en
    `contactos` en vez de `leads`, con el motivo armado a partir de las
    respuestas que descalificaron. Si califica, inserta en `leads` como
    antes, guardando también `prioridad`.
  - `GET /contactos` (nuevo, `contactos.controller.js` +
    `contactos.routes.js`, montado en `app.js`), protegido con el mismo
    `requireAuth` genérico que `/leads` — para poder listarlos después en
    el CRM (todavía sin UI para esto, ver sección 4, ítem 6).
- **Frontend (`QuizPopup.jsx`):**
  - Paso de contacto (paso 0) gana el campo "Empresa" (requerido) y un
    checkbox "Acepto el tratamiento de mis datos personales..." (requerido
    para poder avanzar).
  - Pregunta 2 actualizada con IBM Cloud, Huawei Cloud, y un campo de texto
    libre condicional que aparece solo al elegir "Otros proveedores /
    Hosting tradicional".
  - El payload final incluye `empresa` y `tratamiento_datos_aceptado: true`;
    la fecha/hora de aceptación (`tratamiento_datos_fecha`) la genera el
    backend al momento de insertar, no el cliente.
- Verificado con una base de datos descartable (creada, poblada y borrada
  al final — nunca se tocó `vsl_macondo` directamente): caso de prioridad
  alta (Software/SaaS) → `leads`; caso en_revisión ("Otro sector") →
  `leads`; caso descalifica (proveedor "Otros/Hosting" con detalle +
  industria "Comercio/Retail") → `contactos`, con el motivo listando ambas
  razones y el detalle del proveedor incluido. También se probó la
  migración `ALTER TABLE` contra una tabla simulando el esquema real de
  `vsl_macondo`, y las validaciones `400` de `empresa`/
  `tratamiento_datos_aceptado` faltantes.

### Fase 12 — Vista de detalle de lead (`/crm/leads/:id`)
- Alcance confirmado con el usuario: nombre, email, teléfono, empresa + las
  4 respuestas del quiz. Solo para `leads`, no para `contactos` (eso se
  trabaja aparte, ver sección 4, ítem 6).
- **Backend:** `GET /leads/:id` (nuevo, protegido con `requireAuth`
  genérico, cualquier rol) en `leads.controller.js` + `leads.routes.js`:
  devuelve el lead completo (incluyendo `empresa`, `prioridad`, utms,
  `estado`, `calendar_event_id`) más sus respuestas de `respuestas_quiz`
  (`pregunta` + `respuesta`). `404` si no existe, `400` si el id no es un
  entero válido.
- **Frontend:**
  - `frontend/src/services/api.js`: `getLeadDetalle(token, id)`.
  - `frontend/src/pages/CRM.jsx`: el nombre de cada lead en la tabla ahora
    es un link a `/crm/leads/:id` (única modificación a este archivo en
    esta fase).
  - `frontend/src/pages/LeadDetalle.jsx` (nuevo): datos de contacto, origen
    (UTMs), badges de estado y prioridad (mismo estilo visual que la tabla
    de leads), las 4 respuestas del quiz en formato legible (pregunta →
    respuesta, no JSON crudo), aviso de si ya tiene reunión agendada (sin
    el link de Meet — eso se toca en la Fase 15), y botón "Volver a leads".
  - `frontend/src/App.jsx`: ruta `/crm/leads/:id` agregada dentro del mismo
    `CrmLayout`/`AuthProvider` que el resto del CRM.
- Verificado con una base de datos descartable (creada, poblada y borrada
  al final — nunca se tocó `vsl_macondo`): `GET /leads/1` con detalle
  completo + respuestas, `GET /leads/999` → `404`, sin token → `401`, id
  inválido → `400` (todo vía curl); y en navegador real contra esa misma
  base de prueba: login → tabla de leads → clic en el nombre → detalle con
  badges, UTMs y respuestas del quiz renderizados correctamente → "Volver a
  leads".

### Fase 13 — Escasez y horarios restringidos para el calendario
- Objetivo: dar sensación de escasez en los horarios de reserva, reflejar
  un tiempo de preparación real antes de una llamada, y sacar los festivos
  de Colombia del código a una tabla editable.
- Horario reservable: solo **10:00am-12:00pm y 2:00pm-4:00pm** (slots de
  30 min, igual que antes). Los bloques 9:00-10:00am, 12:00-2:00pm y
  4:00-5:00pm ya no se ofrecen como reservables ni se consultan contra
  Google Calendar — simplemente no existen como opción.
  - **Corrección a una contradicción en el pedido original:** la regla del
    horario reservable decía "10:00am-12:00pm y 2:00pm-**5:00pm**", pero la
    regla de bloques excluidos pedía excluir justo 4:00-5:00pm — ambas no
    podían ser ciertas a la vez. Se confirmó con el usuario y quedó la
    tarde reservable en **2:00pm-4:00pm** (no 5:00pm), la que parte el día
    9am-5pm original en bloques reservables/excluidos sin huecos ni
    superposición.
- Colchón de preparación: 1 día hábil se salta por completo antes de
  empezar a ofrecer horarios (si hoy es día X, el primer día mostrado es
  X + 2 días hábiles, no X + 1).
- Se muestran los siguientes 4 días hábiles a partir de ahí, sin contar
  fines de semana ni festivos.
- Festivos de Colombia en tabla nueva `festivos_colombia` (`fecha` DATE
  UNIQUE, `descripcion` VARCHAR) en `schema.sql`, en vez de hardcodeados en
  el código — así se pueden agregar/corregir desde la base de datos sin
  tocar código cada año. `INSERT IGNORE` inicial con los 17 festivos de
  2026 que el usuario confirmó.
  - **Pendiente aparte:** falta agregar el festivo "Virgen de
    Chiquinquirá" a `festivos_colombia` — su fecha exacta está en disputa
    entre fuentes (9 o 13 de julio). El usuario la va a verificar y pasar
    el INSERT exacto para agregarla después; no adivinar la fecha.
- `backend/src/services/googleCalendar.service.js`: la generación de slots
  candidatos ahora consulta `festivos_colombia`, aplica el colchón de 1 día
  hábil, limita a 4 días hábiles de exhibición, y usa las 2 franjas
  horarias en vez de 9-5 corrido. No se tocó la lógica de
  `freebusy.query`/`isSlotFree`/`createCalendarEvent` — el cruce contra
  disponibilidad real de Google Calendar sigue igual, solo cambió el
  universo de slots candidatos antes de cruzarlos.
- Verificado con una base de datos descartable (creada y borrada al final;
  no se escribió en `vsl_macondo` directamente — sí se hicieron lecturas
  reales de solo lectura, `freebusy.query`, contra el Google Calendar real,
  igual que en la Fase 4). Con el reloj real del sistema en lunes 17 de
  agosto de 2026 (Bogotá), los días mostrados fueron el 19, 20, 21 y 24 de
  agosto (se saltó el 18 como colchón de preparación y el fin de semana
  22-23), cada uno con los horarios 10:00, 10:30, 11:00, 11:30, 14:00,
  14:30, 15:00 y 15:30. Se probó también forzando un festivo falso sobre lo
  que habría sido el primer día mostrado (19 de agosto): la ventana completa
  de 4 días se corrió correctamente a 20, 21, 24 y 25 de agosto, confirmando
  que los festivos se excluyen igual que los fines de semana tanto en el
  colchón como en los días exhibidos.

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

Pedidas por el usuario para retomar en una sesión futura — documentadas tal
cual se pidieron, sin diseñar la implementación ni el alcance exacto
todavía salvo que se indique lo contrario. No confundir con la sección 3
(esas sí están listas para construirse ya; estas necesitan más definición
primero). De los 8 ítems, quedan pendientes el 4 al 8.

1. **Generador de URLs con UTMs preestablecidos — completada en la Fase
   10** (ver sección 1). Página `/crm/generador-utm`, accesible para
   cualquier rol (no solo admin), con historial de URLs generadas.
2. **Vista de detalle de lead — completada en la Fase 12** (ver sección 1).
   Página `/crm/leads/:id`: datos de contacto, empresa, origen (UTMs),
   badges de estado y prioridad, y las 4 respuestas del quiz. Solo para
   `leads`, no para `contactos` (eso se trabaja aparte, ver ítem 6).
3. **Sistema de usuarios completo — completada en la Fase 9** (ver
   sección 1). Se implementó la tabla `usuarios` en MySQL con roles
   (`admin`, `vendedor`); el admin puede crear/gestionar cuentas desde
   `/crm/usuarios`. Se resolvió la pregunta que había quedado pendiente:
   **todos los roles ven y editan todos los leads sin restricción** — no
   hay leads asignados por vendedor.
4. **Fase 14 — Notificaciones por correo + Google Chat.** No iniciada.
   Alcance exacto (qué eventos disparan notificación, a quién, con qué
   contenido) todavía sin definir.
5. **Fase 15 — Cambiar el botón "Unirme por Google Meet" por "Agregar a
   mi calendario".** No iniciada. El link de Meet actual se reemplaza por
   un link pre-rellenado de Google Calendar. El usuario indicó que ya
   tiene definida la solución técnica a usar, pendiente de detallar en una
   sesión futura.
6. **Filtro de preguntas en descalificados/contactos.** No iniciada.
   Alcance exacto pendiente de definir.
7. **Ajuste de UI: detalle de lead como modal.** No iniciada. Cambiar
   `/crm/leads/:id` (Fase 12, ítem 2 de esta lista) de página completa a
   modal sobre la tabla de leads.
8. **Ajuste de UI: columna "Prioridad" en vez de "Origen" en la tabla de
   leads.** No iniciada. En `/crm` (`CRM.jsx`), quitar la columna Origen
   (`utm_source`) y mostrar `prioridad` (Fase 11) en su lugar.

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
| `ADMIN_USER` | configurada | ya NO se lee en cada login (Fase 9) — solo la usa `backend/scripts/seed-admin.mjs`, una vez, como email del primer admin sembrado en la tabla `usuarios` |
| `ADMIN_PASSWORD` | configurada | ídem: solo la usa `seed-admin.mjs`, como password de ese primer admin |
| `JWT_SECRET` | configurada | firma los JWT de sesión del CRM (expiran a las 8h) |
| `ALLOWED_ORIGINS` | no configurada (opcional) | orígenes permitidos por CORS, separados por coma; si se omite cae a `http://localhost:5173` (Fase 8) |

Frontend usa `VITE_API_URL` (opcional, `frontend/.env` / plantilla en
`frontend/.env.example`) para apuntar al backend; si no está definida, cae a
`http://localhost:3099` (ver fallback en `frontend/src/services/api.js`).

### Reglas de negocio hardcodeadas a tener en cuenta
- Horario de atención para disponibilidad (actualizado en la Fase 13):
  **lunes a viernes, 10:00-12:00 y 2:00-4:00pm, America/Bogota (offset fijo
  UTC-5), slots de 30 min.** Colchón de 1 día hábil antes de empezar a
  ofrecer horarios, y se muestran 4 días hábiles a partir de ahí, excluyendo
  fines de semana y los festivos de la tabla `festivos_colombia`. Está en
  `backend/src/services/googleCalendar.service.js` como constantes
  (`BUSINESS_WINDOWS`, `SLOT_MINUTES`, `PREP_BUSINESS_DAYS`,
  `DISPLAY_BUSINESS_DAYS`) — si el horario real de atención cambia, se edita
  ahí. Los festivos se editan en la tabla `festivos_colombia`, no en el
  código (ver Fase 13 en sección 1, incluye el pendiente de agregar
  "Virgen de Chiquinquirá").
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
- El CRM (`/crm`) tiene usuarios reales en la tabla `usuarios`, con dos
  roles: `admin` y `vendedor` (Fase 9) — ya no es un solo admin
  hardcodeado en `.env` (eso era la Fase 6). Ambos roles ven y editan
  todos los leads igual, sin ninguna restricción; la única diferencia es
  que solo `admin` puede crear/gestionar cuentas de usuario
  (`/crm/usuarios`). El token JWT se guarda solo en memoria (React
  Context), no en `localStorage`: si se recarga la página, hay que
  iniciar sesión de nuevo.

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
