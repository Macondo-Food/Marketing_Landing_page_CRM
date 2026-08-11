import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import leadsRouter from './routes/leads.routes.js';
import calendarRouter from './routes/calendar.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/leads', leadsRouter);
app.use('/calendar', calendarRouter);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[backend] escuchando en http://localhost:${PORT}`);
});

export default app;
