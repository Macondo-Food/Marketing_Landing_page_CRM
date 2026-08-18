import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getLeadDetalle } from '../services/api.js';
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
  alta: 'Alta',
  media_alta: 'Media-alta',
  en_revision: 'En revisión',
};

const PRIORIDAD_COLORS = {
  alta: { bg: 'rgba(220,53,69,.12)', text: '#DC3545' },
  media_alta: { bg: 'rgba(217,164,6,.15)', text: '#9A7B0A' },
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

const navLinkStyle = {
  padding: '8px 16px',
  borderRadius: 6,
  border: '1px solid #DADADE',
  background: '#fff',
  color: '#1F1F1F',
  textDecoration: 'none',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 600,
  fontSize: 12,
  boxShadow: '0 1px 2px rgba(0,0,0,.04)',
};

function Field({ label, value }) {
  return (
    <div>
      <p style={fieldLabelStyle}>{label}</p>
      <p style={fieldValueStyle}>{value ?? '—'}</p>
    </div>
  );
}

function LeadDetalleContent() {
  const { id } = useParams();
  const { token, logout } = useAuth();
  const [lead, setLead] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [error, setError] = useState('');

  const loadLead = useCallback(() => {
    setStatus('loading');
    setError('');
    return getLeadDetalle(token, id)
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
  }, [token, id, logout]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F9F9F9',
        color: '#1F1F1F',
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        padding: '32px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
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
          <h1 style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22 }}>
            Detalle del lead
          </h1>
        </div>
        <Link to="/crm" style={navLinkStyle}>
          ← Volver a leads
        </Link>
      </div>

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
        <div style={{ maxWidth: 720 }}>
          <div style={cardStyle}>
            <p style={cardTitleStyle}>Datos de contacto</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <Field label="Nombre" value={lead.nombre} />
              <Field label="Empresa" value={lead.empresa} />
              <Field label="Email" value={lead.email} />
              <Field label="Teléfono" value={lead.telefono} />
            </div>
          </div>

          <div style={cardStyle}>
            <p style={cardTitleStyle}>Origen</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <Field label="UTM Source" value={lead.utm_source} />
              <Field label="UTM Medium" value={lead.utm_medium} />
              <Field label="UTM Campaign" value={lead.utm_campaign} />
              <Field label="UTM Content" value={lead.utm_content} />
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
            </div>
            <p style={{ margin: '16px 0 0', fontSize: 13, color: lead.calendar_event_id ? '#15803D' : '#6B6B6B' }}>
              {lead.calendar_event_id
                ? 'Ya tiene una reunión agendada.'
                : 'Todavía no tiene una reunión agendada.'}
            </p>
          </div>

          <div style={{ ...cardStyle, marginBottom: 0 }}>
            <p style={cardTitleStyle}>Respuestas del quiz</p>
            {lead.respuestas.length === 0 ? (
              <p style={{ fontSize: 14, color: '#6B6B6B' }}>No hay respuestas registradas.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {lead.respuestas.map((r) => (
                  <div key={r.pregunta}>
                    <p style={fieldLabelStyle}>{PREGUNTA_LABELS[r.pregunta] ?? r.pregunta}</p>
                    <p style={{ ...fieldValueStyle, margin: 0 }}>{r.respuesta}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadDetalle() {
  const { token } = useAuth();
  return token ? <LeadDetalleContent /> : <Login />;
}
