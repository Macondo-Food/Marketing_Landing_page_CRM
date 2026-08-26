import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import migrate from './db/migrate.js';
import leadsRouter from './routes/leads.routes.js';
import calendarRouter from './routes/calendar.routes.js';
import authRouter from './routes/auth.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import usuariosRouter from './routes/usuarios.routes.js';
import utmRouter from './routes/utm.routes.js';
import contactosRouter from './routes/contactos.routes.js';

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/leads', leadsRouter);
app.use('/calendar', calendarRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/usuarios', usuariosRouter);
app.use('/utm-urls', utmRouter);
app.use('/contactos', contactosRouter);

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
