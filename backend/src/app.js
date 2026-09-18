import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import migrate from './db/migrate.js';
import pool from './db/connection.js';
import leadsRouter from './routes/leads.routes.js';
import calendarRouter from './routes/calendar.routes.js';
import authRouter from './routes/auth.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import usuariosRouter from './routes/usuarios.routes.js';
import utmRouter from './routes/utm.routes.js';
import contactosRouter from './routes/contactos.routes.js';
import pixelRouter from './routes/pixel.routes.js';
import landingRouter from './routes/landing.routes.js';
import landingAssetsRouter from './routes/landing-assets.routes.js';
import landingsPublicasRouter from './routes/landings-publicas.routes.js';

const app = express();

// Detrás de nginx: sin esto, express-rate-limit usa la IP de nginx para
// todos los visitantes en vez de la IP real de cada uno.
app.set('trust proxy', 1);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// --- Monitoreo (#31) ---
const startTime = Date.now();
let requestCount = 0;
let errorCount = 0;

app.use((req, res, next) => {
  requestCount++;
  res.on('finish', () => {
    if (res.statusCode >= 500) errorCount++;
  });
  next();
});

app.get('/health', async (req, res) => {
  let dbStatus = 'ok';
  try {
    await pool.query('SELECT 1');
  } catch {
    dbStatus = 'error';
  }

  const uptimeSec = Math.floor(process.uptime());
  const totalRequests = requestCount;
  const errorRate = totalRequests > 0
    ? Math.round((errorCount / totalRequests) * 10000) / 100
    : 0;

  const status = dbStatus === 'ok' ? 'ok' : 'degraded';
  res.json({
    status,
    uptime: uptimeSec,
    since: new Date(startTime).toISOString(),
    db: dbStatus,
    requests: { total: totalRequests, errors: errorCount, errorRate: `${errorRate}%` },
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
  });
});

app.use('/leads', leadsRouter);
app.use('/calendar', calendarRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/usuarios', usuariosRouter);
app.use('/utm-urls', utmRouter);
app.use('/contactos', contactosRouter);
app.use('/pixels', pixelRouter);
app.use('/landings', landingRouter);
app.use('/landings', landingAssetsRouter);

// Assets de landings (imágenes subidas al editor)
app.use('/uploads', express.static('uploads'));

// Landings publicadas del builder — deben ir ANTES de la SPA estática
// para que Express busque el slug en DB antes de servir index.html.
app.use('/', landingsPublicasRouter);

const PORT = process.env.PORT || 3001;

// Falla rápido y visible si la migración no puede correr — el servidor no
// debe arrancar sobre una base de datos con estructura incompleta.
try {
  await migrate();
} catch (err) {
  console.error('[migrate] fallo al migrar la base de datos, el servidor no va a arrancar:');
  console.error(err);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`[backend] escuchando en http://localhost:${PORT}`);
});

export default app;
