// Misma lógica de calificación que frontend/src/components/QuizPopup.jsx
// (sección 3 del plan, actualizada en la Fase 11). Se reevalúa aquí en el
// servidor: los flags que puedan venir del cliente en `respuestas` se
// ignoran, se derivan de nuevo a partir de `pregunta` + `respuesta` contra
// estas listas.
export const QUIZ_PREGUNTAS = ['inversion_nube', 'proveedor_nube', 'cargo', 'industria'];

// Solo la Pregunta 4 (industria) determina `prioridad` cuando el lead
// califica. Las otras 3 preguntas solo pueden descalificar.
const OPCIONES = {
  inversion_nube: {
    'Menos de $3,000 USD/mes': { descalifica: true },
    '$3,000 - $5,000 USD/mes': { descalifica: false },
    '$5,000 - $10,000 USD/mes': { descalifica: false },
    'Más de $10,000 USD/mes': { descalifica: false },
  },
  proveedor_nube: {
    AWS: { descalifica: false },
    'Oracle Cloud (OCI)': { descalifica: false },
    'Microsoft Azure': { descalifica: false },
    'Google Cloud Platform (GCP)': { descalifica: false },
    'IBM Cloud': { descalifica: false },
    'Huawei Cloud': { descalifica: false },
    'Otros proveedores / Hosting tradicional': { descalifica: true },
  },
  cargo: {
    'CEO / Founder / Director General': { descalifica: false },
    'CFO / Director Financiero': { descalifica: false },
    'CTO / VP de Ingeniería / Architect Cloud': { descalifica: false },
    'Gerente de TI / Infraestructura': { descalifica: false },
    'Estudiante / Consultor Independiente / Freelance': { descalifica: true },
  },
  industria: {
    'Software / SaaS / Plataformas Digitales': { descalifica: false, prioridad: 'alta' },
    'Servicios de TI / BPO / Contact Centers': { descalifica: false, prioridad: 'alta' },
    'FinTech / E-commerce / AdTech': { descalifica: false, prioridad: 'media_alta' },
    'Comercio / Retail / Servicios Tradicionales': { descalifica: true },
    'Otro sector': { descalifica: false, prioridad: 'en_revision' },
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
      detalle: typeof detalle === 'string' && detalle.trim() ? detalle.trim() : null,
    };
  });

  const calificado = evaluadas.every((r) => !r.descalifica);

  let prioridad = null;
  let motivoDescalificacion = null;

  if (calificado) {
    const industria = evaluadas.find((r) => r.pregunta === 'industria');
    prioridad = OPCIONES.industria[industria.respuesta].prioridad;
  } else {
    motivoDescalificacion = evaluadas
      .filter((r) => r.descalifica)
      .map((r) => `${r.pregunta}: ${r.respuesta}${r.detalle ? ` (especificado: ${r.detalle})` : ''}`)
      .join(' | ');
  }

  return { calificado, prioridad, motivoDescalificacion, respuestas: evaluadas };
}
