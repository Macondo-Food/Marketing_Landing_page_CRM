// Misma lógica de calificación que frontend/src/components/QuizPopup.jsx
// (sección 3 del plan). Se reevalúa aquí en el servidor: los flags que
// puedan venir del cliente en `respuestas` se ignoran, se derivan de nuevo
// a partir de `pregunta` + `respuesta` contra estas listas.
//
// Fase 16 (corrección crítica, documento "Especificaciones Técnicas" del
// PM): a partir de esta fase SOLO el presupuesto (inversion_nube) y el
// cargo (cargo) pueden descalificar. El proveedor de nube y la industria
// ya NO descalifican bajo ninguna opción — antes de la Fase 16,
// "Otros proveedores / Hosting tradicional" y "Comercio / Retail /
// Servicios Tradicionales" sí descalificaban; eso era el bug que corrige
// esta fase. También se agregó "Otro rol dentro de la empresa" al cargo
// (no descalifica, no afecta la prioridad).
//
// Cada opción también trae `codigo`: el código en inglés exacto del
// documento del PM para esa respuesta (usado por webhook.service.js). Vive
// aquí, en la misma fuente de verdad que decide `descalifica`/`prioridad`,
// en vez de en una tabla de mapeo aparte — si mañana cambia una regla o el
// texto de una opción, el webhook no se desincroniza silenciosamente.
export const QUIZ_PREGUNTAS = ['inversion_nube', 'proveedor_nube', 'cargo', 'industria'];

const PRESUPUESTO_VIP = 'Más de $10,000 USD/mes';

// La prioridad (cuando el lead califica) se resuelve en dos pasos, no solo
// por industria: primero se revisa si el presupuesto es VIP (gana sobre
// cualquier industria); si no, se usa la prioridad asociada a la industria.
const OPCIONES = {
  inversion_nube: {
    'Menos de $3,000 USD/mes': { descalifica: true, codigo: '<3000' },
    '$3,000 - $5,000 USD/mes': { descalifica: false, codigo: '3000-4999' },
    '$5,000 - $10,000 USD/mes': { descalifica: false, codigo: '5000-10000' },
    [PRESUPUESTO_VIP]: { descalifica: false, codigo: '>10000' },
  },
  proveedor_nube: {
    AWS: { descalifica: false, codigo: 'AWS' },
    'Oracle Cloud (OCI)': { descalifica: false, codigo: 'OCI' },
    'Microsoft Azure': { descalifica: false, codigo: 'AZURE' },
    'Google Cloud Platform (GCP)': { descalifica: false, codigo: 'GCP' },
    'IBM Cloud': { descalifica: false, codigo: 'IBM' },
    'Huawei Cloud': { descalifica: false, codigo: 'HUAWEI' },
    'Otros proveedores / Hosting tradicional': { descalifica: false, codigo: 'OTHER' },
  },
  cargo: {
    'CEO / Founder / Director General': { descalifica: false, codigo: 'C_LEVEL' },
    'CFO / Director Financiero': { descalifica: false, codigo: 'FINANCE_OPS' },
    'CTO / VP de Ingeniería / Architect Cloud': { descalifica: false, codigo: 'TECH_LEAD' },
    'Gerente de TI / Infraestructura': { descalifica: false, codigo: 'IT_MGMT' },
    'Otro rol dentro de la empresa': { descalifica: false, codigo: 'OTHER_ROLE' },
    'Estudiante / Consultor Independiente / Freelance': { descalifica: true, codigo: 'UNQUALIFIED_ROLE' },
  },
  industria: {
    'Software / SaaS / Plataformas Digitales': { descalifica: false, prioridad: 'alta', codigo: 'SOFTWARE_SAAS' },
    'Servicios de TI / BPO / Contact Centers': { descalifica: false, prioridad: 'alta', codigo: 'IT_SERVICES_BPO' },
    'FinTech / E-commerce / AdTech': { descalifica: false, prioridad: 'alta', codigo: 'FINTECH_ECOMMERCE' },
    'Comercio / Retail / Servicios Tradicionales': {
      descalifica: false,
      prioridad: 'media_baja',
      codigo: 'TRADITIONAL_BUSINESS',
    },
    'Otro sector': { descalifica: false, prioridad: 'en_revision', codigo: 'OTHER_INDUSTRY' },
  },
};

// Recibe las 4 respuestas del quiz ([{ pregunta, respuesta, detalle? }, ...])
// y devuelve el resultado global: si califica, con qué `prioridad`; si no,
// con un `motivoDescalificacion` legible para guardar en `contactos`. Cada
// respuesta se devuelve anotada con su propio `descalifica`, lista para
// guardar en `respuestas_quiz` cuando el lead califica.
//
// `detalle` es el texto libre opcional de la Pregunta 2 cuando se elige
// "Otros proveedores / Hosting tradicional" — no participa en la
// calificación, solo se agrega al motivo de descalificación.
export function evaluateQualification(respuestas) {
  if (!Array.isArray(respuestas)) {
    throw new Error('respuestas debe ser un arreglo');
  }

  const preguntasRespondidas = new Set(respuestas.map((r) => r?.pregunta));
  const faltantes = QUIZ_PREGUNTAS.filter((p) => !preguntasRespondidas.has(p));
  if (faltantes.length > 0) {
    throw new Error(`Faltan respuestas para: ${faltantes.join(', ')}`);
  }

  const evaluadas = respuestas.map(({ pregunta, respuesta, detalle }) => {
    if (typeof pregunta !== 'string' || typeof respuesta !== 'string' || !respuesta.trim()) {
      throw new Error('Cada respuesta debe tener pregunta y respuesta válidas');
    }
    const opcion = OPCIONES[pregunta]?.[respuesta];
    if (!opcion) {
      throw new Error(`Respuesta inválida para "${pregunta}": "${respuesta}"`);
    }
    if (detalle !== undefined && detalle !== null && typeof detalle !== 'string') {
      throw new Error('detalle debe ser texto');
    }
    return {
      pregunta,
      respuesta,
      descalifica: opcion.descalifica,
      codigo: opcion.codigo,
      detalle: typeof detalle === 'string' && detalle.trim() ? detalle.trim() : null,
    };
  });

  const calificado = evaluadas.every((r) => !r.descalifica);

  let prioridad = null;
  let motivoDescalificacion = null;

  if (calificado) {
    const presupuesto = evaluadas.find((r) => r.pregunta === 'inversion_nube');
    const industria = evaluadas.find((r) => r.pregunta === 'industria');
    // El presupuesto VIP manda sobre la prioridad de industria, sin
    // importar cuál sea (Fase 16, regla 3 del PM).
    prioridad =
      presupuesto.respuesta === PRESUPUESTO_VIP
        ? 'vip'
        : OPCIONES.industria[industria.respuesta].prioridad;
  } else {
    motivoDescalificacion = evaluadas
      .filter((r) => r.descalifica)
      .map((r) => `${r.pregunta}: ${r.respuesta}${r.detalle ? ` (especificado: ${r.detalle})` : ''}`)
      .join(' | ');
  }

  return { calificado, prioridad, motivoDescalificacion, respuestas: evaluadas };
}
