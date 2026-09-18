# Proyecto VSL Macondo — Guía de contexto

## Qué es

Embudo de captación de leads con dos apps:
- **Frontend** (React + Vite): landings de publicidad con quiz de calificación y agendamiento en Google Calendar
- **Backend** (Node/Express + MySQL): CRM con login por roles, pipeline de leads, dashboard, webhook al CRM externo

**Dominio:** `https://www.macondosoftwares.com`
**Puerto backend dev:** 3099
**Puerto frontend dev:** 5173

---

## Estructura

```
frontend/src/
  pages/          → Landings (LandingVSL.jsx, LandingLp1.jsx) + CRM (CRM.jsx, Dashboard.jsx, ...)
  components/     → Componentes compartidos (Header, Hero, VturbPlayer, ScheduleSlots, ...)
  services/api.js → Cliente HTTP del backend
  utils/          → utm.js, landings.js (registro de landings), marketingPixels.js

backend/src/
  controllers/    → leads, calendar, auth, dashboard, usuarios, utm, contactos, pixel, landing, landing-assets
  services/       → qualification, googleCalendar, webhook, notificaciones, landing-form, landing-sanitize, landing-cache, meta-capi
  routes/         → Una por controller
  db/             → connection.js, schema.sql, migrate.js (auto-migración al arrancar)
  middleware/     → auth, requireAdmin, rateLimit, upload
```

---

## Landings

### Landings manuales (React)
Archivos autocontenidos en `frontend/src/pages/Landing[Nombre].jsx`. Cada una tiene su propio markup, estilos y quiz. Convención documentada en `CONVENCION_LANDINGS.md`.

- **VSL Macondo:** `/vsl`, `/formvsl`, `/graciasvsl`
- **LP1 Cloud Savings:** `/lp1`, `/lp1/form`, `/lp1/gracias`

### Landings del builder (no-code)
Creadas por marketing desde `/crm/landings` con editor GrapesJS. Se publican en rutas raíz (`/:slug`) con HTML servido desde DB. Arquitectura en `arquitectura-builder.md`.

---

## Stack

| Componente | Tecnología |
|---|---|
| Frontend | React 18, Vite, react-router-dom |
| Backend | Node 20, Express, mysql2, ESM |
| DB | MySQL 8, auto-migración en cada arranque |
| Auth | JWT (8h, en memoria), bcrypt, Google OAuth |
| Editor | GrapesJS + preset-webpage |
| Upload | multer + sharp (WebP auto) |
| Sanitización | sanitize-html |
| Caching | Map en memoria (TTL 60s) |
| Conversiones | Meta Conversions API (server-side) |

---

## Comandos

```bash
# Backend
cd backend && pnpm install && pnpm dev        # Dev (puerto 3099)
cd backend && pnpm seed-admin                  # Crear primer admin (una vez)

# Frontend
cd frontend && pnpm install && pnpm dev        # Dev (puerto 5173)
cd frontend && npx vite build                  # Build producción

# DB
# Migración automática al arrancar backend (migrate.js)
# Reset manual: DROP DATABASE + CREATE DATABASE + arrancar backend
```

---

## Variables de entorno (.env)

Ver `backend/.env.example` para la lista completa. Las principales:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — MySQL
- `JWT_SECRET` — Firma de tokens
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` — Google Calendar
- `ALLOWED_ORIGINS` — CORS (separados por coma)
- `META_PIXEL_ID`, `META_ACCESS_TOKEN` — Meta Conversions API
- `WEBHOOK_CRM_URL` — Webhook al CRM externo
- `NOTIF_EMAIL_*`, `GOOGLE_CHAT_WEBHOOK_URL` — Notificaciones

---

## Estado del roadmap (issues)

**22 de 26 issues resueltos** en 4 PRs apilados:

| PR | Fase | Issues |
|---|---|---|
| #33 | Quick wins (monitoreo, píxeles, métricas) | #22, #23, #28, #31 |
| #34 | Base del builder (GrapesJS, CRUD, uploads) | #7, #8, #9, #10, #11, #12 |
| #35 | Formularios y leads | #16, #17, #18, #19, #21 |
| #36 | Producción y seguridad | #13, #14, #15, #20, #24, #25, #26 |

**Pendientes (Fase 6):** #27 pentesting, #29 documentación, #30 piloto, #1 meta-issue.

Detalle completo en `fases-issues.md`. Testing local en `checklist-testing.md`.

---

## Documentos clave

| Archivo | Qué contiene |
|---|---|
| `arquitectura-builder.md` | Decisiones de arquitectura del builder no-code |
| `fases-issues.md` | Estado de las 6 fases del roadmap |
| `checklist-testing.md` | Checklist para verificar todo en local |
| `CONVENCION_LANDINGS.md` | Cómo crear landings manuales nuevas |
| `plan-proyecto-vsl.md` | Plan original del producto |
| `analisis-issues.md` | Análisis de los 26 issues del repo |
