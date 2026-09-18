# Checklist de Testing Local — Fases 1 a 5

**Branch:** `feature/fase5-produccion`
**Fecha:** 2026-09-17

Este documento guía la verificación manual de todos los cambios implementados.
Ejecutar en orden — cada sección depende de la anterior.

---

## 0. Preparación

- [ ] Checkout: `git checkout feature/fase5-produccion`
- [ ] Backend: `cd backend && pnpm install`
- [ ] Frontend: `cd frontend && pnpm install`
- [ ] Configurar `.env` del backend (copiar de `.env.example`)
- [ ] MySQL corriendo y accesible
- [ ] Backend arranca sin errores: `cd backend && pnpm dev`
  - [ ] Ver en consola: `[migrate] agregando columna faltante landings.asignado_a...`
  - [ ] Ver en consola: `[migrate] agregando columna faltante leads.asignado_a...`
  - [ ] Ver en consola: `[migrate] agregando columna faltante contactos.asignado_a...`
  - [ ] Ver en consola: `[migrate] estructura de la base de datos al día.`
- [ ] Frontend build pasa: `cd frontend && npx vite build` (0 errores)
- [ ] Frontend dev: `cd frontend && pnpm dev`

### Verificar tablas nuevas en MySQL

```sql
SHOW TABLES LIKE 'landing%';
-- Debe mostrar: landing_assets, landing_forms, landings

DESCRIBE landings;
-- Debe tener: slug, nombre, estado, editor_json, html_publicado,
-- css_publicado, form_id, redirect_url, asignado_a, meta_title,
-- meta_description, creado_por, publicado_por, published_at

DESCRIBE landing_assets;
-- Debe tener: landing_id, filename, storage_path, mime_type, size_bytes

DESCRIBE landing_forms;
-- Debe tener: nombre, config_json

DESCRIBE leads;
-- Debe tener columna: asignado_a

DESCRIBE contactos;
-- Debe tener columna: asignado_a
```

---

## 1. Fase 1 — Quick wins (#22, #23, #28, #31)

### #31 — Health endpoint

- [ ] `GET http://localhost:3099/health` responde 200
- [ ] Respuesta incluye: `status`, `uptime`, `requests`, `errors`, `memory`

### #22 — Administrador de Píxeles

- [ ] Login al CRM con admin
- [ ] Navegar a `/crm/pixeles`
- [ ] Ver tabla con píxeles de `vsl-macondo` y `lp1` (seed de migración)
- [ ] Crear un píxel nuevo: landing=`test`, tipo=`meta_pixel`, id=`12345`
- [ ] Toggle del píxel (activo/inactivo) funciona
- [ ] Eliminar píxel funciona
- [ ] Vendedor puede ver píxeles pero no crear/editar/eliminar (verificar 403)

### #23 — Inyección dinámica de scripts

- [ ] Abrir `/vsl` en el navegador
- [ ] Ver en DevTools > Network que se carga el pixel de Meta (request a facebook)
- [ ] Desactivar un píxel desde `/crm/pixeles`
- [ ] Recargar `/vsl` — el píxel desactivado ya no se carga

### #28 — Dashboard de métricas

- [ ] Navegar a `/crm/dashboard`
- [ ] Ver dropdown "Filtrar por landing"
- [ ] Ver tabla "Rendimiento por campaña" (cuando hay datos UTM)
- [ ] Ver tabla "Rendimiento por landing"

---

## 2. Fase 3 — Base del constructor (#7, #8, #9, #10, #11, #12)

### #10, #11 — Crear landing y validar slug

- [ ] Navegar a `/crm/landings` (link "Landings" visible en nav del CRM)
- [ ] Click "Nueva Landing"
- [ ] Intentar crear con slug vacío → error "nombre y slug son requeridos"
- [ ] Intentar crear con slug `crm` → error "slug inválido" (ruta reservada)
- [ ] Intentar crear con slug `ab` → error "slug inválido" (mín 3 chars)
- [ ] Crear con nombre=`Test Landing`, slug=`test-landing` → éxito
- [ ] Intentar crear otra con slug `test-landing` → error "ya está en uso"

### #8 — Editor GrapesJS

- [ ] Click "Editar" en la landing creada
- [ ] Editor GrapesJS carga con template VSL base
- [ ] Ver bloques en panel lateral: Hero+CTA, Logos Clientes, 3 Features, Formulario, Footer
- [ ] Arrastrar un bloque al canvas
- [ ] Editar texto de un componente (doble click)
- [ ] Click "Guardar" → ver mensaje "Borrador guardado"
- [ ] Recargar la página → el editor restaura los cambios guardados

### #9 — Preview responsiva

- [ ] Click "Desktop" → canvas ancho completo
- [ ] Click "Tablet" → canvas 768px
- [ ] Click "Mobile" → canvas 375px
- [ ] El contenido se reflow correctamente en cada vista

### #7 — Upload de archivos

- [ ] (Requiere endpoint de assets activo — verificar vía API con Postman/curl)
- [ ] `POST /landings/:id/assets` con imagen JPG → se sube y convierte a WebP
- [ ] `POST /landings/:id/assets` con SVG → se sube sin conversión
- [ ] `POST /landings/:id/assets` con archivo > 5MB (imagen) → error
- [ ] `POST /landings/:id/assets` con tipo no permitido (.exe) → error
- [ ] `GET /landings/:id/assets` → lista los archivos subidos
- [ ] `DELETE /landings/:id/assets/:assetId` → elimina archivo del disco y DB
- [ ] Intentar subir 21 archivos → error "límite de 20 alcanzado"

### #12 — Control de estados

- [ ] Desde `/crm/landings`, ver badge "Borrador" en la landing creada
- [ ] Como admin: click "Publicar" → (falla si no hay form en el HTML)
- [ ] Agregar el bloque "Formulario" al editor, guardar, y reintentar publicar
- [ ] Ver badge "Publicada" → la landing es accesible en `http://localhost:3099/test-landing`
- [ ] Ver headers de la respuesta: `Content-Security-Policy` presente
- [ ] Click "Desactivar" → badge "Desactivada"
- [ ] `GET /test-landing` → 404 (o 301 si tiene redirect_url configurada)

---

## 3. Fase 4 — Formularios y leads (#16, #17, #18, #19, #21)

### #18 — Validación de form al publicar

- [ ] Crear landing nueva sin form
- [ ] Intentar publicar → error "debe contener al menos un formulario"
- [ ] Agregar bloque "Formulario" → publicar funciona

### #16, #19 — Form inyectado + #21 — Ruteo de leads

- [ ] Publicar una landing con form
- [ ] Abrir la landing publicada en el navegador
- [ ] Ver que el form tiene `action="/leads"` y `method="POST"`
- [ ] Ver `<input type="hidden" name="landing" value="{slug}">`
- [ ] Ver checkbox "Acepto el tratamiento de datos personales"
- [ ] Enviar el form con datos de prueba:
  ```
  nombre=Test User
  email=test@example.com
  telefono=3001234567
  empresa=TestCorp
  tratamiento_datos_aceptado=true
  ```
- [ ] Verificar en DB que el lead se creó con `landing = '{slug}'`
- [ ] Verificar que `leads.asignado_a` = usuario que creó la landing

### #17 — Campos obligatorios

- [ ] En el editor, click en un input del form
- [ ] Panel de propiedades muestra el atributo `required`
- [ ] Desmarcar `required` → guardar → publicar
- [ ] En la landing publicada, el campo ya no es obligatorio

---

## 4. Fase 5 — Producción y seguridad (#13, #14, #15, #20, #24, #25, #26)

### #25 — Sanitización

- [ ] En el editor, abrir el modo "Código" de GrapesJS
- [ ] Inyectar `<script>alert('xss')</script>` en el HTML
- [ ] Guardar y publicar
- [ ] Abrir la landing publicada → el `<script>` NO aparece en el HTML fuente
- [ ] Inyectar `<img src=x onerror="alert(1)">` → el `onerror` es eliminado
- [ ] Inyectar `<a href="javascript:alert(1)">click</a>` → el href es eliminado

### #14 — Caché

- [ ] Publicar una landing
- [ ] `GET /:slug` primera vez → response time ~50ms (DB query)
- [ ] `GET /:slug` segunda vez inmediata → response time ~5ms (cache hit)
- [ ] Republicar la landing → siguiente request vuelve a ~50ms (cache invalidated)
- [ ] Cambiar estado a "desactivada" → cache invalidated

### #15 — Cache-Control headers

- [ ] `GET /:slug` de landing publicada → header `Cache-Control: public, max-age=60, stale-while-revalidate=300`

### #26 — CSP headers

- [ ] `GET /:slug` de landing publicada → header `Content-Security-Policy` presente
- [ ] Ver que incluye: `script-src 'self'`, `frame-ancestors 'none'`

### #13 — Redirecciones

- [ ] Desactivar una landing
- [ ] Configurar `redirect_url` vía `PATCH /landings/:id` con `{"redirect_url": "https://example.com"}`
- [ ] `GET /:slug` → 301 redirect a `https://example.com`

### #20 — Asignación automática

- [ ] Crear landing como vendedor → `landings.asignado_a` = id del vendedor
- [ ] Enviar form de esa landing → el lead creado tiene `asignado_a` = id del vendedor
- [ ] Cambiar `asignado_a` de la landing vía PATCH → nuevo lead se asigna al nuevo usuario

### #24 — Meta CAPI

- [ ] Sin `META_PIXEL_ID` ni `META_ACCESS_TOKEN` en .env → crear lead funciona normal (no rompe)
- [ ] Con las variables configuradas → verificar en logs de Meta Events Manager que llega el evento Lead

---

## 5. Integración end-to-end

- [ ] Crear landing nueva desde el CRM
- [ ] Editar con GrapesJS (cambiar textos, agregar secciones)
- [ ] Subir una imagen (verificar conversión a WebP)
- [ ] Agregar form, guardar borrador
- [ ] Publicar (como admin)
- [ ] Abrir landing publicada → contenido correcto, form funcional
- [ ] Enviar form → lead aparece en `/crm/leads` con landing correcta
- [ ] Verificar píxeles cargando en la landing publicada
- [ ] Desactivar landing → ya no es accesible
- [ ] Vendedor puede crear/editar borradores pero no publicar (403)

---

## Comandos útiles

```bash
# Ver logs del backend
cd backend && pnpm dev

# Build frontend
cd frontend && npx vite build

# Reset DB (cuidado — borra todo)
# DROP DATABASE vsl_crm; CREATE DATABASE vsl_crm;
# Luego arrancar backend (la migración recrea todo)

# Test endpoint health
curl http://localhost:3099/health

# Test landing publicada
curl -I http://localhost:3099/{slug}

# Crear landing vía API
curl -X POST http://localhost:3099/landings \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"slug":"test","nombre":"Test"}'
```
