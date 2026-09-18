# Arquitectura — Constructor de Landing Pages No-Code

**Decisión tomada:** Opción C — Mismo repo, rutas raíz + CSP estricta + sandbox en editor
**Fecha:** 2026-09-17
**Issue:** #5 — Arquitectura Base y Stack Tecnológico
**Desbloquea:** 17 de 26 issues (#6, #7, #8, #9, #10, #11, #12, #13, #16, #17, #18, #19, #21, #24, #25, #26, #15)

---

## 1. Principio rector

El módulo de landings vive dentro del mismo monorepo (`frontend/` + `backend/`),
comparte la base de datos MySQL, la autenticación JWT y los usuarios del CRM.
Las landings **publicadas** se sirven desde rutas raíz (`/:slug`) en el mismo
dominio, aisladas mediante CSP headers estrictos y sanitización server-side
(DOMPurify) para que un XSS en el HTML de una landing no pueda comprometer
el CRM.

---

## 2. Topología de rutas

Todo vive en el **mismo dominio y mismo servidor**. Las landings del builder
se sirven desde rutas raíz, igual que las landings manuales hoy. La web
principal (macondosoftwares.com) es un proyecto aparte en otro servidor.

```
/                        → redirect o landing principal
/vsl                     → landing manual (React, legacy)
/lp1                     → landing manual (React, legacy)
/mi-campana-nueva        → landing del builder (HTML desde DB)  ← NUEVO
/otra-landing            → landing del builder (HTML desde DB)  ← NUEVO
/crm/*                   → CRM (SPA React, autenticado)
```

**Sin subdominios.** Las landings del builder conviven con las manuales en
el mismo dominio. El aislamiento se logra con capas de seguridad en software
(CSP + sanitización), no en DNS.

### Aislamiento sin subdominio

| Capa | Qué protege |
|---|---|
| **DOMPurify server-side** al publicar | Sanitiza el HTML antes de guardarlo — elimina `<script>`, `onerror`, `javascript:`, etc. |
| **CSP estricta** en la respuesta del HTML publicado | `script-src 'self'` + `form-action` al dominio propio — aunque alguien bypaseara la sanitización, el navegador bloquea la ejecución |
| **Rutas separadas** en Express | Las landings publicadas no comparten middleware con `/crm/*` (sin auth, sin cookies) |
| **iframe sandbox** en el preview del editor | Dentro del CRM, el HTML en edición se renderiza aislado |
| **Sin cookies compartidas** | El CRM usa JWT en memoria (React Context), no cookies — no hay sesión que secuestrar desde una landing |

---

## 3. Editor visual — GrapesJS

### Decisión: GrapesJS (MIT, open-source)

| Alternativa | Por qué no |
|---|---|
| Craft.js | Framework de DnD, no editor — habría que construir toolbar, panel de estilos, capas, preview responsivo, export HTML desde cero. Semanas de trabajo extra. |
| Builder custom | Reinventar la rueda. El equipo es pequeño y el alcance ya es grande. |
| TipTap/ProseMirror | Editores de texto rico, no de páginas web. No manejan CSS, bloques visuales ni export HTML limpio. |

**GrapesJS** es un editor de páginas web embebible, diseñado exactamente para
este caso de uso (constructor no-code de landings). Incluye:

- Drag-and-drop de bloques (headers, imágenes, texto, botones, columnas)
- Editor de estilos por elemento (colores, fuentes, márgenes, padding)
- Capas (árbol DOM navegable)
- Vista previa responsiva (desktop / tablet / mobile)
- Editor de código (HTML/CSS directo) — útil para pegar templates externos
- Export de HTML + CSS limpio y autocontenido
- Extensible con bloques custom (plugins)
- ~300KB min+gzip, se carga solo en la ruta del editor

### Integración

```
frontend/src/pages/LandingBuilder.jsx   ← Contenedor principal
frontend/src/builder/
  ├── index.js                ← Inicialización de GrapesJS
  ├── blocks.js               ← Bloques custom (header, hero, CTA, footer)
  ├── components.js           ← Componentes custom del editor
  ├── styles.js               ← Estilos predefinidos / paleta de marca
  └── plugins/
      └── form-injector.js    ← Plugin para inyectar formularios (#19)
```

La ruta `/crm/builder` carga GrapesJS dinámicamente (lazy import) para no
afectar el bundle del CRM.

### Flujo de trabajo del editor

```
1. Usuario crea landing nueva → se abre el editor vacío o con template
2. Usuario arrastra bloques, edita texto, sube imágenes
3. GrapesJS mantiene el estado como JSON (project data)
4. Al guardar: se serializa el JSON del editor + se exporta HTML/CSS
5. Ambos se guardan en DB (JSON para reeditar, HTML para publicar)
```

---

## 4. Modelo de datos

### Tablas nuevas

```sql
-- Landings: registro principal de cada landing creada con el builder.
CREATE TABLE landings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,        -- URL path: landings.m...com/{slug}
  nombre VARCHAR(200) NOT NULL,             -- Nombre legible para el CRM
  estado ENUM('borrador', 'publicada', 'desactivada') NOT NULL DEFAULT 'borrador',
  
  -- Estado del editor (para reabrir y seguir editando)
  editor_json LONGTEXT NULL,                -- GrapesJS project data (JSON)
  
  -- HTML publicado (el que se sirve al visitante)
  html_publicado LONGTEXT NULL,             -- HTML autocontenido al momento de publicar
  css_publicado LONGTEXT NULL,              -- CSS separado (se inyecta en <style>)
  
  -- Configuración
  redirect_url VARCHAR(500) NULL,           -- URL de fallback cuando está desactivada (#13)
  meta_title VARCHAR(200) NULL,             -- <title> del HTML
  meta_description VARCHAR(300) NULL,       -- <meta description>
  
  -- Auditoría
  creado_por INT NOT NULL,
  publicado_por INT NULL,
  published_at DATETIME NULL,               -- Última vez que se publicó
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_landings_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id),
  CONSTRAINT fk_landings_publicado_por FOREIGN KEY (publicado_por) REFERENCES usuarios(id)
);

-- Assets: imágenes y archivos subidos para usar en las landings (#7).
CREATE TABLE landing_assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  landing_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,           -- Nombre original del archivo
  storage_path VARCHAR(500) NOT NULL,       -- Ruta en disco: uploads/landings/{id}/{hash}.{ext}
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_assets_landing FOREIGN KEY (landing_id) REFERENCES landings(id) ON DELETE CASCADE
);

-- Formularios generados por el builder (#16). Se guardan separados para
-- poder reutilizar el mismo form en múltiples landings.
CREATE TABLE landing_forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  config_json TEXT NOT NULL,                -- Definición del form: campos, tipos, validaciones
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Relación landing ↔ form (una landing puede tener 0 o 1 form).
ALTER TABLE landings
  ADD COLUMN form_id INT NULL AFTER meta_description,
  ADD CONSTRAINT fk_landings_form FOREIGN KEY (form_id) REFERENCES landing_forms(id) ON DELETE SET NULL;
```

### Relación con tablas existentes

- `leads.landing` → el slug de la landing del builder (igual que hoy funciona
  con `'vsl-macondo'`). Sin FK explícita porque `landing` es VARCHAR y los
  valores pueden venir tanto de landings manuales como del builder.
- `pixel_configs.landing` → mismo esquema: el slug identifica la landing.
- `utm_urls.landing` → igual.
- `contactos.landing` → igual.

Las landings del builder son **ciudadanos de primera** en el modelo de datos
existente: no necesitan tablas paralelas, solo se agrega el slug al registro
de leads/contactos/UTMs como ya se hace con las landings manuales.

---

## 5. Sandbox y aislamiento

### 5.1 Sirviendo landings publicadas

Las landings publicadas se sirven desde el backend Express en un **router
separado**, registrado antes que las rutas de la SPA de React para que
Express las intercepte por slug:

```js
// backend/src/routes/landings-publicas.routes.js

// GET /:slug → HTML publicado (ruta pública, sin auth)
router.get('/:slug', async (req, res, next) => {
  // Solo intercepta si el slug existe en la tabla landings
  const landing = await getLandingBySlug(req.params.slug);
  if (!landing) return next(); // Deja que React Router maneje la ruta

  if (landing.estado === 'desactivada' && landing.redirect_url) {
    return res.redirect(301, landing.redirect_url);
  }
  if (landing.estado !== 'publicada') {
    return next();
  }

  // CSP estricta para landings publicadas
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "script-src 'self'",                        // Sin eval, sin inline scripts
    "form-action 'self'",                       // Forms POST al mismo dominio
    "frame-ancestors 'none'",                   // No se puede embeber en iframe
    "base-uri 'none'",
  ].join('; '));

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  res.type('html').send(buildFullHtml(landing));
});
```

El router se monta en `app.js` **antes** del `express.static('dist')` de React:

```js
app.use('/', landingsPublicasRoutes);  // ← Primero: busca slug en DB
app.use(express.static('dist'));       // ← Después: SPA de React
```

### 5.2 Iframe solo en el editor

Las landings publicadas **no usan iframe** — la CSP estricta + la sanitización
server-side son suficientes. Un iframe en producción agregaría problemas de
SEO, scroll y responsive sin beneficio real.

El iframe sandbox sí se usa para la **vista previa dentro del editor**
(dentro del CRM), donde el HTML en edición es potencialmente inseguro y se
renderiza dentro de la SPA autenticada:

```jsx
// Preview del editor — iframe con sandbox
<iframe
  sandbox="allow-same-origin"
  srcDoc={editorHtml}
  style={{ width: previewWidth }}
  title="Vista previa"
/>
```

### 5.3 Resumen de capas de seguridad

| Capa | Dónde | Qué protege |
|---|---|---|
| CSP estricta | Headers de respuesta | Impide XSS: no inline scripts, no eval, no recursos externos no autorizados |
| Sanitización al publicar | Backend (issue #25) | DOMPurify server-side sobre el HTML/CSS antes de persistir |
| Rutas separadas | Router de Express | Las landings publicadas no comparten middleware con `/crm/*` |
| Sin cookies | Auth del CRM | JWT en memoria (React Context), no cookies — nada que secuestrar |
| Iframe sandbox | Editor preview | El HTML en edición no puede afectar la SPA del CRM |
| Rate limiting | Middleware | Protege el endpoint de leads contra abuso |

---

## 6. Almacenamiento de archivos (#7)

### HTML/CSS de landing → Base de datos

El editor JSON y el HTML exportado se guardan en columnas `LONGTEXT` de la
tabla `landings`. Razones:

- Transaccional: guardar y publicar son operaciones atómicas.
- Backup incluido: los backups de MySQL ya incluyen las landings.
- Sin dependencia de filesystem: funciona igual en cualquier entorno.
- El HTML de una landing es típicamente < 500KB — cabe sin problemas en DB.

### Imágenes y archivos → Filesystem (disco local)

Los assets subidos (imágenes, logos, PDFs) van a `backend/uploads/landings/{landing_id}/`.
Se sirven como archivos estáticos desde Express.

```
backend/uploads/landings/
  ├── 12/
  │   ├── hero-bg-a3f2c1.webp
  │   └── logo-empresa.png
  └── 13/
      └── testimonial-video.mp4
```

**Por qué no DB para imágenes:** los blobs grandes en MySQL degradan el
rendimiento de los backups y las queries. El filesystem es más simple y
más rápido para servir archivos estáticos. Cuando se agregue CDN (#15),
los archivos se suben a S3/Cloudflare R2 y la columna `storage_path`
cambia a una URL.

---

## 7. Flujo de publicación

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌───────────┐
│ Borrador │───▶│  Editor  │───▶│   Guardar    │───▶│ Publicada │
│  (nueva) │    │ (GrapesJS│    │ (DB: JSON +  │    │ (se sirve │
│          │    │  activo) │    │  HTML draft) │    │  al público│
└──────────┘    └──────────┘    └──────────────┘    └───────────┘
                                       │                    │
                                       │    ┌───────────────┤
                                       ▼    ▼               ▼
                                 ┌──────────────┐    ┌──────────────┐
                                 │  Desactivada │    │ Re-editar    │
                                 │ (redirect)   │    │ (nueva copia │
                                 └──────────────┘    │  del HTML)   │
                                                     └──────────────┘
```

### Endpoints nuevos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/landings` | requireAuth | Lista todas las landings (slug, nombre, estado, fechas) |
| `POST` | `/landings` | requireAuth | Crea landing nueva (borrador vacío) |
| `GET` | `/landings/:id` | requireAuth | Devuelve landing completa (incluye editor_json para abrir el editor) |
| `PATCH` | `/landings/:id` | requireAuth | Actualiza landing (editor_json, nombre, slug, meta) |
| `POST` | `/landings/:id/publish` | requireAuth | Exporta HTML del editor, sanitiza, marca como publicada |
| `PATCH` | `/landings/:id/status` | requireAuth | Cambia estado (borrador/publicada/desactivada) |
| `DELETE` | `/landings/:id` | requireAuth | Elimina landing y sus assets |
| `POST` | `/landings/:id/assets` | requireAuth | Sube archivo (multer) |
| `GET` | `/landings/:id/assets` | requireAuth | Lista assets de la landing |
| `GET` | `/landings/:id/preview` | requireAuth | Render del HTML en estado actual (sin publicar) |
| `GET` | `/landings/slug/:slug/available` | requireAuth | Verifica si un slug está disponible (#11) |

### Endpoint público (sin auth, ruta raíz)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/:slug` | Sirve el HTML publicado con CSP estricta (si el slug existe en DB) |

---

## 8. Constructor de formularios (#16)

El constructor de formularios vive como una sección **dentro del mismo editor**
de landing, no como una herramienta separada. GrapesJS ya soporta bloques de
formulario (input, textarea, select, button). Se extiende con:

- **Bloque "Formulario de contacto"** — inserta un `<form>` preconfigurado con
  los campos del quiz estándar (nombre, email, teléfono, empresa).
- **Panel de configuración** — sidebar donde se definen qué campos son
  obligatorios (#17), si hay preguntas del quiz (#16 extendido), y qué
  campos del form mapean a qué columnas de `leads`.
- **Al guardar:** el config del form se serializa a `landing_forms.config_json`.
- **Al publicar:** se inyecta el `<form>` completo en el HTML de la landing,
  con `action` apuntando a `POST /leads` del dominio principal y un `<input
  type="hidden" name="landing" value="{slug}">`.

### Flujo del form publicado

```
Visitante llena form en landing pública
  → POST https://www.macondosoftwares.com/api/leads
     { nombre, email, telefono, empresa, landing: "mi-campana", ... }
  → Backend procesa igual que hoy (calificación, lead/contacto, webhook, notificaciones)
```

El endpoint `POST /leads` existente **no necesita cambios** — ya acepta el
campo `landing` y procesa todo el flujo.

---

## 9. Convivencia con landings manuales (legacy)

Las landings existentes (VSL Macondo, LP1 Cloud Savings) siguen funcionando
como están — son componentes React en `frontend/src/pages/`, servidos por
Vite en producción desde el dominio principal.

El builder no reemplaza las landings manuales; es una **herramienta nueva**
para que marketing cree landings sin depender de desarrolladores. Las
landings manuales existentes no se migran al builder a menos que el equipo
lo decida.

En el CRM, ambos tipos de landings aparecen juntas:
- Landings manuales: aparecen en los dropdowns de filtro (vía `LANDINGS` array)
- Landings del builder: aparecen vía la tabla `landings` de la DB

Los dropdowns del CRM se actualizan para unir ambas fuentes.

---

## 10. Stack tecnológico (resumen para #5)

| Componente | Tecnología | Justificación |
|---|---|---|
| Editor visual | GrapesJS | Único editor de páginas web open-source embebible, MIT |
| Backend landings | Express (mismo servidor) | Mismo proceso, router separado |
| Storage HTML | MySQL LONGTEXT | Transaccional, backup incluido, simple |
| Storage assets | Filesystem local | Simple, migrable a S3 después |
| Seguridad | CSP + rutas separadas + DOMPurify | Aislamiento sin microservicio ni subdominio |
| Preview en editor | iframe sandbox | HTML en edición no afecta la SPA |
| Formularios | Bloques GrapesJS + POST /leads existente | Cero cambios al flujo actual |
| CDN (futuro, #15) | Cloudflare/CloudFront | Cuando el tráfico lo requiera |

---

## 11. Dependencias nuevas

### Frontend

| Paquete | Para qué |
|---|---|
| `grapesjs` | Editor visual de landings |
| `grapesjs-preset-webpage` | Bloques base (header, texto, imagen, video, columnas) |
| `dompurify` | Sanitización client-side del preview |

### Backend

| Paquete | Para qué |
|---|---|
| `multer` | Upload de archivos/imagenes (#7) |
| `isomorphic-dompurify` | Sanitización server-side del HTML antes de publicar (#25) |
| `sharp` | Optimización de imágenes subidas (resize, WebP) — opcional |

---

## 12. Preguntas abiertas

Estas decisiones afectan la implementación y necesitan respuesta antes de
escribir código:

### ~~P1 — Subdominio de landings~~ ✅ Resuelta

**Sin subdominio.** La web principal (macondosoftwares.com) es un proyecto
aparte en otro servidor. Las landings del builder viven en rutas raíz
(`/:slug`) del mismo dominio del CRM/landings.

### ~~P2 — Dominio del backend en producción~~ ✅ Resuelta

**Mismo dominio, sin subdominio API.** El backend Express sirve tanto el API
como las landings publicadas desde el mismo dominio. `form-action` en la CSP
usa `'self'`.

### ~~P3 — Templates base~~ ✅ Resuelta

**Plantilla única basada en la VSL actual.** El HTML de la landing VSL
Macondo se importa como template inicial de GrapesJS. Marketing parte de
una estructura conocida (hero + video + logos + quiz) y cambia textos,
imágenes y colores. Se pueden agregar más templates después sin romper
nada — es incremental.

### ~~P4 — Landings manuales y el builder~~ ✅ Resuelta

**Coexisten, no se migran.** Las landings manuales (VSL, LP1) tienen lógica
compleja (Vturb, quiz multi-paso, Google Calendar) que no se puede representar
en un editor no-code. El builder es para landings nuevas más simples.
Landings complejas → devs en React. Landings simples → marketing con el builder.

### ~~P5 — Roles y permisos del builder~~ ✅ Resuelta

**Cualquier rol puede crear y editar borradores; solo admins publican/desactivan.**
Crear/editar en borrador no tiene riesgo (nadie lo ve). Publicar es una acción
pública y requiere `admin`. No se agrega un tercer rol por ahora.

### ~~P6 — Tamaño máximo de uploads~~ ✅ Resuelta

- **5 MB** por imagen, **20 MB** por archivo no-imagen
- **20 archivos** máximo por landing
- Tipos: `jpg`, `jpeg`, `png`, `webp`, `gif`, `svg`, `pdf`, `mp4`
- Conversión automática a **WebP** con `sharp` al subir

---

## 13. Fases de implementación (mapeo a issues)

Con la arquitectura definida, el orden de implementación queda así:

### Fase 3 — Base del constructor (issues #7, #8, #9, #10, #11, #12)

1. **Tablas** — `landings`, `landing_assets`, `landing_forms` + migración automática
2. **Upload** (#7) — Multer + endpoint de assets + almacenamiento en disco
3. **CRUD de landings** (#10, #11, #12) — crear, listar, editar slug (con validación
   de unicidad), cambiar estado borrador/publicada/desactivada
4. **Editor base** (#8) — GrapesJS embebido en `/crm/builder`, guardar/cargar
   project JSON, export HTML
5. **Preview responsiva** (#9) — toggle desktop/tablet/mobile dentro del editor
6. **Servir landings publicadas** — router de rutas raíz con CSP estricta

### Fase 4 — Formularios y leads (issues #16, #17, #18, #19, #21)

1. **Builder de formularios** (#16) — bloques de form en GrapesJS
2. **Obligatoriedad de campos** (#17) — panel de config de campos requeridos
3. **Detección de form** (#18) — validar que el HTML tiene un `<form>` al publicar
4. **Inyección** (#19) — inyectar el form generado en el HTML de la landing
5. **Ruteo de leads** (#21) — conectar el form publicado con `POST /leads` existente

### Fase 5 — Producción y seguridad (issues #14, #15, #13, #25, #26, #24, #20)

1. **Sanitización** (#25) — DOMPurify server-side al publicar
2. **Aislamiento** (#26) — CSP + rutas separadas (ya en la Fase 3 base)
3. **Redirecciones** (#13) — URL de fallback al desactivar
4. **Caché** (#14) — caché en memoria del HTML publicado, invalidación al republicar
5. **Eventos de conversión** (#24) — Meta CAPI / Google Ads server-side
6. **CDN** (#15) — Cloudflare/CloudFront para las rutas de landings publicadas
7. **Asignación de leads** (#20) — reglas automáticas por landing/campaña

### Fase 6 — Cierre (issues #27, #29, #30, #1)

1. **Pruebas de penetración** (#27)
2. **Documentación** (#29)
3. **Pruebas piloto** (#30)
