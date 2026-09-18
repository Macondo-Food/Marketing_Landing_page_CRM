# Análisis de Issues — Proyecto VSL Macondo

**Fecha:** 2026-09-17
**Issues abiertos:** 26 originales → **22 resueltos**, 4 pendientes (Fase 6: QA/docs)
**Repo:** Macondo-Food/Marketing_Landing_page_CRM
**PRs:** #33 (Fase 1), #34 (Fase 3), #35 (Fase 4), #36 (Fase 5) — todos abiertos, apilados

---

## Observación general

Los 26 issues describen una visión mucho más grande que el proyecto actual: un **constructor de landing pages no-code** integrado al CRM, donde el usuario puede subir/crear landings desde un editor, inyectar formularios, publicar con control de estados, y trackear con pixels configurables — todo aislado del core del CRM.

Hoy el proyecto es un **embudo manual**: cada landing es un archivo React que un desarrollador crea a mano. Los issues proponen convertirlo en una **plataforma self-service** para el equipo de marketing.

---

## Issues organizados por complejidad

### 🔴 Alta complejidad (arquitectura nueva, riesgo alto)

Estos issues requieren decisiones de arquitectura, infraestructura nueva o cambios que afectan la seguridad del sistema.

| # | Issue | Qué implica | Dependencias |
|---|---|---|---|
| **#5** | Arquitectura Base y Stack Tecnológico | Definir cómo se integra el módulo de landing pages al CRM: ¿mismo proceso? ¿microservicio? ¿iframe sandbox? Esta decisión afecta todos los issues siguientes. | Ninguna — es el punto de partida |
| **#8** | Desarrollo del Sandbox | Crear un entorno aislado para renderizar HTML no verificado sin riesgo de XSS. Implica iframe sandbox, CSP headers, posiblemente un dominio separado. | #5 |
| **#16** | UI - Constructor de Formularios (No-Code) | Editor drag-and-drop para crear formularios conectados al CRM. Es un producto en sí mismo: estado de campos, validaciones, preview, serialización. | #5, #17 |
| **#19** | Inyección de código | Detectar un placeholder en el HTML subido e inyectar el formulario generado, heredando los estilos CSS de la página base. Parsing de HTML + manipulación DOM server-side. | #7, #8, #18 |
| **#26** | Seguridad - Aislamiento (XSS) | Protección multi-tenant: que un cliente no pueda acceder a datos de otro. Implica aislamiento de procesos, headers CSP, posiblemente contenedores separados. | #5, #8 |
| **#15** | Infraestructura - CDN | Servir las landings publicadas desde CDN para aguantar tráfico de pauta. Requiere invalidación de caché, dominio custom, posiblemente CloudFront/Cloudflare. | #12, #14 |

**Subtotal:** 6 issues. Sin el #5 resuelto, los demás no pueden arrancar.

---

### 🟡 Complejidad media (feature completa, esfuerzo moderado)

Features que tienen alcance claro pero requieren trabajo de frontend + backend + base de datos.

| # | Issue | Qué implica | Dependencias |
|---|---|---|---|
| **#6** | UI - Editor de texto | Textarea con syntax highlighting (CodeMirror/Monaco) para pegar HTML/CSS/JS. Frontend pesado pero alcance acotado. | #5 |
| **#12** | Control de estados | Borrador → Publicada → Desactivada. Tabla nueva o campo en landings, UI de toggle, lógica de publicación. | #5 |
| **#18** | Parser HTML | Detectar la etiqueta de formulario dentro del HTML subido. Parsing server-side (cheerio/jsdom), validación de estructura. | #7 |
| **#20** | UI - Asignación de Leads | Interfaz para definir reglas de asignación automática (por segmento, etiqueta, vendedor). CRUD de reglas + lógica de matching. | #21 |
| **#22** | UI - Administrador de Píxeles | Casillas para IDs de GA, Meta Pixel, scripts custom. CRUD en DB + UI. Los pixels hoy están hardcodeados — esto los hace configurables. | #23 |
| **#23** | Inyección de scripts | Inyectar pixels configurados en el `<head>` de cada landing publicada. Template engine o manipulación DOM server-side. | #22, #12 |
| **#24** | Eventos de conversión | Disparar eventos server-side a Meta CAPI / Google Ads cuando se envía un form. Webhooks con retry, timeout < 3 seg. | #22 |
| **#28** | Dashboard de Métricas | Tablero para marketing: páginas activas, leads por página, tasas de conversión. Requiere queries agregadas + gráficos nuevos. | #12 |
| **#14** | Infraestructura - Caché | Caché dedicado para landings publicadas (Redis/Cloudflare). Invalidación al republicar. | #12 |

**Subtotal:** 9 issues.

---

### 🟢 Baja complejidad (UI puntual o tarea acotada)

Features con alcance pequeño, poco riesgo, implementables en 1-2 sesiones.

| # | Issue | Qué implica | Dependencias |
|---|---|---|---|
| **#7** | Carga de archivos | Upload de `.html` al servidor. Multer/S3, validación de tipo y tamaño. | #5 |
| **#9** | UI - Vista previa responsiva | Toggle mobile/desktop en el preview. iframe con ancho variable. | #8 |
| **#10** | UI - Campo de URL | Input de slug en el formulario de landing. Validación de formato. | #11 |
| **#11** | Validación de URL | Query en tiempo real para verificar si el slug está disponible. Endpoint simple. | #5 |
| **#13** | Redirecciones | Configurar URL de fallback cuando se desactiva una página. Campo en DB + redirect 301/302. | #12 |
| **#17** | UI - Obligatoriedad de campos | Checkboxes para marcar qué campos del form son requeridos. Extensión del #16. | #16 |
| **#21** | Ruteo de Leads | Conectar envíos del formulario inyectado con la tabla `leads`. Mapeo de campos. | #19 |
| **#25** | Seguridad - Sanitización | Sanitizar HTML/CSS/JS entrante (DOMPurify server-side, CSP). | #5 |
| **#27** | Pruebas de Penetración | Auditoría de seguridad: OWASP top 10, XSS, CSRF, inyección SQL. Puede ser manual o con herramientas automatizadas. | #25, #26 |
| **#29** | Documentación | Manuales de usuario para el equipo de marketing. No requiere código. | Todo lo anterior |
| **#30** | Pruebas Piloto | Lanzamiento con usuarios piloto, recolectar feedback UX. No requiere código. | Todo lo anterior |
| **#31** | Monitoreo - Alertas | Configurar uptime (99.9%) y tasa de errores (<2%). UptimeRobot/Datadog/Grafana. | #15 |
| **#1** | Landing page (general) | Issue contenedor con link a doc externo de requerimientos. Referencia, no acción directa. | — |

**Subtotal:** 13 issues.

---

## Resumen por complejidad

| Complejidad | Cantidad | Issues |
|---|---|---|
| 🔴 Alta | 6 | #5, #8, #16, #19, #26, #15 |
| 🟡 Media | 9 | #6, #12, #18, #20, #22, #23, #24, #28, #14 |
| 🟢 Baja | 13 | #7, #9, #10, #11, #13, #17, #21, #25, #27, #29, #30, #31, #1 |

---

## Dependencia crítica: Issue #5

**17 de 26 issues** dependen directa o indirectamente de la decisión de arquitectura (#5). Sin resolver eso, no se puede arrancar con nada del módulo de landing pages.

La pregunta central es: **¿el constructor de landings vive dentro del CRM actual (mismo repo, mismo proceso) o es un servicio separado?**

### Opción A — Mismo repo, módulo nuevo
- Más simple de arrancar
- Comparte auth, DB, usuarios del CRM
- Riesgo: un XSS en una landing podría comprometer el CRM

### Opción B — Servicio separado (microservicio)
- Aislamiento real (dominio/subdominio distinto)
- Más infraestructura que mantener
- Comunicación con CRM vía API/webhooks

### Opción C — Mismo repo, sandbox con iframe + CSP
- Punto medio: mismo deploy pero landings sirven desde un subdominio aislado
- iframe con `sandbox` attribute + CSP headers estrictos
- Requiere configuración cuidadosa

---

## Lo que ya tenemos vs lo que piden los issues

| Capacidad | Estado actual | Lo que piden |
|---|---|---|
| Landings | Creadas a mano por devs (React) | Constructor no-code self-service |
| Formularios | Hardcodeados en cada landing | Builder drag-and-drop configurable |
| URLs/rutas | Definidas en App.jsx por dev | Campo de texto editable por usuario |
| Publicación | Deploy manual (push a main) | Toggle Borrador/Publicada/Desactivada |
| Pixels | Hardcodeados en código | UI para configurar IDs por landing |
| Leads | POST /leads desde frontend conocido | Ruteo automático desde forms inyectados |
| CDN/Caché | Sin configurar | CDN dedicado + caché por landing |
| Seguridad | Helmet + CORS + rate limiting | Sandbox XSS + aislamiento multi-tenant |
| Métricas | Dashboard básico del CRM | Tablero de marketing con conversión por página |
| Monitoreo | Sin alertas | Uptime 99.9% + alertas de error |

---

## Siguiente paso sugerido

1. **Definir el issue #5** (arquitectura) — sin esto, todo lo demás está bloqueado
2. **Priorizar issues independientes** que no dependen de #5 y aportan valor inmediato:
   - #22 + #23 (pixels configurables desde UI) — ya tenemos pixels hardcodeados
   - #28 (dashboard de métricas) — ya tenemos datos en la DB
   - #31 (monitoreo) — se puede configurar sin cambios de código
3. **Crear un plan de fases** una vez definida la arquitectura
