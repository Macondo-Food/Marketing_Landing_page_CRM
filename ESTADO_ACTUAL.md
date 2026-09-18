# Estado actual del proyecto — VSL Macondo

**Última actualización:** 2026-09-17
**Branch activa:** `feature/fase5-produccion` (todo el código de las fases 1-5)

---

## Resumen

El proyecto tiene dos sistemas funcionando:

1. **Landings manuales** (React): VSL Macondo y LP1 Cloud Savings, con quiz de calificación, agendamiento en Google Calendar, y pixels de marketing
2. **CRM** (React + Express): login con roles, pipeline de leads, dashboard, contactos, generador UTM, píxeles configurables

Además, se implementó un **constructor de landings no-code** (Fases 3-5) que permite a marketing crear y publicar landings desde un editor visual GrapesJS, sin depender de desarrolladores.

---

## Qué funciona (producción actual — main)

- Landing VSL con video Vturb + quiz + agendamiento Google Calendar
- Landing LP1 Cloud Savings
- CRM con login email/password + Google Sign-In
- Pipeline de leads con 4 estados manuales + prioridad (vip/alta/media_baja/en_revision)
- Dashboard con métricas por pregunta de quiz + rendimiento por campaña UTM
- Vista de contactos (descalificados) con toggle contactado
- Generador de URLs con UTMs preestablecidos (multi-landing)
- Píxeles configurables desde el CRM (Meta Pixel, LinkedIn Insight)
- Webhook fire-and-forget al CRM externo
- Notificaciones de agendamiento (correo + Google Chat, sin configurar)
- Auto-migración de DB al arrancar el backend

## Qué funciona (en PRs, sin mergear)

### Fase 1 — Quick wins (PR #33)
- Endpoint `/health` con monitoreo básico
- Administrador de píxeles desde el CRM (`/crm/pixeles`)
- Píxeles inyectados dinámicamente desde DB (ya no hardcodeados)
- Métricas por landing en el dashboard

### Fase 3 — Base del builder (PR #34)
- Editor visual GrapesJS en `/crm/landings/:id/edit`
- CRUD de landings con validación de slug y control de estados
- Upload de imágenes con conversión automática a WebP
- Landings publicadas servidas en `/:slug` con CSP estricta
- Template base VSL + bloques custom

### Fase 4 — Formularios (PR #35)
- Validación de `<form>` al publicar
- Inyección automática de landing slug + checkbox tratamiento de datos
- Form conectado a POST /leads existente

### Fase 5 — Producción (PR #36)
- Sanitización server-side (sanitize-html)
- Caché en memoria (TTL 60s) con invalidación
- Cache-Control headers para CDN
- Asignación automática de leads por landing
- Meta Conversions API (server-side, configurable)

---

## PRs abiertos

| PR | Branch | Base | Estado |
|---|---|---|---|
| [#33](https://github.com/Macondo-Food/Marketing_Landing_page_CRM/pull/33) | feature/fase1-quick-wins | main | Abierto |
| [#34](https://github.com/Macondo-Food/Marketing_Landing_page_CRM/pull/34) | feature/fase3-builder-base | #33 | Abierto |
| [#35](https://github.com/Macondo-Food/Marketing_Landing_page_CRM/pull/35) | feature/fase4-formularios | #34 | Abierto |
| [#36](https://github.com/Macondo-Food/Marketing_Landing_page_CRM/pull/36) | feature/fase5-produccion | #35 | Abierto |

**Orden de merge:** #33 → #34 → #35 → #36 (apilados, cada uno sobre el anterior)

---

## Pendientes

### Issues sin resolver (Fase 6 — QA/documentación)
- #27 — Pruebas de penetración
- #29 — Documentación de usuario del builder
- #30 — Pruebas piloto con marketing
- #1 — Meta-issue de tracking

### Configuración pendiente en producción
- `META_PIXEL_ID` + `META_ACCESS_TOKEN` (Meta CAPI)
- `NOTIF_EMAIL_*` + `GOOGLE_CHAT_WEBHOOK_URL` (notificaciones)
- `WEBHOOK_CRM_URL` (webhook al CRM externo)
- Subdominio DNS para landings (si aplica)

### Sin tests automatizados
No hay archivos de test (`*.test.js`). Toda verificación es manual. Ver `checklist-testing.md`.
