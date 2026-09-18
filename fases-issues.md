# Fases de Issues — Plan de Acción

**Fecha:** 2026-09-17
**Regla:** un PR por fase, cerrando los issues correspondientes.

---

## Fase 1 — Quick wins ✅ COMPLETA

| Issue | Título | Estado |
|---|---|---|
| #31 | Monitoreo - Alertas | ✅ Completado |
| #22 | UI - Administrador de Píxeles | ✅ Completado |
| #23 | Inyección de scripts | ✅ Completado |
| #28 | Dashboard de Métricas | ✅ Completado |

**PR:** [#33](https://github.com/Macondo-Food/Marketing_Landing_page_CRM/pull/33) (base: main)

---

## Fase 2 — Definición de arquitectura ✅ COMPLETA

| Issue | Título | Estado |
|---|---|---|
| #5 | Arquitectura Base y Stack Tecnológico | ✅ Definida |

**Documento:** `arquitectura-builder.md` — Opción C (mismo repo, rutas raíz + CSP + sandbox en editor)
**Decisiones:** GrapesJS, landings en DB, assets en filesystem, rutas raíz, template VSL, landings manuales coexisten, borradores para todos / publicar solo admin, uploads 5MB/20MB/20 archivos con WebP auto.

---

## Fase 3 — Base del constructor de landings ✅ COMPLETA

| Issue | Título | Estado |
|---|---|---|
| #7 | Carga de archivos (imágenes + WebP) | ✅ Completado |
| #8 | Editor GrapesJS | ✅ Completado |
| #9 | Vista previa responsiva | ✅ Completado |
| #10 | Campo de URL (slug) | ✅ Completado |
| #11 | Validación de URL | ✅ Completado |
| #12 | Control de estados | ✅ Completado |

**PR:** [#34](https://github.com/Macondo-Food/Marketing_Landing_page_CRM/pull/34) (base: #33)

---

## Fase 4 — Formularios y leads ✅ COMPLETA

| Issue | Título | Estado |
|---|---|---|
| #16 | Constructor de Formularios | ✅ Completado |
| #17 | Obligatoriedad de campos | ✅ Completado |
| #18 | Detección de form al publicar | ✅ Completado |
| #19 | Inyección de form en landing | ✅ Completado |
| #21 | Ruteo de leads al CRM | ✅ Completado |

**PR:** [#35](https://github.com/Macondo-Food/Marketing_Landing_page_CRM/pull/35) (base: #34)

---

## Fase 5 — Producción y seguridad ✅ COMPLETA

| Issue | Título | Estado |
|---|---|---|
| #25 | Sanitización server-side | ✅ Completado |
| #14 | Caché en memoria | ✅ Completado |
| #15 | Cache-Control / CDN | ✅ Completado |
| #13 | Redirecciones al desactivar | ✅ Completado |
| #26 | Aislamiento CSP | ✅ Completado |
| #20 | Asignación automática de leads | ✅ Completado |
| #24 | Meta Conversions API | ✅ Completado |

**PR:** [#36](https://github.com/Macondo-Food/Marketing_Landing_page_CRM/pull/36) (base: #35)

---

## Fase 6 — Cierre (pendiente — QA y documentación, no código)

| Issue | Título | Estado |
|---|---|---|
| #27 | Pruebas de Penetración | ⬜ Pendiente |
| #29 | Documentación | ⬜ Pendiente |
| #30 | Pruebas Piloto | ⬜ Pendiente |
| #1 | Landing page (referencia general) | ⬜ Pendiente |

---

## Resumen

| Fase | Issues | Estado | PR |
|---|---|---|---|
| 1 — Quick wins | #31, #22, #23, #28 | ✅ Completa | [#33](https://github.com/Macondo-Food/Marketing_Landing_page_CRM/pull/33) |
| 2 — Arquitectura | #5 | ✅ Definida | — |
| 3 — Base builder | #7, #8, #9, #10, #11, #12 | ✅ Completa | [#34](https://github.com/Macondo-Food/Marketing_Landing_page_CRM/pull/34) |
| 4 — Forms y leads | #16, #17, #18, #19, #21 | ✅ Completa | [#35](https://github.com/Macondo-Food/Marketing_Landing_page_CRM/pull/35) |
| 5 — Producción | #14, #15, #13, #25, #26, #24, #20 | ✅ Completa | [#36](https://github.com/Macondo-Food/Marketing_Landing_page_CRM/pull/36) |
| 6 — Cierre | #27, #29, #30, #1 | ⬜ Pendiente | — |

**22 de 26 issues resueltos.** Quedan 4 de QA/documentación (Fase 6).

**Orden de merge:** #33 → #34 → #35 → #36 (apilados, cada uno sobre el anterior).
