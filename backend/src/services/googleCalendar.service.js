import 'dotenv/config';
import { google } from 'googleapis';
import pool from '../db/connection.js';

// Horario de atención usado para calcular disponibilidad (Fase 13: ya no es
// 9-17 corrido, son 2 franjas separadas — el resto del día "siempre está
// ocupado" a propósito, ni se consulta contra Google Calendar).
const BUSINESS_WINDOWS = [
  { startHour: 10, endHour: 12 },
  { startHour: 14, endHour: 16 },
];
const SLOT_MINUTES = 30;

// Colchón de preparación (Fase 13): si hoy es X, el día hábil X+1 se salta
// por completo (no se ofrece) y recién X+2 empieza a mostrarse. Se muestran
// DISPLAY_BUSINESS_DAYS días hábiles a partir de ahí.
const PREP_BUSINESS_DAYS = 1;
const DISPLAY_BUSINESS_DAYS = 4;

// America/Bogota es UTC-5 todo el año (Colombia no observa horario de verano),
// así que el offset se puede tratar como fijo sin depender de una librería de
// zonas horarias.
const BOGOTA_UTC_OFFSET_HOURS = 5;

function getOAuth2Client() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oAuth2Client;
}

function getCalendarClient() {
  return google.calendar({ version: 'v3', auth: getOAuth2Client() });
}

function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || 'primary';
}

// Convierte una hora de pared en Bogotá (año, mes 0-based, día, hora, minuto)
// al instante UTC real que representa.
function bogotaWallTimeToUtcDate(year, month, day, hour, minute) {
  return new Date(Date.UTC(year, month, day, hour, minute) + BOGOTA_UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

// Lee la fecha/hora actual como si el reloj del sistema estuviera en Bogotá,
// sin depender de la zona horaria configurada en el servidor.
function getBogotaNowFields() {
  const shifted = new Date(Date.now() - BOGOTA_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    date: shifted.getUTCDate(),
  };
}

function formatDateKey(year, month, date) {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(date).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Fechas de festivos_colombia como set de claves 'YYYY-MM-DD', para excluirlas
// del conteo de días hábiles igual que un fin de semana.
async function getHolidayKeys() {
  const [rows] = await pool.query(
    "SELECT DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha FROM festivos_colombia"
  );
  return new Set(rows.map((r) => r.fecha));
}

// Próximos `count` días hábiles (lunes a viernes, sin festivos) empezando
// mañana (hora Bogotá) — hoy nunca es un día ofrecido, el colchón de
// preparación ya asume que se necesita al menos 1 día hábil completo.
function getBusinessDaysAfterToday(count, holidayKeys) {
  const { year, month, date } = getBogotaNowFields();
  const days = [];
  let cursor = new Date(Date.UTC(year, month, date + 1));

  while (days.length < count) {
    const dayOfWeek = cursor.getUTCDay(); // 0 = domingo, 6 = sábado
    const key = formatDateKey(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate());
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayKeys.has(key)) {
      days.push({
        year: cursor.getUTCFullYear(),
        month: cursor.getUTCMonth(),
        date: cursor.getUTCDate(),
      });
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return days;
}

// Slots de SLOT_MINUTES dentro de las franjas de BUSINESS_WINDOWS para un
// día dado, descartando los que ya quedaron en el pasado.
function getSlotsForDay({ year, month, date }, now) {
  const slots = [];

  for (const window of BUSINESS_WINDOWS) {
    const totalMinutes = (window.endHour - window.startHour) * 60;
    for (let offset = 0; offset < totalMinutes; offset += SLOT_MINUTES) {
      const hour = window.startHour + Math.floor(offset / 60);
      const minute = offset % 60;
      const start = bogotaWallTimeToUtcDate(year, month, date, hour, minute);
      if (start < now) continue;
      const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
      slots.push({ start, end });
    }
  }

  return slots;
}

// Universo de slots candidatos: se calculan primero los PREP_BUSINESS_DAYS +
// DISPLAY_BUSINESS_DAYS próximos días hábiles (ya excluyendo fines de semana
// y festivos_colombia), se descarta el/los primeros como "colchón de
// preparación", y solo con los DISPLAY_BUSINESS_DAYS restantes se generan
// las franjas horarias — el cruce contra freebusy real de Google pasa
// después, en getAvailableSlots.
async function getCandidateSlots() {
  const holidayKeys = await getHolidayKeys();
  const now = new Date();
  const businessDays = getBusinessDaysAfterToday(
    PREP_BUSINESS_DAYS + DISPLAY_BUSINESS_DAYS,
    holidayKeys
  );
  const displayDays = businessDays.slice(PREP_BUSINESS_DAYS);
  return displayDays.flatMap((day) => getSlotsForDay(day, now));
}

function overlaps(slot, busyRange) {
  return slot.start < busyRange.end && slot.end > busyRange.start;
}

async function getBusyRanges(timeMin, timeMax) {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busy = response.data.calendars?.[calendarId]?.busy ?? [];
  return busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

// Slots libres de los DISPLAY_BUSINESS_DAYS días hábiles mostrados (después
// del colchón de preparación), cruzados contra el freebusy real de Google
// Calendar.
export async function getAvailableSlots() {
  const candidateSlots = await getCandidateSlots();
  if (candidateSlots.length === 0) return [];

  const timeMin = candidateSlots[0].start;
  const timeMax = candidateSlots[candidateSlots.length - 1].end;
  const busyRanges = await getBusyRanges(timeMin, timeMax);

  return candidateSlots
    .filter((slot) => !busyRanges.some((busy) => overlaps(slot, busy)))
    .map((slot) => ({ start: slot.start.toISOString(), end: slot.end.toISOString() }));
}

// Revalida un slot puntual contra el freebusy justo antes de agendar, para
// evitar dobles reservas si dos leads intentan tomar el mismo horario.
export async function isSlotFree(start, end) {
  const busyRanges = await getBusyRanges(start, end);
  return !busyRanges.some((busy) => overlaps({ start, end }, busy));
}

// Crea el evento con Google Meet automático e invita al lead.
export async function createCalendarEvent({ start, end, leadEmail, leadName }) {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  const response = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary: `Llamada Macondo Softwares — ${leadName}`,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [{ email: leadEmail }],
      conferenceData: {
        createRequest: {
          requestId: `vsl-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  return response.data;
}
