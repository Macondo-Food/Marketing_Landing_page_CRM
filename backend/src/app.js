import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import leadsRouter from './routes/leads.routes.js';
import calendarRouter from './routes/calendar.routes.js';
import authRouter from './routes/auth.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import usuariosRouter from './routes/usuarios.routes.js';

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

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[backend] escuchando en http://localhost:${PORT}`);
});

export default app;
