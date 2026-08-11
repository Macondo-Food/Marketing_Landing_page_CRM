// Misma lógica de calificación que frontend/src/components/QuizPopup.jsx
// (sección 3 del plan). Se reevalúa aquí en el servidor: el flag `descalifica`
// que pueda venir del cliente en `respuestas` se ignora, se deriva de nuevo
// a partir de `pregunta` + `respuesta` contra estas listas.
export const QUIZ_PREGUNTAS = ['inversion_nube', 'proveedor_nube', 'cargo', 'industria'];

const RESPUESTAS_DESCALIFICANTES = {
  inversion_nube: new Set(['Menos de $3,000 USD/mes']),
  proveedor_nube: new Set([
    'Hosting tradicional / económico (DigitalOcean, Hetzner, cPanel, etc.)',
  ]),
  cargo: new Set(['Estudiante / Consultor Independiente / Freelance']),
  industria: new Set([
    'Empresa tradicional / Comercio físico / Servicios no tecnológicos',
  ]),
};

// Recibe las 4 respuestas del quiz ([{ pregunta, respuesta }, ...]) y devuelve
// el resultado global de calificación junto con cada respuesta anotada con su
// propio `descalifica`, listas para guardar en respuestas_quiz.
export function evaluateQualification(respuestas) {
  if (!Array.isArray(respuestas)) {
    throw new Error('respuestas debe ser un arreglo');
  }

  const preguntasRespondidas = new Set(respuestas.map((r) => r?.pregunta));
  const faltantes = QUIZ_PREGUNTAS.filter((p) => !preguntasRespondidas.has(p));
  if (faltantes.length > 0) {
    throw new Error(`Faltan respuestas para: ${faltantes.join(', ')}`);
  }

  const evaluadas = respuestas.map(({ pregunta, respuesta }) => {
    if (typeof pregunta !== 'string' || typeof respuesta !== 'string' || !respuesta.trim()) {
      throw new Error('Cada respuesta debe tener pregunta y respuesta válidas');
    }
    const descalifica = RESPUESTAS_DESCALIFICANTES[pregunta]?.has(respuesta) ?? false;
    return { pregunta, respuesta, descalifica };
  });

  const calificado = evaluadas.every((r) => !r.descalifica);

  return { calificado, respuestas: evaluadas };
}
