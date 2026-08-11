# Proyecto: Embudo VSL Macondo — Landing + CRM

## 1. Resumen del proyecto

Sistema de captación de leads compuesto por dos aplicaciones independientes, desplegables por separado:

- **Front**: Landing tipo VSL (Video Sales Letter) que recibe tráfico de Meta Ads, LinkedIn Ads y Orgánico, captura el origen del lead (UTMs), reproduce un video de ventas (Vturb) y, mediante un popup, califica al lead con un quiz y le permite agendar una reunión directamente en Google Calendar si califica.
- **Back**: Mini CRM que centraliza los leads, gestiona su estado dentro del pipeline comercial, expone la disponibilidad real del calendario y crea los eventos agendados.

**Dominio de referencia:** `https://www.macondosoftwares.com/vsl`

---

## 2. Flujo completo

```
Orgánico ─┐
Meta Ads ─┼─► Landing VSL (video) ─► Clic en video ─► Popup Quiz (4 preguntas)
LinkedIn ─┘                                                   │
                                            ┌──────────────────┴──────────────────┐
                                     No califica                              Sí califica
                                            │                                      │
                                   Guardar como                          Selector de horarios
                                  "descalificado"                        (disponibilidad real
                                            │                             de Google Calendar)
                                            │                                      │
                                            │                          Lead elige horario y confirma
                                            │                                      │
                                            │                         Se crea evento en Calendar (Meet)
                                            │                          + lead pasa a estado "agendado"
                                            └──────────────┬───────────────────────┘
                                                            ▼
                                                   Datos centralizados en CRM (MySQL)
                                                            │
                                        Estados: descalificado → agendado → con_requisitos →
                                                 sin_requisitos_reunion → reunion_cierre → venta_servicio
                                                            │
                                                            ▼
                                          Dashboard con % de respuestas del quiz por pregunta
```

---

## 3. Quiz de calificación (popup)

Se activa al dar clic en el botón del video. 4 preguntas, cada una con opciones que califican, descalifican, o dejan "en revisión" al lead. El resultado global determina si se le muestra o no el selector de horario.

### Pregunta 1 — Inversión mensual en infraestructura de nube
| Opción | Resultado |
|---|---|
| Menos de $3,000 USD/mes | Descalificado automático |
| $3,000 - $5,000 USD/mes | En revisión / en el límite |
| $5,000 - $10,000 USD/mes | Calificado |
| Más de $10,000 USD/mes | Calificado VIP |

### Pregunta 2 — Proveedor de nube principal
| Opción | Resultado |
|---|---|
| AWS | Calificado |
| Oracle Cloud (OCI) | Calificado |
| Microsoft Azure | Calificado |
| Google Cloud Platform (GCP) | Calificado |
| Hosting tradicional / económico (DigitalOcean, Hetzner, cPanel, etc.) | Descalificado |

### Pregunta 3 — Cargo en la organización
| Opción | Resultado |
|---|---|
| CEO / Founder / Director General | Calificado |
| CFO / Director Financiero | Calificado |
| CTO / VP de Ingeniería / Architect Cloud | Calificado |
| Gerente de TI / Infraestructura | Calificado |
| Estudiante / Consultor Independiente / Freelance | Descalificado |

### Pregunta 4 — Sector / industria
| Opción | Resultado |
|---|---|
| Desarrollo de Software / SaaS / Plataformas Digitales | Calificado - Alta prioridad |
| BPO / Contact Center / Servicios de TI | Calificado - Alta prioridad |
| FinTech / E-commerce de alto tráfico / AdTech | Calificado |
| Empresa tradicional / Comercio físico / Servicios no tecnológicos | Descalificado / en revisión |

**Lógica general:** si el lead marca cualquier opción "Descalificado", se bloquea el acceso al selector de horario. Los leads siempre se guardan (incluso los descalificados), para poder medir el % de respuestas por pregunta en el dashboard.

---

## 4. Modelo de datos (MySQL)

### Tabla `leads`
| Campo | Tipo | Nota |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| nombre | VARCHAR(150) | |
| email | VARCHAR(150) | |
| telefono | VARCHAR(30) | |
| utm_source | VARCHAR(100) | facebook, linkedin, organico |
| utm_medium | VARCHAR(100) | |
| utm_campaign | VARCHAR(150) | |
| utm_content | VARCHAR(150) | opcional |
| calificado | BOOLEAN | resultado global del quiz |
| estado | ENUM | `descalificado`, `agendado`, `con_requisitos`, `sin_requisitos_reunion`, `reunion_cierre`, `venta_servicio` |
| calendar_event_id | VARCHAR(255) | null si no ha agendado |
| created_at | DATETIME | default now |

### Tabla `respuestas_quiz`
| Campo | Tipo | Nota |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| lead_id | INT FK → leads.id | |
| pregunta | VARCHAR(100) | `inversion_nube`, `proveedor_nube`, `cargo`, `industria` |
| respuesta | VARCHAR(150) | opción elegida |
| descalifica | BOOLEAN | si esta respuesta puntual descalificó al lead |

Esta segunda tabla es la que permite construir el dashboard de "% de respuestas por pregunta" que pide el PM.

---

## 5. Estructura de carpetas

```
proyecto-vsl/
├── reference/                        # material fuente, NO se despliega
│   ├── landing-original.html         # HTML entregado por el PM (base exacta a convertir a React)
│   ├── vturb-embed.txt               # pendiente: pegar aquí el código de embed cuando llegue
│   └── google-calendar-setup.md      # notas de configuración OAuth (sin secretos reales)
│
├── front/                          # React + Vite + pnpm
│   ├── src/
│   │   ├── pages/
│   │   │   └── LandingVSL.jsx      # landing principal (convertida de reference/landing-original.html)
│   │   ├── components/
│   │   │   ├── VturbPlayer.jsx     # placeholder hasta pegar el código en reference/vturb-embed.txt
│   │   │   ├── QuizPopup.jsx       # paso 1: preguntas de calificación
│   │   │   ├── ScheduleSlots.jsx   # paso 2: selector de horario (Google Calendar)
│   │   │   └── Confirmation.jsx    # paso 3: confirmación de agenda
│   │   ├── utils/
│   │   │   └── utm.js              # captura utms desde la URL
│   │   ├── services/
│   │   │   └── api.js              # llamadas al backend
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── back/                           # Node + Express + pnpm + MySQL
    ├── src/
    │   ├── routes/
    │   │   ├── leads.routes.js
    │   │   ├── calendar.routes.js
    │   │   └── dashboard.routes.js
    │   ├── controllers/
    │   │   ├── leads.controller.js
    │   │   ├── calendar.controller.js
    │   │   └── dashboard.controller.js
    │   ├── services/
    │   │   ├── qualification.service.js   # lógica de descalificación del quiz
    │   │   └── googleCalendar.service.js  # OAuth + freebusy + creación de eventos
    │   ├── models/
    │   │   ├── Lead.js
    │   │   └── RespuestaQuiz.js
    │   ├── db/
    │   │   └── connection.js
    │   └── app.js
    ├── .env.example
    └── package.json
```

---

## 6. Integración Google Calendar

- Autenticación: OAuth2 (Client ID / Client Secret ya disponibles, se configuran como variables de entorno en el back — nunca en el front ni en el repo).
- Librería: `googleapis` (npm).
- `GET /calendar/disponibilidad` → consulta `freebusy` del calendario del negocio y devuelve slots libres de **30 minutos**, dentro del horario de atención configurado.
- `POST /calendar/agendar` → crea el evento (con Google Meet automático), guarda `calendar_event_id` en el lead, actualiza `estado` a `agendado`.

---

## 7. Pendientes externos (no bloquean el desarrollo)

- [ ] Código de embed de Vturb para el video de la landing.
- [ ] Confirmación final de qué UTMs trackear (propuesta: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` — estándar y cubre Meta/LinkedIn).
- [ ] Horario de atención exacto para el selector de disponibilidad (días y horas hábiles).

---

## 8. Instrucciones de construcción

1. **Landing (front):** partir de `reference/landing-original.html` (HTML entregado por el PM) y convertirlo a componentes React dentro de `front/src/pages/LandingVSL.jsx` (y subcomponentes si aplica), **preservando el diseño y la estructura original tal como está en ese archivo** — no se rediseña, solo se migra a React/Vite. Sobre esa base se integran los puntos de captura de UTMs y el trigger del popup del quiz.
2. **Video (front):** construir `VturbPlayer.jsx` como componente aislado y reemplazable. Mientras `reference/vturb-embed.txt` esté vacío, mostrar un placeholder (thumbnail + botón play simulado); en cuanto se pegue el código real ahí, `VturbPlayer.jsx` se actualiza sin tocar el resto de la landing.
3. **Popup de calificación (front):** construir `QuizPopup.jsx` con las 4 preguntas de la sección 3, aplicando la lógica de descalificación en el frontend para UX inmediata, pero validando también en el backend antes de guardar.
4. **Selector de horario (front):** construir `ScheduleSlots.jsx`, que solo se muestra si el lead calificó, y consume `GET /calendar/disponibilidad`.
5. **Backend — leads y quiz:** construir `POST /leads` aplicando `qualification.service.js`, guardando en `leads` y `respuestas_quiz` (sección 4).
6. **Backend — Google Calendar:** construir `googleCalendar.service.js` con OAuth2 (credenciales según `reference/google-calendar-setup.md`, guardadas como variables de entorno en `back/.env`, nunca en el repo), `GET /calendar/disponibilidad` (freebusy) y `POST /calendar/agendar` (crea evento con Meet, actualiza estado del lead).
7. **Backend — CRM y dashboard:** rutas para listar/filtrar leads, cambiar `estado` manualmente desde el CRM, y `GET /dashboard` con el % de respuestas por pregunta (agrupando la tabla `respuestas_quiz`).
8. **Estructura de carpetas:** respetar la separación `reference/`, `front/` y `back/` de la sección 5 — `reference/` es solo material fuente y nunca se despliega ni se importa como dependencia de código.
