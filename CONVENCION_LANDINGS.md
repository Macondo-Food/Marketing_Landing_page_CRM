# Convención para crear landings nuevas

Guía paso a paso para crear una landing de publicidad nueva en este proyecto.
Dirigido a cualquier desarrollador del equipo que necesite crear landings para
futuras campañas de marketing.

---

## Principio general

Cada landing es un **archivo autocontenido** en `frontend/src/pages/`. No
comparte componentes visuales con otras landings — todo el markup, los estilos
y el quiz van inline dentro del mismo archivo. Las únicas utilidades compartidas
son servicios y funciones puras (captura de UTMs, llamadas a la API,
agendamiento de calendario).

---

## Checklist de creación

### 1. Crear el archivo de la landing

- **Ubicación:** `frontend/src/pages/Landing[NombreCampana].jsx`
- **Nomenclatura:** PascalCase, prefijo `Landing`, seguido del nombre de la
  campaña. Ejemplos:
  - `LandingOracleCloud.jsx`
  - `LandingAlibabaVerano.jsx`
  - `LandingWebinar2026.jsx`
- El archivo exporta un componente React por defecto (`export default`).

### 2. Definir el identificador de la landing

Cada landing tiene un **identificador corto** (kebab-case) que se usa en:
- La URL de la ruta
- El campo `landing` en la base de datos (leads, contactos, utm_urls)
- El selector del generador UTM

Ejemplos: `oracle-cloud`, `alibaba-verano`, `webinar-2026`.

**Regla:** el identificador debe ser único — no puede repetirse con una landing
existente. Verificar en `frontend/src/utils/landings.js` antes de elegir uno.

### 3. Registrar la landing en el array de landings

Agregar una entrada al array en `frontend/src/utils/landings.js`:

```js
export const LANDINGS = [
  { id: 'vsl-macondo', nombre: 'VSL Macondo (Cloud)', ruta: '/' },
  { id: 'oracle-cloud', nombre: 'Oracle Cloud', ruta: '/oracle-cloud' },
  // ← agregar aquí la landing nueva
];
```

- `id`: el identificador del paso 2.
- `nombre`: nombre legible para mostrar en el CRM (dropdowns, tablas).
- `ruta`: la ruta pública en el frontend.

### 4. Registrar la ruta en React Router

Agregar la ruta pública en `frontend/src/App.jsx`:

```jsx
import LandingOracleCloud from './pages/LandingOracleCloud';

// Dentro de <Routes>:
<Route path="/oracle-cloud" element={<LandingOracleCloud />} />
```

La ruta va en la raíz (`/nombre-campana`), **fuera** del `CrmLayout` (las
landings son públicas, no requieren autenticación).

### 5. Estructura del archivo de la landing

El archivo debe contener, en este orden:

```jsx
import { useState, useEffect } from 'react';
import { captureUtms } from '../utils/utm';
import { createLead } from '../services/api';
// Si tiene agendamiento:
import ScheduleSlots from '../components/ScheduleSlots';

export default function LandingNombreCampana() {
  // 1. Estado local (quiz abierto, paso actual, datos del formulario, etc.)

  // 2. useEffect para capturar UTMs al montar
  useEffect(() => {
    captureUtms();
  }, []);

  // 3. useEffect para pixels de marketing (si aplica)

  // 4. Lógica del quiz (preguntas, opciones, descalificación)

  // 5. Handler de envío del lead (POST /leads con campo landing)

  // 6. Render: todo el markup y estilos inline
  return (
    <div>
      {/* Header, Hero, Video, Secciones, Footer */}
      {/* Popup del quiz */}
    </div>
  );
}
```

### 6. Captura de UTMs

Llamar `captureUtms()` de `utils/utm.js` en un `useEffect` al montar la
landing. Esto lee los UTMs de la URL y los guarda en `localStorage`.

```js
useEffect(() => {
  captureUtms();
}, []);
```

### 7. Envío del lead

Al enviar el quiz, **siempre incluir el campo `landing`** con el identificador
de esta landing:

```js
const payload = {
  nombre,
  email,
  telefono,
  empresa,
  utms: getStoredUtms(),
  respuestas: [...],
  landing: 'oracle-cloud', // ← identificador de ESTA landing
  tratamiento_datos_aceptado: true,
};
```

### 8. Pixels de marketing

Por ahora todas las landings usan los mismos pixels (Meta Pixel y LinkedIn
Insight Tag). Si en el futuro una landing necesita pixels diferentes, cada
landing hardcodea sus propios IDs en su `useEffect`.

### 9. Agendamiento (opcional)

Si la landing tiene quiz con agendamiento en Google Calendar, importar
`ScheduleSlots` de `components/ScheduleSlots.jsx` — es el único componente
compartido permitido (es funcionalidad de calendario, no visual de landing).

### 10. Backend (automático)

No se necesitan cambios en el backend para cada landing nueva. El campo
`landing` ya existe en `leads`, `contactos` y `utm_urls`, y el generador UTM
ya lee el array `LANDINGS`. Solo se requiere:

- Que la columna `landing` en la DB acepte el nuevo identificador (es
  `VARCHAR(100)`, así que cualquier string corto funciona).
- Si el backend valida contra una lista fija de landings, agregar el nuevo ID
  ahí también.

---

## Resumen de archivos a tocar al crear una landing nueva

| Archivo | Acción |
|---|---|
| `frontend/src/pages/Landing[Nombre].jsx` | **Crear** — la landing completa |
| `frontend/src/utils/landings.js` | **Editar** — agregar entrada al array |
| `frontend/src/App.jsx` | **Editar** — agregar la ruta pública |

Eso es todo. No se tocan componentes, backend, ni base de datos.

---

## Convenciones de estilo

- **Estilos inline** como objetos React (consistente con la landing original).
- **Tipografías** desde Google Fonts CDN en `index.html` (agregar si se
  necesitan fuentes nuevas).
- **Imágenes** en `frontend/src/assets/` con formato WebP + fallback PNG.
- **Sin Tailwind ni CSS modules** — todo inline para mantener el control total
  del diseño de cada landing.

---

## Ejemplo mínimo de landing nueva

```jsx
import { useState, useEffect } from 'react';
import { captureUtms, getStoredUtms } from '../utils/utm';
import { createLead } from '../services/api';

const PREGUNTAS = [
  {
    pregunta: '¿Cuál es tu presupuesto mensual?',
    opciones: [
      { texto: 'Menos de $1,000', descalifica: true },
      { texto: '$1,000 - $5,000', descalifica: false },
      { texto: 'Más de $5,000', descalifica: false },
    ],
  },
  // ... más preguntas específicas de esta campaña
];

export default function LandingEjemplo() {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState({ nombre: '', email: '', telefono: '', empresa: '' });
  const [respuestas, setRespuestas] = useState([]);

  useEffect(() => {
    captureUtms();
  }, []);

  const enviarLead = async (calificado) => {
    await createLead({
      ...datos,
      utms: getStoredUtms(),
      respuestas: PREGUNTAS.map((p, i) => ({
        pregunta: p.pregunta,
        respuesta: respuestas[i],
        descalifica: p.opciones.find(o => o.texto === respuestas[i])?.descalifica ?? false,
      })),
      landing: 'ejemplo-campana',
      tratamiento_datos_aceptado: true,
    });
  };

  return (
    <div>
      <h1>Landing de Ejemplo</h1>
      <button onClick={() => setIsQuizOpen(true)}>Comenzar</button>
      {isQuizOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)' }}>
          {/* Quiz UI aquí */}
        </div>
      )}
    </div>
  );
}
```
