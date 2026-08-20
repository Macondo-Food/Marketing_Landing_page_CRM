import { useCallback, useEffect, useState } from 'react';
import { agendarReunion, getDisponibilidad } from '../services/api.js';

const dayFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const timeFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDay(isoString) {
  return capitalize(dayFormatter.format(new Date(isoString)));
}

function formatTime(isoString) {
  return timeFormatter.format(new Date(isoString));
}

// 'YYYY-MM-DDTHH:MM:SS.sssZ' -> 'YYYYMMDDTHHMMSSZ' (formato que espera el
// link de Google Calendar en el parámetro `dates`).
function toGoogleCalendarUtc(isoString) {
  return new Date(isoString).toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function buildGoogleCalendarUrl({ start, end }, meetLink) {
  const details = meetLink
    ? `Link de Google Meet: ${meetLink}`
    : 'Reunión con Macondo Softwares.';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Llamada con Macondo Softwares',
    dates: `${toGoogleCalendarUtc(start)}/${toGoogleCalendarUtc(end)}`,
    details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Agrupa los slots (ya vienen ordenados cronológicamente desde el backend)
// por día, en el orden en que aparecen.
function groupSlotsByDay(slots) {
  const groups = [];
  const byLabel = new Map();

  slots.forEach((slot) => {
    const label = formatDay(slot.start);
    if (!byLabel.has(label)) {
      const group = { label, slots: [] };
      byLabel.set(label, group);
      groups.push(group);
    }
    byLabel.get(label).slots.push(slot);
  });

  return groups;
}

const eyebrowStyle = {
  margin: '0 0 6px',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: '#F8F522',
};

const dayLabelStyle = {
  margin: '0 0 8px',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '.03em',
  color: '#B4B4B4',
};

const primaryButtonStyle = {
  padding: '12px 28px',
  borderRadius: 999,
  border: 'none',
  background: '#F8F522',
  color: '#000',
  cursor: 'pointer',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 700,
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
};

const secondaryButtonStyle = {
  padding: '12px 20px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,.16)',
  background: 'transparent',
  color: '#fff',
  cursor: 'pointer',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 600,
  fontSize: 13,
};

export default function ScheduleSlots({ leadId, contactEmail, onClose }) {
  const [slots, setSlots] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading'); // loading | ready | error
  const [loadError, setLoadError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [booked, setBooked] = useState(null); // { eventId, meetLink, slot }

  const loadSlots = useCallback(() => {
    setLoadStatus('loading');
    setLoadError('');
    return getDisponibilidad()
      .then((data) => {
        setSlots(data);
        setLoadStatus('ready');
      })
      .catch((err) => {
        setLoadError(err.message);
        setLoadStatus('error');
      });
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  function handleConfirm() {
    if (!selectedSlot) return;
    setConfirming(true);
    setConfirmError('');

    agendarReunion(leadId, selectedSlot)
      .then((data) => {
        setBooked({ ...data, slot: selectedSlot });
      })
      .catch((err) => {
        if (err.status === 409) {
          setConfirmError('Ese horario ya no está disponible. Elige otro de la lista actualizada.');
          setSelectedSlot(null);
          loadSlots();
        } else {
          setConfirmError(err.message);
        }
      })
      .finally(() => setConfirming(false));
  }

  if (booked) {
    return (
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <p style={eyebrowStyle}>¡Reunión agendada!</p>
        <h3 style={{ margin: '0 0 10px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 22 }}>
          Nos vemos el {formatDay(booked.slot.start)} a las {formatTime(booked.slot.start)}
        </h3>
        <p style={{ margin: '0 0 24px', color: '#B4B4B4', fontSize: 14, lineHeight: 1.6 }}>
          Te enviamos la invitación con los detalles a <strong>{contactEmail}</strong>.
        </p>
        <a
          href={buildGoogleCalendarUrl(booked.slot, booked.meetLink)}
          target="_blank"
          rel="noreferrer"
          style={{ ...primaryButtonStyle, display: 'inline-block', textDecoration: 'none', marginBottom: 18 }}
        >
          Agregar a mi calendario
        </a>
        <div>
          <button onClick={onClose} style={secondaryButtonStyle}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <p style={eyebrowStyle}>¡Calificas!</p>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 24 }}>
        Elige un horario para tu llamada
      </h3>

      {loadStatus === 'loading' && (
        <p style={{ color: '#B4B4B4', fontSize: 14, padding: '20px 0' }}>Cargando horarios disponibles…</p>
      )}

      {loadStatus === 'error' && (
        <div style={{ padding: '12px 0' }}>
          <p style={{ color: '#FF6B6B', fontSize: 14, margin: '0 0 16px' }}>{loadError}</p>
          <button onClick={loadSlots} style={primaryButtonStyle}>
            Reintentar
          </button>
        </div>
      )}

      {loadStatus === 'ready' && slots.length === 0 && (
        <p style={{ color: '#B4B4B4', fontSize: 14, padding: '20px 0' }}>
          No hay horarios disponibles por ahora. Te contactaremos directamente para coordinar.
        </p>
      )}

      {loadStatus === 'ready' && slots.length > 0 && (
        <>
          <div style={{ textAlign: 'left', maxHeight: 320, overflowY: 'auto', marginBottom: 20, paddingRight: 4 }}>
            {groupSlotsByDay(slots).map((group) => (
              <div key={group.label} style={{ marginBottom: 18 }}>
                <p style={dayLabelStyle}>{group.label}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
                  {group.slots.map((slot) => {
                    const isSelected = selectedSlot?.start === slot.start;
                    return (
                      <button
                        key={slot.start}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setConfirmError('');
                        }}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 8,
                          border: `1px solid ${isSelected ? '#F8F522' : 'rgba(255,255,255,.16)'}`,
                          background: isSelected ? 'rgba(248,245,34,.08)' : 'transparent',
                          color: '#fff',
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        {formatTime(slot.start)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {confirmError && (
            <p style={{ color: '#FF6B6B', fontSize: 13, margin: '0 0 12px' }}>{confirmError}</p>
          )}

          <button
            onClick={handleConfirm}
            disabled={!selectedSlot || confirming}
            style={{
              ...primaryButtonStyle,
              background: !selectedSlot || confirming ? 'rgba(248,245,34,.35)' : '#F8F522',
              cursor: !selectedSlot || confirming ? 'default' : 'pointer',
            }}
          >
            {confirming ? 'Agendando…' : 'Confirmar horario'}
          </button>
        </>
      )}
    </div>
  );
}
