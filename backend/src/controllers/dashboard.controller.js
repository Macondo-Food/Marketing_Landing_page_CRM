import pool from '../db/connection.js';

// Estados que cuentan como "llegó a agendado o más allá" del embudo.
const ESTADOS_AGENDADO_O_SUPERIOR = [
  'agendado',
  'con_requisitos',
  'sin_requisitos_reunion',
  'reunion_cierre',
  'venta_servicio',
];

function round1(n) {
  return Math.round(n * 10) / 10;
}

export async function getDashboard(req, res) {
  try {
    const { landing } = req.query;
    const whereLanding = landing ? 'WHERE landing = ?' : '';
    const landingParam = landing ? [landing] : [];

    const [[{ totalLeads }]] = await pool.query(
      `SELECT COUNT(*) AS totalLeads FROM leads ${whereLanding}`,
      landingParam
    );
    const [[{ calificados }]] = await pool.query(
      `SELECT COUNT(*) AS calificados FROM leads ${landing ? 'WHERE landing = ? AND calificado = 1' : 'WHERE calificado = 1'}`,
      landingParam
    );
    const placeholders = ESTADOS_AGENDADO_O_SUPERIOR.map(() => '?').join(',');
    const [[{ agendadosOSuperior }]] = await pool.query(
      `SELECT COUNT(*) AS agendadosOSuperior FROM leads WHERE estado IN (${placeholders})${landing ? ' AND landing = ?' : ''}`,
      [...ESTADOS_AGENDADO_O_SUPERIOR, ...landingParam]
    );

    const total = Number(totalLeads);
    const calificadosNum = Number(calificados);
    const agendadosNum = Number(agendadosOSuperior);
    const descalificados = total - calificadosNum;

    const resumen = {
      totalLeads: total,
      calificados: calificadosNum,
      descalificados,
      porcentajeCalificados: total > 0 ? round1((calificadosNum / total) * 100) : 0,
      agendadosOSuperior: agendadosNum,
      porcentajeAgendadosOSuperior: total > 0 ? round1((agendadosNum / total) * 100) : 0,
    };

    // El % de cada respuesta se calcula sobre el total de leads que
    // respondieron ESA pregunta, no sobre el total general de leads.
    // Si hay filtro por landing, solo se cuentan respuestas de leads de esa landing.
    const [rows] = await pool.query(
      `SELECT rq.pregunta, rq.respuesta, COUNT(*) AS total
       FROM respuestas_quiz rq
       ${landing ? 'JOIN leads l ON l.id = rq.lead_id WHERE l.landing = ?' : ''}
       GROUP BY rq.pregunta, rq.respuesta
       ORDER BY rq.pregunta, total DESC`,
      landingParam
    );

    const totalesPorPregunta = {};
    for (const row of rows) {
      const t = Number(row.total);
      totalesPorPregunta[row.pregunta] = (totalesPorPregunta[row.pregunta] ?? 0) + t;
    }

    const respuestas = {};
    for (const row of rows) {
      const t = Number(row.total);
      const totalPregunta = totalesPorPregunta[row.pregunta];
      if (!respuestas[row.pregunta]) respuestas[row.pregunta] = [];
      respuestas[row.pregunta].push({
        respuesta: row.respuesta,
        total: t,
        porcentaje: round1((t / totalPregunta) * 100),
      });
    }

    res.json({ resumen, respuestas });
  } catch (err) {
    console.error('[dashboard] error al calcular el dashboard:', err);
    res.status(500).json({ error: 'Error al calcular el dashboard' });
  }
}

// Rendimiento por campaña (utm_source + utm_campaign). Se agrupa por las
// columnas crudas (NULL agrupa con NULL correctamente en MySQL) y se
// muestra "Sin campaña" solo al armar la respuesta, no como parte del
// agrupamiento en sí.
export async function getCampanas(req, res) {
  try {
    const { landing } = req.query;
    const placeholders = ESTADOS_AGENDADO_O_SUPERIOR.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT
         utm_source,
         utm_campaign,
         COUNT(*) AS total,
         SUM(calificado = 1) AS calificados,
         SUM(estado IN (${placeholders})) AS agendados
       FROM leads
       ${landing ? 'WHERE landing = ?' : ''}
       GROUP BY utm_source, utm_campaign
       ORDER BY total DESC`,
      [...ESTADOS_AGENDADO_O_SUPERIOR, ...(landing ? [landing] : [])]
    );

    const campanas = rows.map((row) => {
      const total = Number(row.total);
      const agendados = Number(row.agendados);
      return {
        utm_source: row.utm_source ?? 'directo',
        utm_campaign: row.utm_campaign ?? 'Sin campaña',
        total,
        calificados: Number(row.calificados),
        agendados,
        porcentajeConversion: total > 0 ? round1((agendados / total) * 100) : 0,
      };
    });

    res.json({ campanas });
  } catch (err) {
    console.error('[dashboard] error al calcular el reporte de campañas:', err);
    res.status(500).json({ error: 'Error al calcular el reporte de campañas' });
  }
}

// Rendimiento por landing (#28). Agrupa leads, calificados, agendados
// y tasa de conversión por cada landing registrada.
export async function getLandings(req, res) {
  try {
    const placeholders = ESTADOS_AGENDADO_O_SUPERIOR.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT
         landing,
         COUNT(*) AS total,
         SUM(calificado = 1) AS calificados,
         SUM(estado IN (${placeholders})) AS agendados
       FROM leads
       GROUP BY landing
       ORDER BY total DESC`,
      ESTADOS_AGENDADO_O_SUPERIOR
    );

    const landings = rows.map((row) => {
      const total = Number(row.total);
      const agendados = Number(row.agendados);
      return {
        landing: row.landing,
        total,
        calificados: Number(row.calificados),
        agendados,
        porcentajeCalificados: total > 0 ? round1((Number(row.calificados) / total) * 100) : 0,
        porcentajeConversion: total > 0 ? round1((agendados / total) * 100) : 0,
      };
    });

    res.json({ landings, paginasActivas: landings.length });
  } catch (err) {
    console.error('[dashboard] error al calcular el reporte de landings:', err);
    res.status(500).json({ error: 'Error al calcular el reporte de landings' });
  }
}
