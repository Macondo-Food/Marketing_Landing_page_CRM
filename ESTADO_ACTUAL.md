# Estado actual del proyecto — Auditoría de código (2026-08-19)

Este documento es independiente de `CLAUDE.md`. `CLAUDE.md` es la bitácora
narrada sesión a sesión (puede quedar desactualizada si una sesión se corta
a medias); este documento es el resultado de **leer el código real de punta
a punta** — cada rama de cada controller, cada servicio, el `schema.sql`
completo y todas las páginas/componentes del frontend — para decidir cómo
cerrar el proyecto. Donde los dos difieren, este documento refleja lo que
el código hace hoy, no lo que se documentó que se hizo.

---

## Resumen ejecutivo

VSL Macondo es un embudo de captación de leads en dos apps independientes:
una landing tipo VSL con quiz de calificación y agendamiento automático en
Google Calendar (`frontend/`), y un mini CRM con login por roles, pipeline
manual, dashboard y herramientas de atribución (`backend/` + rutas `/crm/*`
del mismo frontend). El flujo de negocio de punta a punta (landing → quiz →
calificación en servidor → agendar/descartar → CRM) está completo y
funciona con datos e integraciones reales (MySQL, Google Calendar). Falta
por completo el video real (Vturb, bloqueado por el PM), el webhook al CRM
externo recién quedó conectado en código pero sin URL real configurada ni
probado en vivo, y no existe ningún plan ni configuración de deploy.

---

## Funcionalidades completamente terminadas y verificadas

### Landing
- Landing reconstruida en React (Vite), fiel al diseño original, con
  captura de UTMs (`utm_source/medium/campaign/content/term`) en
  `localStorage` al cargar la página (`frontend/src/utils/utm.js`).
- Reemplaza el set completo de UTMs si la URL trae uno nuevo (no mezcla dos
  campañas).

### Quiz y calificación
- `QuizPopup.jsx`: paso de contacto (nombre, email, teléfono, **empresa**,
  checkbox de tratamiento de datos, los dos obligatorios) + 4 preguntas del
  quiz, con back/next preservando respuestas previas.
- La pregunta de proveedor de nube tiene el campo de texto libre condicional
  ("¿Cuál proveedor usas?") cuando se elige "Otros proveedores / Hosting
  tradicional", y la de cargo incluye la opción "Otro rol dentro de la
  empresa".
- **La lógica de descalificación del frontend está sincronizada con la
  corrección de la Fase 16**: solo presupuesto (`inversion_nube`) y cargo
  (`cargo`) pueden descalificar; proveedor de nube e industria ya no
  descalifican bajo ninguna opción. Verificado línea por línea contra
  `backend/src/services/qualification.service.js` — ambos archivos
  coinciden opción por opción.
- `qualification.service.js` reevalúa todo en servidor (nunca confía en el
  flag `descalifica` que manda el cliente); cada opción trae un `codigo` en
  inglés fijo (p.ej. `TECH_LEAD`, `SOFTWARE_SAAS`) usado por el webhook.
  Prioridad de 4 niveles (`vip` / `alta` / `media_baja` / `en_revision`),
  donde presupuesto "Más de $10,000 USD/mes" siempre gana como `vip` sin
  importar la industria. Probado en esta sesión con dos casos reales
  (califica con prioridad alta, descalifica por presupuesto+cargo) — ver el
  JSON de ejemplo más abajo en "Webhook".
- `POST /leads` valida `empresa` y `tratamiento_datos_aceptado`, inserta en
  `contactos` si descalifica (con `motivo_descalificacion` legible) o en
  `leads` si califica (con `prioridad`), en ambos casos guardando los UTMs
  completos incluyendo `utm_term`. Rate limit de 20 req/15 min por IP.

### Calendario
- `googleCalendar.service.js`: solo 2 franjas horarias reservables
  (10:00-12:00 y 14:00-16:00), colchón de 1 día hábil antes de empezar a
  ofrecer horarios, 4 días hábiles exhibidos, festivos leídos de la tabla
  `festivos_colombia` (17 festivos de 2026 ya insertados) y excluidos igual
  que un fin de semana. America/Bogota tratado como offset fijo UTC-5.
- `GET /calendar/disponibilidad` cruza los slots candidatos contra
  `freebusy.query` real de Google. `POST /calendar/agendar` revalida el
  slot puntual justo antes de crear el evento (`409` si alguien más lo tomó
  primero), bloquea agendar dos veces el mismo lead o un lead descalificado
  (`400` en ambos casos), y crea el evento con Google Meet automático.
- Frontend (`ScheduleSlots.jsx`) agrupa por día en hora Bogotá, maneja el
  `409` recargando disponibilidad automáticamente, y muestra el link de
  Meet al confirmar.

### CRM — autenticación y usuarios
- Login real contra la tabla `usuarios` (`bcrypt.compare`, con hash dummy
  para no filtrar por timing qué emails existen), JWT de 8h guardado solo
  en memoria (`AuthContext`, nunca `localStorage`). Rate limit 5/15 min.
- Roles `admin`/`vendedor`: ambos ven y editan todos los leads igual; solo
  `admin` accede a `/crm/usuarios` (protegido también en frontend, con
  redirect + mensaje si un vendedor intenta entrar).
- CRUD de usuarios (`usuarios.controller.js`) con protección de "no dejar
  la tabla sin ningún admin" tanto en `DELETE` como al quitar el rol vía
  `PATCH`.

### CRM — leads, dashboard, generador de UTMs
- `GET/PATCH /leads`, `GET /leads/:id`: todos protegidos con `requireAuth`;
  `PATCH /leads/:id/estado` solo acepta los 4 estados manuales del pipeline
  (`400` si se intenta setear un estado que pone el sistema).
- `GET /dashboard`: resumen (total, % calificados, % agendado-o-superior) +
  barras por pregunta, con el `%` calculado sobre el total de esa pregunta
  específica, no el total general — confirmado en el código
  (`dashboard.controller.js`).
- `/crm/generador-utm`: formulario completo con plataforma → `utm_medium`
  derivado en servidor (no lo manda el cliente), campo `utm_term` agregado
  de punta a punta (formulario → `POST /utm-urls` → columna en `utm_urls`
  → tabla de historial), historial con botón "Copiar" y nombre de quien
  generó cada URL.
- `/crm/leads/:id`: contacto, empresa, UTMs (salvo `utm_term`, ver más
  abajo), badges de estado y prioridad, las 4 respuestas del quiz, aviso de
  si ya tiene reunión agendada.

### Webhook (conectado en esta sesión)
- `leads.controller.js` ahora importa y llama a `enviarWebhookLead(...)` en
  ambas ramas de `POST /leads` (califica → inserta en `leads`; descalifica
  → inserta en `contactos`), pasando contacto, respuestas evaluadas,
  `calificado`, `prioridad` y UTMs. Es fire-and-forget: nunca lanza ni
  bloquea la respuesta al cliente si el CRM externo falla.
- Probado en esta sesión (sin `WEBHOOK_CRM_URL` configurada, así que solo
  hizo `console.log` del payload) con un caso que califica y uno que
  descalifica — ambos armaron el JSON esperado (`event`, `form_id`,
  `contact`, `qualification_data` con los códigos en inglés,
  `qualification_status`, `priority_tier`, `attribution` con las 5 UTMs).

---

## Funcionalidades a medias o con pendientes menores

- **Webhook — falta la URL real y una prueba en vivo.** El código está
  conectado y se probó con datos sintéticos localmente, pero
  `WEBHOOK_CRM_URL` está vacía en `.env.example` y no hay evidencia en el
  código ni en la bitácora de que se haya hecho un `POST` real contra el
  CRM externo. Falta: (1) que el usuario configure la URL real en
  `backend/.env`, (2) una prueba end-to-end creando un lead real y
  confirmando que el CRM externo lo recibe bien.
- **`utm_term` no se muestra en `/crm/leads/:id`.** Se captura, se guarda
  en `leads`/`contactos`/`utm_urls` y se usa en el webhook, pero la tarjeta
  "Origen" de `LeadDetalle.jsx` solo muestra `utm_source`, `utm_medium`,
  `utm_campaign` y `utm_content` — falta agregar el campo `utm_term` (una
  línea).
- **El `detalle` libre de "Otros proveedores / Hosting tradicional" no se
  persiste cuando el lead califica.** Si un lead califica y había elegido
  esa opción con un detalle (p.ej. "DigitalOcean"), ese texto viaja al
  webhook pero **no se guarda en ninguna columna de `respuestas_quiz`**
  (esa tabla solo tiene `pregunta`, `respuesta`, `descalifica` — no hay
  columna `detalle` en `schema.sql`). Si el webhook falla o no está
  configurado, ese dato se pierde sin quedar en ningún lado de la base de
  datos. Cuando el lead descalifica sí queda preservado, dentro del texto
  de `motivo_descalificacion`.
- **Migración de `prioridad` en la base de datos real (`vsl_macondo`) sin
  confirmar como ejecutada.** `schema.sql` documenta el `ALTER TABLE` en 3
  pasos para pasar el ENUM de `prioridad` de
  `('alta','media_alta','en_revision')` a
  `('vip','alta','media_baja','en_revision')`, pero es un bloque comentado
  que el usuario debe correr a mano — no hay forma de confirmar desde el
  código si ya se ejecutó contra la base real. **Si no se ha corrido, todo
  `INSERT INTO leads` con prioridad `vip` o `media_baja` va a fallar** (el
  ENUM viejo no acepta esos valores). Mismo caso para las columnas nuevas
  `utm_term` en `leads`/`contactos`/`utm_urls`.
- **Festivo "Virgen de Chiquinquirá" pendiente en `festivos_colombia`.**
  Fecha en disputa entre fuentes (9 o 13 de julio); documentado como
  pendiente desde la Fase 13, sigue sin el `INSERT` correspondiente.

---

## Bloqueados por terceros

- **Video real de Vturb** (`VturbPlayer.jsx` es un placeholder que abre el
  quiz al hacer clic). Bloqueado en que el PM entregue el código de embed
  — `reference/vturb-embed.txt` sigue en 0 bytes.
- **`reference/google-calendar-setup.md` sigue en 0 bytes** — no bloquea
  nada funcional (el calendario ya está integrado y probado con cuenta
  real), pero si alguien más necesita replicar la configuración de Google
  Cloud/OAuth no hay documentación escrita, solo lo que vive en
  `backend/scripts/get-refresh-token.mjs` y la bitácora.
- **URL real del webhook del CRM externo** (`WEBHOOK_CRM_URL`) — sin ella,
  el sistema nunca deja de estar en modo "solo `console.log`".
- **Fecha exacta del festivo "Virgen de Chiquinquirá"** — el usuario dijo
  que la verificaría y pasaría el `INSERT` exacto.
- **Documento "Especificaciones Técnicas" del PM que definió la corrección
  de la Fase 16** (códigos en inglés, reglas de descalificación, tiers de
  prioridad) — se referencia en comentarios del código
  (`qualification.service.js`, `webhook.service.js`) pero **el documento en
  sí no existe como archivo en el repositorio**; toda la implementación se
  basa en lo que se transcribió en una sesión anterior. Si hace falta
  auditar la implementación contra el original, no hay dónde compararla
  dentro del proyecto.

---

## No iniciados

1. **Notificaciones por correo + Google Chat (Fase 14).** Solo se
   construyó la mitad "webhook a CRM externo"; no hay ningún código de
   envío de email (no hay `nodemailer` ni proveedor similar en
   `package.json`) ni integración con Google Chat (`chat.googleapis.com`)
   en ningún archivo del backend. El alcance exacto (qué eventos, a quién,
   con qué contenido) tampoco está definido.
2. **Botón "Agregar a mi calendario" en vez de "Unirme por Google Meet".**
   `ScheduleSlots.jsx` línea ~159 sigue mostrando el link de Meet tal cual
   lo devuelve Google Calendar; no hay ningún link pre-rellenado de Google
   Calendar en el código.
3. **Vista/UI para `contactos` (leads descalificados).** El backend existe
   y está protegido (`GET /contactos` en `contactos.controller.js` +
   `contactos.routes.js`), pero no hay ningún `Contactos.jsx` ni ruta
   `/crm/contactos` en `App.jsx` — nadie puede ver esos registros desde el
   CRM todavía. El "filtro de preguntas en descalificados/contactos"
   pedido tampoco tiene ningún código de por medio.
4. **Detalle de lead como modal.** `/crm/leads/:id` sigue siendo una
   página completa (`LeadDetalle.jsx`), no un modal sobre la tabla de
   `CRM.jsx`.
5. **Columna "Prioridad" en vez de "Origen" en la tabla de leads.**
   `CRM.jsx` (línea ~267 y ~283) sigue mostrando `utm_source` como columna
   "Origen"; `lead.prioridad` no se consulta ni se muestra ahí (sí llega
   del backend en `GET /leads/:id`, pero `GET /leads` — el que alimenta la
   tabla — ni siquiera selecciona la columna `prioridad`, solo la trae
   `calificado`).
6. **Deploy a producción.** No existe ningún `Dockerfile` propio (el único
   que aparece es interno de una dependencia de `node_modules`, no
   cuenta), ni carpeta `.github/workflows`, ni script de build/deploy más
   allá de los `vite build` / `node src/app.js` por defecto de cada
   scaffold. No hay ninguna decisión tomada sobre dónde ni cómo desplegar
   cada app.

---

## Deuda técnica o decisiones pendientes de confirmar

- **`WEBHOOK_FORM_ID = 'quiz_vsl_macondo'`** (constante nueva en
  `leads.controller.js`, agregada en esta sesión): no hay ningún `form_id`
  documentado en el repo, así que es una elección razonable pero no
  confirmada por el PM. Si el documento de Especificaciones Técnicas exige
  un literal exacto distinto, hay que corregir esa constante.
- **`priority_tier` del webhook (`TIER_1`/`TIER_2`/`TIER_3`/`TIER_REVIEW`)**
  es un mapeo interno (`PRIORITY_TIER_POR_PRIORIDAD` en
  `webhook.service.js`) inventado para traducir `vip/alta/media_baja/
  en_revision` a algo que un CRM externo esperaría — no viene de ningún
  documento confirmado, es una suposición razonable a partir del nombre
  del campo (`priority_tier`), no una regla dada por el PM.
  `current_cloud_provider_other` (el `detalle` libre) también es un nombre
  de campo elegido por analogía, no confirmado.
- **`GOOGLE_CALENDAR_ID` en `.env.example` sigue en `primary`** como
  ejemplo genérico, aunque el proyecto real usa un calendario secundario
  ("Landing-vsl") — es solo la plantilla, no un problema del `.env` real,
  pero vale la pena que quien reciba el proyecto sepa que `primary` casi
  seguro no es lo que quiere.
- **`DB_NAME` en `.env.example` dice `vsl_crm`**, no `vsl_macondo` (el
  nombre real usado en producción según la bitácora) — de nuevo, solo la
  plantilla, pero puede confundir a quien la use literal.
- **La migración de `schema.sql` (Fase 16, ENUM de `prioridad` + columnas
  `utm_term`) contra la base de datos real no se puede confirmar desde el
  código** — ver el punto correspondiente en "a medias" arriba. Es la pieza
  de deuda técnica con mayor riesgo de romper producción si se pasa por
  alto.
- **Sin tests automatizados.** Todo lo "verificado" en la bitácora se hizo
  manualmente contra bases de datos descartables o con `curl`/navegador en
  sesiones anteriores — no hay ningún archivo de test (`*.test.js`,
  carpeta `__tests__`, etc.) en `backend/` ni `frontend/`. No es un
  bloqueante para cerrar el proyecto tal como está planteado, pero sí
  significa que cualquier regresión futura se detecta manualmente.
- **Cambios de esta sesión sin commitear.** `git status` muestra 11
  archivos modificados y 1 archivo nuevo (`webhook.service.js`) sin
  commit — incluyendo la corrección completa de la Fase 16 y la conexión
  del webhook. Nada de esto está en el historial de git todavía.

---

## Recomendación

**Razonable considerar "listo para producción" hoy, tal cual está:**
El flujo completo landing → quiz → calificación en servidor → agendar en
Google Calendar real → CRM con roles → dashboard funciona de punta a
punta con integraciones reales, ya con hardening básico (helmet, CORS
restringido, rate limiting, JWT, bcrypt). Si el negocio puede operar sin
video real de Vturb (usando el placeholder u otro video temporal) y sin
notificaciones automáticas (revisando el CRM manualmente), el sistema
central de captación y calificación de leads es sólido.

**Indispensable resolver antes de dar el proyecto por cerrado:**
1. **Confirmar (o correr) la migración de `prioridad`/`utm_term` contra la
   base de datos real.** Es el único punto que puede tumbar `POST /leads`
   en producción con un error de base de datos silencioso desde el punto
   de vista del usuario del quiz.
2. **Decidir qué pasa con el webhook**: o se configura `WEBHOOK_CRM_URL`
   real y se prueba en vivo, o se documenta explícitamente que por ahora
   el proyecto opera sin notificar a un CRM externo (evitando que alguien
   asuma que ya está notificando cuando solo está logueando).
3. **Confirmar el `form_id` y los nombres de campo del webhook** contra el
   documento real del PM antes de que el CRM externo dependa de leerlos
   (ver "Deuda técnica").
4. **Vturb**: aunque no bloquea el resto, es la pieza más visible para
   cualquier visitante de la landing — vale la pena una fecha límite con
   el PM en vez de dejarlo indefinido.
5. Todo lo demás en "No iniciados" (Fase 14 completa, botón de Meet →
   calendario, vista de contactos, modal de detalle, columna prioridad,
   deploy) son mejoras razonables de posponer a una segunda entrega si el
   objetivo es cerrar el alcance actual, no bloqueantes del flujo
   principal.
