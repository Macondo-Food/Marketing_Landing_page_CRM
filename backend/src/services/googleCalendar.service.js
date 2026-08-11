import 'dotenv/config';
import { google } from 'googleapis';

// Horario de atención usado para calcular disponibilidad (sección 8.6 del plan).
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 17;
const SLOT_MINUTES = 30;
const BUSINESS_DAYS_AHEAD = 7;

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

// Próximos `count` días hábiles (lunes a viernes) empezando hoy (hora Bogotá).
function getUpcomingBusinessDays(count) {
  const { year, month, date } = getBogotaNowFields();
  const days = [];
  let cursor = new Date(Date.UTC(year, month, date));

  while (days.length < count) {
    const dayOfWeek = cursor.getUTCDay(); // 0 = domingo, 6 = sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
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

// Slots de SLOT_MINUTES dentro del horario de atención para un día dado,
// descartando los que ya quedaron en el pasado.
function getSlotsForDay({ year, month, date }, now) {
  const slots = [];
  const totalMinutes = (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60;

  for (let offset = 0; offset < totalMinutes; offset += SLOT_MINUTES) {
    const hour = BUSINESS_START_HOUR + Math.floor(offset / 60);
    const minute = offset % 60;
    const start = bogotaWallTimeToUtcDate(year, month, date, hour, minute);
    if (start < now) continue;
    const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
    slots.push({ start, end });
  }

  return slots;
}

function getCandidateSlots() {
  const now = new Date();
  return getUpcomingBusinessDays(BUSINESS_DAYS_AHEAD).flatMap((day) => getSlotsForDay(day, now));
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

// Slots libres de los próximos BUSINESS_DAYS_AHEAD días hábiles, cruzados
// contra el freebusy real de Google Calendar.
export async function getAvailableSlots() {
  const candidateSlots = getCandidateSlots();
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
