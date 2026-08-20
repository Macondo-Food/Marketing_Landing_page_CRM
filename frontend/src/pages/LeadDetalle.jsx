import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getLeadDetalle, updateLead } from '../services/api.js';
import Login from './Login.jsx';

const ESTADO_LABELS = {
  descalificado: 'Descalificado',
  calificado: 'Calificado',
  agendado: 'Agendado',
  con_requisitos: 'Con requisitos',
  sin_requisitos_reunion: 'Sin requisitos (reunión)',
  reunion_cierre: 'Reunión de cierre',
  venta_servicio: 'Venta / servicio',
};

const ESTADO_COLORS = {
  descalificado: { bg: 'rgba(107,107,107,.12)', text: '#6B6B6B' },
  calificado: { bg: 'rgba(217,164,6,.15)', text: '#9A7B0A' },
  agendado: { bg: 'rgba(37,99,235,.12)', text: '#2563EB' },
  con_requisitos: { bg: 'rgba(14,116,144,.12)', text: '#0E7490' },
  sin_requisitos_reunion: { bg: 'rgba(180,83,9,.12)', text: '#B45309' },
  reunion_cierre: { bg: 'rgba(124,58,237,.12)', text: '#7C3AED' },
  venta_servicio: { bg: 'rgba(21,128,61,.12)', text: '#15803D' },
};

const PRIORIDAD_LABELS = {
  vip: 'VIP',
  alta: 'Alta',
  media_baja: 'Media-baja',
  en_revision: 'En revisión',
};

const PRIORIDAD_COLORS = {
  vip: { bg: 'rgba(184,134,11,.15)', text: '#8A6D0B' },
  alta: { bg: 'rgba(21,128,61,.12)', text: '#15803D' },
  media_baja: { bg: 'rgba(202,138,4,.15)', text: '#CA8A04' },
  en_revision: { bg: 'rgba(107,107,107,.12)', text: '#6B6B6B' },
};

const PREGUNTA_LABELS = {
  inversion_nube: '¿Cuál es tu inversión mensual en infraestructura de nube?',
  proveedor_nube: '¿Cuál es tu proveedor de nube principal?',
  cargo: '¿Cuál es tu cargo en la organización?',
  industria: '¿Cuál es tu sector / industria?',
};

function Badge({ label, color }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 999,
        background: color.bg,
        color: color.text,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function formatFecha(isoString) {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoString));
}

const reunionDayFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const reunionTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatReunionFecha(isoString) {
  const date = new Date(isoString);
  return `${capitalize(reunionDayFormatter.format(date))}, ${reunionTimeFormatter.format(date)}`;
}

const cardStyle = {
  border: '1px solid #E4E4E7',
  borderRadius: 10,
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
  padding: '20px 22px',
  marginBottom: 20,
};

const cardTitleStyle = {
  margin: '0 0 16px',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  color: '#6B6B6B',
};

const fieldLabelStyle = {
  margin: '0 0 4px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  color: '#9A9A9A',
};

const fieldValueStyle = {
  margin: '0 0 16px',
  fontSize: 14,
  color: '#1F1F1F',
};

function Field({ label, value }) {
  return (
    <div>
      <p style={fieldLabelStyle}>{label}</p>
      <p style={fieldValueStyle}>{value ?? '—'}</p>
    </div>
  );
}

const editInputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #DADADE',
  background: '#fff',
  color: '#1F1F1F',
  fontSize: 13,
  fontFamily: "'Source Sans 3', system-ui, sans-serif",
};

const smallButtonStyle = {
  padding: '6px 14px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 600,
  fontSize: 12,
};

function EditField({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={fieldLabelStyle}>{label}</p>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={editInputStyle} />
    </div>
  );
}

function LeadDetalleContent({ leadId, onClose, onLeadUpdated }) {
  const { token, logout } = useAuth();
  const [lead, setLead] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState({ nombre: '', email: '', telefono: '', empresa: '' });
  const [editStatus, setEditStatus] = useState('idle'); // idle | saving | error
  const [editError, setEditError] = useState('');

  const loadLead = useCallback(() => {
    setStatus('loading');
    setError('');
    return getLeadDetalle(token, leadId)
      .then((data) => {
        setLead(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (err.status === 401) {
          logout();
          return;
        }
        if (err.status === 404) {
          setStatus('notfound');
          return;
        }
        setError(err.message);
        setStatus('error');
      });
  }, [token, leadId, logout]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleStartEdit() {
    setEditValues({
      nombre: lead.nombre,
      email: lead.email,
      telefono: lead.telefono,
      empresa: lead.empresa,
    });
    setEditError('');
    setEditStatus('idle');
    setEditMode(true);
  }

  function handleCancelEdit() {
    setEditMode(false);
    setEditError('');
    setEditStatus('idle');
  }

  function handleSaveEdit() {
    const payload = {
      nombre: editValues.nombre.trim(),
      email: editValues.email.trim(),
      telefono: editValues.telefono.trim(),
      empresa: editValues.empresa.trim(),
    };

    setEditStatus('saving');
    setEditError('');

    updateLead(token, leadId, payload)
      .then((updated) => {
        setLead((prev) => ({ ...prev, ...updated }));
        onLeadUpdated?.(updated);
        setEditMode(false);
        setEditStatus('idle');
      })
      .catch((err) => {
        if (err.status === 401) {
          logout();
          return;
        }
        setEditError(err.message);
        setEditStatus('error');
      });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,15,15,.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 20px',
        overflowY: 'auto',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 720,
          background: '#F9F9F9',
          borderRadius: 14,
          boxShadow: '0 10px 40px rgba(0,0,0,.25)',
          padding: '28px 28px 4px',
          color: '#1F1F1F',
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            color: '#6B6B6B',
            fontSize: 24,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ×
        </button>

        <p
          style={{
            margin: '0 0 4px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: '#714B67',
          }}
        >
          CRM Macondo
        </p>
        <h1 style={{ margin: '0 0 20px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22 }}>
          Detalle del lead
        </h1>

        {status === 'loading' && <p style={{ color: '#6B6B6B' }}>Cargando lead…</p>}

        {status === 'notfound' && <p style={{ color: '#DC3545' }}>Este lead no existe.</p>}

        {status === 'error' && (
          <div>
            <p style={{ color: '#DC3545', marginBottom: 12 }}>{error}</p>
            <button
              onClick={loadLead}
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,.12)',
                background: '#714B67',
                color: '#fff',
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {status === 'ready' && lead && (
          <div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: editMode ? 4 : 16 }}>
                <p style={{ ...cardTitleStyle, margin: 0 }}>Datos de contacto</p>
                {!editMode && (
                  <button
                    onClick={handleStartEdit}
                    style={{
                      ...smallButtonStyle,
                      border: '1px solid #DADADE',
                      background: '#fff',
                      color: '#1F1F1F',
                    }}
                  >
                    Editar
                  </button>
                )}
              </div>

              {editMode ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px', marginTop: 12 }}>
                    <EditField
                      label="Nombre"
                      value={editValues.nombre}
                      onChange={(v) => setEditValues((prev) => ({ ...prev, nombre: v }))}
                    />
                    <EditField
                      label="Empresa"
                      value={editValues.empresa}
                      onChange={(v) => setEditValues((prev) => ({ ...prev, empresa: v }))}
                    />
                    <EditField
                      label="Email"
                      value={editValues.email}
                      onChange={(v) => setEditValues((prev) => ({ ...prev, email: v }))}
                    />
                    <EditField
                      label="Teléfono"
                      value={editValues.telefono}
                      onChange={(v) => setEditValues((prev) => ({ ...prev, telefono: v }))}
                    />
                  </div>
                  {editStatus === 'error' && (
                    <p style={{ margin: '0 0 12px', fontSize: 12, color: '#DC3545' }}>{editError}</p>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleSaveEdit}
                      disabled={editStatus === 'saving'}
                      style={{
                        ...smallButtonStyle,
                        background: editStatus === 'saving' ? '#B79AB1' : '#714B67',
                        color: '#fff',
                        cursor: editStatus === 'saving' ? 'default' : 'pointer',
                      }}
                    >
                      {editStatus === 'saving' ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={editStatus === 'saving'}
                      style={{
                        ...smallButtonStyle,
                        border: '1px solid #DADADE',
                        background: '#fff',
                        color: '#1F1F1F',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  <Field label="Nombre" value={lead.nombre} />
                  <Field label="Empresa" value={lead.empresa} />
                  <Field label="Email" value={lead.email} />
                  <Field label="Teléfono" value={lead.telefono} />
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <p style={cardTitleStyle}>Origen</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <Field label="UTM Source" value={lead.utm_source} />
                <Field label="UTM Medium" value={lead.utm_medium} />
                <Field label="UTM Campaign" value={lead.utm_campaign} />
                <Field label="UTM Content" value={lead.utm_content} />
                <Field label="UTM Term" value={lead.utm_term} />
              </div>
            </div>

            <div style={cardStyle}>
              <p style={cardTitleStyle}>Estado</p>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <p style={fieldLabelStyle}>Estado actual</p>
                  <Badge
                    label={ESTADO_LABELS[lead.estado] ?? lead.estado}
                    color={ESTADO_COLORS[lead.estado] ?? ESTADO_COLORS.descalificado}
                  />
                </div>
                {lead.prioridad && (
                  <div>
                    <p style={fieldLabelStyle}>Prioridad</p>
                    <Badge
                      label={PRIORIDAD_LABELS[lead.prioridad] ?? lead.prioridad}
                      color={PRIORIDAD_COLORS[lead.prioridad] ?? PRIORIDAD_COLORS.en_revision}
                    />
                  </div>
                )}
                <div>
                  <p style={fieldLabelStyle}>Fecha de registro</p>
                  <p style={{ ...fieldValueStyle, margin: 0 }}>{formatFecha(lead.created_at)}</p>
                </div>
                {lead.calendar_event_id && lead.reunion_fecha_hora && (
                  <div>
                    <p style={fieldLabelStyle}>Reunión agendada</p>
                    <p style={{ ...fieldValueStyle, margin: 0 }}>{formatReunionFecha(lead.reunion_fecha_hora)}</p>
                  </div>
                )}
              </div>
              <p style={{ margin: '16px 0 0', fontSize: 13, color: lead.calendar_event_id ? '#15803D' : '#6B6B6B' }}>
                {lead.calendar_event_id
                  ? 'Ya tiene una reunión agendada.'
                  : 'Todavía no tiene una reunión agendada.'}
              </p>
            </div>

            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <p style={cardTitleStyle}>Respuestas del quiz</p>
              {lead.respuestas.length === 0 ? (
                <p style={{ fontSize: 14, color: '#6B6B6B' }}>No hay respuestas registradas.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {lead.respuestas.map((r) => (
                    <div key={r.pregunta}>
                      <p style={fieldLabelStyle}>{PREGUNTA_LABELS[r.pregunta] ?? r.pregunta}</p>
                      <p style={{ ...fieldValueStyle, margin: 0 }}>
                        {r.respuesta}
                        {r.detalle ? ` (${r.detalle})` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Modal de detalle de lead: se monta por encima de la tabla en CRM.jsx
// (estado local `leadSeleccionadoId`, sin cambiar la URL) o, como fallback,
// desde la ruta /crm/leads/:id en App.jsx.
export default function LeadDetalle({ leadId, onClose, onLeadUpdated }) {
  const { token } = useAuth();
  if (!token) return <Login />;
  return <LeadDetalleContent leadId={leadId} onClose={onClose} onLeadUpdated={onLeadUpdated} />;
}
